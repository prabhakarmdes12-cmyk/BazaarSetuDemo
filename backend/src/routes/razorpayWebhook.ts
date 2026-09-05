import { Router } from 'express';
import express from 'express';
import { verifyRazorpaySignature } from '../lib/razorpay';
import { prisma } from '../lib/prisma';
import { assertFinancialWriteReady, isFinancialGuardError } from '../lib/financialGuard';

const router = Router();

interface PaymentLinkEntity {
  id?: string;
  amount?: number;
  status?: string;
  notes?: Record<string, string | number>;
}

// Razorpay webhook (payment links). Mounted with express.raw() so the
// signature can be verified over the exact bytes Razorpay sent.
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  const raw = req.body as Buffer;
  const signature = (req.headers['x-razorpay-signature'] as string) || '';
  if (!verifyRazorpaySignature(raw, signature)) {
    return res.status(401).json({ success: false, message: 'Invalid signature' });
  }

  let payload: { event?: string; payload?: { payment_link?: { entity?: PaymentLinkEntity } } } = {};
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }

  const event = payload.event;
  const link = payload.payload?.payment_link?.entity;
  const linkId = link?.id;
  if (!linkId) return res.json({ success: true, ignored: true });

  if (event === 'payment_link.paid' || event === 'payment_link.payment_successful' || event === 'payment_link.cancelled') {
    try {
      await assertFinancialWriteReady(`Razorpay webhook ${event}`);
    } catch (err) {
      if (isFinancialGuardError(err)) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: 'Webhook money movement is temporarily unavailable. Retry after database health is restored.',
        });
      }
      console.error('Razorpay webhook financial guard error:', err);
      return res.status(500).json({ success: false, message: 'Webhook processing unavailable' });
    }
  }

  if (event === 'payment_link.paid' || event === 'payment_link.payment_successful') {
    const paidAmount = Math.round((link.amount ?? 0) / 100); // paise -> rupees
    if (paidAmount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const payment = await prisma.payment.findFirst({
      where: { reference: linkId, status: 'pending' },
    });
    if (!payment) return res.json({ success: true, ignored: true });

    await prisma.$transaction([
      prisma.udharEntry.create({
        data: { ledgerId: payment.ledgerId, type: 'PAYMENT', amount: paidAmount, note: 'Razorpay' },
      }),
      prisma.udharLedger.update({
        where: { id: payment.ledgerId },
        data: { totalPaid: { increment: paidAmount }, lastUpdated: new Date() },
      }),
      prisma.payment.update({ where: { id: payment.id }, data: { status: 'paid' } }),
    ]);

    return res.json({ success: true, received: paidAmount });
  }

  if (event === 'payment_link.cancelled') {
    await prisma.payment.updateMany({
      where: { reference: linkId, status: 'pending' },
      data: { status: 'failed' },
    });
    return res.json({ success: true, cancelled: true });
  }

  res.json({ success: true, ignored: true });
});

export default router;
