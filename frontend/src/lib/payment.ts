'use client';

// Payment methods.
//
// These mirror the backend contract exactly — createOrderSchema accepts
// paymentMethod: 'COD' | 'DIRECT_UPI' | 'UDHAAR' | 'RAZORPAY', and
// getAvailableCheckoutMethods() narrows that set in pilot mode
// (default pilot allow-list: DIRECT_UPI, COD, UDHAAR).
//
// UPI is deliberately listed first: it is the default payment mental model in
// India, and DIRECT_UPI settles straight to the shopkeeper's VPA with no
// gateway cut — which is the whole point for a kirana.

export type PaymentMethod = 'DIRECT_UPI' | 'COD' | 'UDHAAR' | 'RAZORPAY';

export interface PaymentOption {
  method: PaymentMethod;
  title: string;
  /** Hinglish subtitle — the money screen must speak the user's language. */
  subtitle: string;
  icon: string;
  /** Shown as a small chip on the row. */
  tag?: string;
  recommended?: boolean;
}

export const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    method: 'DIRECT_UPI',
    title: 'UPI se pay karein',
    subtitle: 'GPay, PhonePe, Paytm — seedha dukaandar ko',
    icon: 'account_balance_wallet',
    tag: 'Sabse tez',
    recommended: true,
  },
  {
    method: 'COD',
    title: 'Cash on delivery',
    subtitle: 'Saamaan milne par cash dein',
    icon: 'payments',
  },
  {
    method: 'UDHAAR',
    title: 'Udhaar khaate mein',
    subtitle: 'Baad mein chukayein — bharose ka khaata',
    icon: 'receipt_long',
    tag: 'Regular grahak',
  },
  {
    method: 'RAZORPAY',
    title: 'Card / Netbanking',
    subtitle: 'Debit, credit ya netbanking se',
    icon: 'credit_card',
  },
];

/**
 * Build a UPI deep link (BHIM UPI spec). Opening this hands off to whichever
 * UPI app the user has installed, which is how DIRECT_UPI avoids a gateway.
 */
export function buildUpiLink(params: {
  vpa: string;
  payeeName: string;
  amount: number;
  note?: string;
  txnRef?: string;
}): string {
  const q = new URLSearchParams({
    pa: params.vpa,
    pn: params.payeeName,
    am: params.amount.toFixed(2),
    cu: 'INR',
  });
  if (params.note) q.set('tn', params.note);
  if (params.txnRef) q.set('tr', params.txnRef);
  return `upi://pay?${q.toString()}`;
}

export function paymentLabel(method: PaymentMethod): string {
  return PAYMENT_OPTIONS.find((o) => o.method === method)?.title || method;
}
