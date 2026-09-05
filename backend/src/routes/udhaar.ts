import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { udhaarEntrySchema, udhaarCreditLimitSchema, udhaarPaySchema, udhaarPaylinkSchema } from '../validators';
import { buildWhatsAppLink, buildReminderMessage } from '../lib/whatsapp';
import { isRazorpayConfigured, getRazorpayClient } from '../lib/razorpay';
import { prisma } from '../lib/prisma';

const router = Router();

const REMIND_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const OVERDUE_DAYS = 30;

interface EntryLike {
  type: string;
  amount: number;
  createdAt: Date;
}

// FIFO days-to-pay: each payment is matched against the oldest credit it
// covers; still-unpaid credit counts toward aging. Returns the mean collection
// days (DSO proxy) for a single ledger.
function computeDso(entries: EntryLike[]): { avgDays: number; sampleCount: number; oldestCreditAgeDays: number } {
  const credits = entries
    .filter((e: any) => e.type === 'CREDIT')
    .sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime());
  const payments = entries
    .filter((e: any) => e.type === 'PAYMENT')
    .sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime());

  const daysList: number[] = [];
  let paymentIndex = 0;
  for (const credit of credits) {
    let remaining = credit.amount;
    while (remaining > 0 && paymentIndex < payments.length) {
      const payment = payments[paymentIndex];
      const applied = Math.min(remaining, payment.amount);
      const days = (payment.createdAt.getTime() - credit.createdAt.getTime()) / 86_400_000;
      if (days >= 0) daysList.push(days);
      remaining -= applied;
      payments[paymentIndex] = { ...payment, amount: payment.amount - applied };
      if (payments[paymentIndex].amount <= 0) paymentIndex++;
    }
  }

  const now = Date.now();
  const oldestCreditAgeDays = credits.length
    ? (now - credits[0].createdAt.getTime()) / 86_400_000
    : 0;

  if (daysList.length === 0) return { avgDays: 0, sampleCount: 0, oldestCreditAgeDays };
  return {
    avgDays: daysList.reduce((s: any, d: any) => s + d, 0) / daysList.length,
    sampleCount: daysList.length,
    oldestCreditAgeDays,
  };
}

