import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { linkBankSchema, payoutRequestSchema } from '../validators';
import { encryptSecret, decryptSecret, maskAccountNumber } from '../lib/encrypt';
import { isRazorpayXConfigured, createVendorPayout } from '../lib/razorpayX';
import { prisma } from '../lib/prisma';
import { assertFinancialWriteReady, isFinancialGuardError } from '../lib/financialGuard';

const router = Router();

function sendFinancialGuardError(res: Response, err: unknown): boolean {
  if (!isFinancialGuardError(err)) return false;
  res.status(err.statusCode).json({
    success: false,
    code: err.code,
    message: 'Payouts are temporarily unavailable. Please retry once database health is restored.',
  });
  return true;
}

// Every payout route requires a vendor, and the vendor's shop is their only
// money context — resolve it once per request.
async function getVendorShop(userId: string) {
  return prisma.shop.findUnique({ where: { ownerId: userId } });
}

// Money that has actually been collected through the platform (paid Payments)
// minus what has already been settled out.
async function computeAvailable(shopId: string): Promise<{ totalCollected: number; paidOut: number }> {
  const [collectedAgg, paidOutAgg] = await Promise.all([
    prisma.payment.aggregate({
      where: { shopId, status: 'paid' },
      _sum: { amount: true },
    }),
    prisma.payout.aggregate({
      where: { shopId, status: { not: 'failed' } },
      _sum: { amount: true },
    }),
  ]);
  const totalCollected = collectedAgg._sum.amount ?? 0;
  const paidOut = paidOutAgg._sum.amount ?? 0;
  return { totalCollected, paidOut };
}

// Vendor: link a bank account (KYC stored encrypted, masked in responses)
router.post('/link-bank', authenticateToken, requireRole('vendor'), validate(linkBankSchema), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await getVendorShop(req.userId!);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const { accountNumber, ifsc, bankName, holderName } = req.body;

    const existingAccounts = await prisma.bankAccount.findMany({ where: { vendorId: req.userId! } });
    const existing = existingAccounts.find((a: any) => decryptSecret(a.accountNumber) === accountNumber);

    let account: Awaited<ReturnType<typeof prisma.bankAccount.create>>;
    if (existing) {
      account = await prisma.bankAccount.update({
        where: { id: existing.id },
        data: { ifsc, bankName, holderName },
      });
    } else {
      account = await prisma.bankAccount.create({
        data: {
          vendorId: req.userId!,
          accountNumber: encryptSecret(accountNumber),
          ifsc,
          bankName,
          holderName,
          isPrimary: existingAccounts.length === 0,
        },
      });
    }

    res.json({
      success: true,
      data: {
        bankAccountId: account.id,
        bankName: account.bankName,
        holderName: account.holderName,
        masked: maskAccountNumber(accountNumber),
        isPrimary: account.isPrimary,
      },
    });
  } catch (err) {
    console.error('Link bank error:', err);
    res.status(500).json({ success: false, message: 'Failed to link bank account' });
  }
});

// Vendor: payout dashboard — collected earnings, linked banks, recent payouts
router.get('/', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await getVendorShop(req.userId!);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const { totalCollected, paidOut } = await computeAvailable(shop.id);
    const availableForPayout = Math.max(totalCollected - paidOut, 0);

    const [banks, recentPayouts] = await Promise.all([
      prisma.bankAccount.findMany({
        where: { vendorId: req.userId! },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.payout.findMany({
        where: { vendorId: req.userId!, shopId: shop.id },
        include: { bankAccount: { select: { bankName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalCollected,
        paidOut,
        availableForPayout,
        razorpayXConfigured: isRazorpayXConfigured(),
        banks: banks.map((b: any) => ({
          id: b.id,
          bankName: b.bankName,
          holderName: b.holderName,
          masked: maskAccountNumber(decryptSecret(b.accountNumber)),
          isPrimary: b.isPrimary,
        })),
        recentPayouts: recentPayouts.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          bankName: p.bankAccount.bankName,
          gatewayReference: p.gatewayReference,
          createdAt: p.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error('Payouts dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to get payouts' });
  }
});

// Vendor: request a settlement of collected earnings to a linked bank account
router.post('/request', authenticateToken, requireRole('vendor'), validate(payoutRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    await assertFinancialWriteReady('vendor payout request');

    const shop = await getVendorShop(req.userId!);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const { amount, bankAccountId } = req.body;

    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id: bankAccountId, vendorId: req.userId! },
    });
    if (!bankAccount) return res.status(404).json({ success: false, message: 'Bank account not found' });

    if (!isRazorpayXConfigured()) {
      return res.status(503).json({ success: false, message: 'Settlement service abhi available nahi hai' });
    }

    const { totalCollected, paidOut } = await computeAvailable(shop.id);
    const availableForPayout = Math.max(totalCollected - paidOut, 0);
    if (amount > availableForPayout) {
      return res.status(400).json({
        success: false,
        message: 'Amount exceeds available payout balance',
        availableForPayout,
      });
    }

    const vendor = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    // Create the record first so the gateway reference id is stable & unique.
    const payout = await prisma.payout.create({
      data: {
        vendorId: req.userId!,
        shopId: shop.id,
        bankAccountId: bankAccount.id,
        amount,
        status: 'requested',
      },
    });

    try {
      const gateway = await createVendorPayout({
        name: vendor.name,
        phone: vendor.phone,
        accountNumber: decryptSecret(bankAccount.accountNumber),
        ifsc: bankAccount.ifsc,
        holderName: bankAccount.holderName,
        amount,
        referenceId: payout.id,
      });

      const status = ['processed', 'paid'].includes(gateway.status) ? 'paid' : 'processing';
      const updated = await prisma.payout.update({
        where: { id: payout.id },
        data: { status, gatewayReference: gateway.id },
      });

      return res.json({
        success: true,
        data: {
          payoutId: updated.id,
          amount: updated.amount,
          status: updated.status,
          gatewayReference: updated.gatewayReference,
        },
      });
    } catch (gatewayErr) {
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'failed' },
      });
      console.error('Payout gateway error:', gatewayErr);
      return res.status(502).json({ success: false, message: 'Payout request failed at the payment gateway' });
    }
  } catch (err) {
    if (sendFinancialGuardError(res, err)) return;
    console.error('Payout request error:', err);
    res.status(500).json({ success: false, message: 'Failed to request payout' });
  }
});

// Vendor: full payout history (paginated)
router.get('/history', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await getVendorShop(req.userId!);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 200);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);

    const where = { vendorId: req.userId!, shopId: shop.id };
    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: { bankAccount: { select: { bankName: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payout.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        payouts: payouts.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          bankName: p.bankAccount.bankName,
          gatewayReference: p.gatewayReference,
          createdAt: p.createdAt.toISOString(),
        })),
        total,
      },
    });
  } catch (err) {
    console.error('Payout history error:', err);
    res.status(500).json({ success: false, message: 'Failed to get payout history' });
  }
});

export default router;