// Get udhaar ledger for a customer-shop pair (customer's own view)
router.get('/:shopId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const ledger = await prisma.udharLedger.findUnique({
      where: { customerId_shopId: { customerId: req.userId!, shopId: req.params.shopId } },
      include: { entries: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });

    if (!ledger) {
      return res.json({ success: true, data: { totalDue: 0, totalPaid: 0, balance: 0, creditLimit: 0, entries: [] } });
    }

    res.json({
      success: true,
      data: {
        id: ledger.id,
        totalDue: ledger.totalDue,
        totalPaid: ledger.totalPaid,
        balance: ledger.totalDue - ledger.totalPaid,
        creditLimit: ledger.creditLimit,
        lastRemindedAt: ledger.lastRemindedAt ? ledger.lastRemindedAt.toISOString() : null,
        entries: ledger.entries.map((e: any) => ({
          id: e.id,
          type: e.type,
          amount: e.amount,
          note: e.note,
          createdAt: e.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get udhaar' });
  }
});

// Vendor: add udhaar entry
router.post('/entry', authenticateToken, requireRole('vendor'), validate(udhaarEntrySchema), async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, shopId, type, amount, note } = req.body;

    // Verify vendor owns the shop
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop || shop.ownerId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let ledger = await prisma.udharLedger.findUnique({
      where: { customerId_shopId: { customerId, shopId } },
    });

    if (!ledger) {
      ledger = await prisma.udharLedger.create({
        data: { customerId, shopId },
      });
    }

    // Amount is guaranteed positive by the zod schema (z.number().positive()).
    const updateData = type === 'CREDIT'
      ? { totalDue: { increment: amount } }
      : { totalPaid: { increment: amount } };

    await prisma.udharLedger.update({
      where: { id: ledger.id },
      data: { ...updateData, lastUpdated: new Date() },
    });

    const entry = await prisma.udharEntry.create({
      data: { ledgerId: ledger.id, type, amount, note: note || '' },
    });

    res.json({ success: true, data: { entryId: entry.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add entry' });
  }
});

// Vendor: record a payment against a customer ledger
// Creates a PAYMENT entry, bumps totalPaid and logs a Payment row (receipt).
router.post('/vendor/:customerId/pay', authenticateToken, requireRole('vendor'), validate(udhaarPaySchema), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const { amount, method, reference } = req.body;
    const ledger = await prisma.udharLedger.findUnique({
      where: { customerId_shopId: { customerId: req.params.customerId, shopId: shop.id } },
    });
    if (!ledger) return res.status(404).json({ success: false, message: 'Ledger not found' });

    const balance = ledger.totalDue - ledger.totalPaid;
    if (balance <= 0) {
      return res.status(400).json({ success: false, message: 'No outstanding balance' });
    }
    if (amount > balance) {
      return res.status(400).json({
        success: false,
        message: 'Payment exceeds outstanding balance',
        balance,
      });
    }

    const payment = await prisma.$transaction(async (tx: any) => {
      const entry = await tx.udharEntry.create({
        data: { ledgerId: ledger.id, type: 'PAYMENT', amount, note: `Paid via ${method}` },
      });

      await tx.udharLedger.update({
        where: { id: ledger.id },
        data: { totalPaid: { increment: amount }, lastUpdated: new Date() },
      });

      return tx.payment.create({
        data: {
          ledgerId: ledger.id,
          shopId: shop.id,
          customerId: req.params.customerId,
          amount,
          method,
          ...(reference ? { reference } : {}),
        },
      });
    });

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        method: payment.method,
        newBalance: balance - amount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
});

// Vendor: create a Razorpay payment link for a customer ledger
// Creates a pending Payment row; the webhook flips it to paid on confirmation.
router.post('/vendor/:customerId/paylink', authenticateToken, requireRole('vendor'), validate(udhaarPaylinkSchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({ success: false, message: 'Online payments abhi available nahi hain' });
    }

    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const ledger = await prisma.udharLedger.findUnique({
      where: { customerId_shopId: { customerId: req.params.customerId, shopId: shop.id } },
      include: { customer: { select: { name: true, phone: true } } },
    });
    if (!ledger) return res.status(404).json({ success: false, message: 'Ledger not found' });

    const balance = ledger.totalDue - ledger.totalPaid;
    if (balance <= 0) return res.status(400).json({ success: false, message: 'No outstanding balance' });

    const amount = Math.min(req.body.amount ?? balance, balance);
    const amountPaise = Math.round(amount * 100);

    const link = await getRazorpayClient().paymentLink.create({
      amount: amountPaise,
      currency: 'INR',
      accept_partial: false,
      description: `Udhaar payment for ${shop.name}`,
      customer: { name: ledger.customer.name, contact: ledger.customer.phone },
      notify: { sms: false, email: false, whatsapp: false },
      notes: { ledgerId: ledger.id, customerId: ledger.customerId, shopId: shop.id },
    });

    const payment = await prisma.payment.create({
      data: {
        ledgerId: ledger.id,
        shopId: shop.id,
        customerId: ledger.customerId,
        amount,
        method: 'upi',
        reference: link.id,
        status: 'pending',
      },
    });

    res.json({
      success: true,
      data: { paymentId: payment.id, linkId: link.id, linkUrl: link.short_url },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create payment link' });
  }
});

// Vendor: get all udhaar ledgers
router.get('/vendor/all', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const ledgers = await prisma.udharLedger.findMany({
      where: { shopId: shop.id, totalDue: { gt: 0 } },
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { lastUpdated: 'desc' },
    });

    const formatted = ledgers.map((l: any) => {
      const balance = l.totalDue - l.totalPaid;
      return {
        id: l.id,
        customerId: l.customerId,
        customerName: l.customer.name,
        customerPhone: l.customer.phone,
        totalDue: l.totalDue,
        totalPaid: l.totalPaid,
        balance,
        creditLimit: l.creditLimit,
        lastRemindedAt: l.lastRemindedAt ? l.lastRemindedAt.toISOString() : null,
        lastUpdated: l.lastUpdated.toISOString(),
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// Vendor: aggregate udhaar summary + credit health (DSO, collection, overdue)
router.get('/vendor/summary', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const ledgers = await prisma.udharLedger.findMany({
      where: { shopId: shop.id },
      include: { entries: { select: { type: true, amount: true, createdAt: true } } },
    });

    const totalDue = ledgers.reduce((s: any, l: any) => s + l.totalDue, 0);
    const totalPaid = ledgers.reduce((s: any, l: any) => s + l.totalPaid, 0);
    const outstanding = totalDue - totalPaid;

    const active = ledgers.filter((l: any) => l.totalDue - l.totalPaid > 0);
    const dsoAgg = active.map((l: any) => computeDso(l.entries));
    const weightedSamples = dsoAgg.reduce((s: any, d: any) => s + d.sampleCount, 0);
    const dsoDays = weightedSamples
      ? dsoAgg.reduce((s: any, d: any) => s + d.avgDays * d.sampleCount, 0) / weightedSamples
      : 0;
    const overdueCount = dsoAgg.filter((d: any) => d.oldestCreditAgeDays > OVERDUE_DAYS).length;

    const limitBase = ledgers.filter((l: any) => l.creditLimit > 0);
    const creditUtilization = limitBase.length
      ? (limitBase.reduce((s: any, l: any) => s + (l.totalDue - l.totalPaid), 0) /
          limitBase.reduce((s: any, l: any) => s + l.creditLimit, 0)) *
        100
      : 0;

    res.json({
      success: true,
      data: {
        totalDue,
        totalPaid,
        outstanding,
        collectionRate: totalDue > 0 ? (totalPaid / totalDue) * 100 : 100,
        customerCount: ledgers.length,
        activeCustomerCount: active.length,
        dsoDays: Math.round(dsoDays * 10) / 10,
        overdueCount,
        creditUtilization: Math.round(creditUtilization * 10) / 10,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get summary' });
  }
});

// Vendor: payments history (optional per-customer filter, paginated)
router.get('/vendor/payments', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const customerId = typeof req.query.customerId === 'string' ? req.query.customerId : undefined;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 200);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);

    const where = { shopId: shop.id, ...(customerId ? { customerId } : {}) };

    const [payments, total, todayAgg, totalAgg] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { ...where, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({ where, _sum: { amount: true } }),
    ]);

    res.json({
      success: true,
      data: {
        payments: payments.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          status: p.status,
          customerId: p.customerId,
          customerName: p.customer.name,
          createdAt: p.createdAt.toISOString(),
        })),
        total,
        collectedToday: todayAgg._sum.amount ?? 0,
        totalCollected: totalAgg._sum.amount ?? 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get payments' });
  }
});

// Vendor: single customer ledger (entries + credit info)
router.get('/vendor/:customerId', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const ledger = await prisma.udharLedger.findUnique({
      where: { customerId_shopId: { customerId: req.params.customerId, shopId: shop.id } },
      include: {
        entries: { orderBy: { createdAt: 'desc' } },
        customer: { select: { name: true, phone: true } },
      },
    });

    if (!ledger) return res.status(404).json({ success: false, message: 'Ledger not found' });

    const dso = computeDso(ledger.entries);

    res.json({
      success: true,
      data: {
        id: ledger.id,
        customerId: ledger.customerId,
        customerName: ledger.customer.name,
        customerPhone: ledger.customer.phone,
        totalDue: ledger.totalDue,
        totalPaid: ledger.totalPaid,
        balance: ledger.totalDue - ledger.totalPaid,
        creditLimit: ledger.creditLimit,
        lastRemindedAt: ledger.lastRemindedAt ? ledger.lastRemindedAt.toISOString() : null,
        dsoDays: Math.round(dso.avgDays * 10) / 10,
        oldestCreditAgeDays: Math.round(dso.oldestCreditAgeDays * 10) / 10,
        entries: ledger.entries.map((e: any) => ({
          id: e.id,
          type: e.type,
          amount: e.amount,
          note: e.note,
          createdAt: e.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get ledger' });
  }
});

// Vendor: set credit limit for a customer
router.post('/vendor/:customerId/limit', authenticateToken, requireRole('vendor'), validate(udhaarCreditLimitSchema), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const { creditLimit } = req.body;
    const customer = await prisma.user.findUnique({ where: { id: req.params.customerId } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const ledger = await prisma.udharLedger.upsert({
      where: { customerId_shopId: { customerId: req.params.customerId, shopId: shop.id } },
      create: { customerId: req.params.customerId, shopId: shop.id, creditLimit },
      update: { creditLimit, lastUpdated: new Date() },
    });

    res.json({ success: true, data: { ledgerId: ledger.id, creditLimit: ledger.creditLimit } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to set credit limit' });
  }
});

// Vendor: remind a customer about outstanding balance (7-day throttle)
router.post('/vendor/:customerId/remind', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const ledger = await prisma.udharLedger.findUnique({
      where: { customerId_shopId: { customerId: req.params.customerId, shopId: shop.id } },
      include: { customer: { select: { name: true, phone: true } } },
    });
    if (!ledger) return res.status(404).json({ success: false, message: 'Ledger not found' });

    const balance = ledger.totalDue - ledger.totalPaid;
    if (balance <= 0) {
      return res.status(400).json({ success: false, message: 'No outstanding balance' });
    }

    const now = Date.now();
    if (ledger.lastRemindedAt && now - ledger.lastRemindedAt.getTime() < REMIND_COOLDOWN_MS) {
      return res.status(429).json({
        success: false,
        message: 'Reminder already sent recently',
        nextRemindAt: new Date(ledger.lastRemindedAt.getTime() + REMIND_COOLDOWN_MS).toISOString(),
      });
    }

    await prisma.udharLedger.update({
      where: { id: ledger.id },
      data: { lastRemindedAt: new Date() },
    });

    const text = buildReminderMessage(shop.name, ledger.customer.name, balance);
    const link = buildWhatsAppLink(ledger.customer.phone, text);

    res.json({ success: true, data: { message: text, link, sentAt: new Date().toISOString() } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send reminder' });
  }
});

export default router;
