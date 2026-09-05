// RazorpayX (Razorpay Payouts) — settles vendor earnings to a linked bank
// account. Requires a separate RazorpayX key pair plus the merchant settlement
// account number. Env-gated: when not configured, payout requests return 503
// (fail-closed — we never simulate a money transfer).

import Razorpay from 'razorpay';

export function isRazorpayXConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAYX_KEY_ID &&
      process.env.RAZORPAYX_KEY_SECRET &&
      process.env.RAZORPAYX_ACCOUNT_NUMBER,
  );
}

let xClient: Razorpay | null = null;

export function getRazorpayXClient(): Razorpay {
  if (!isRazorpayXConfigured()) {
    throw new Error('RazorpayX not configured');
  }
  if (!xClient) {
    xClient = new Razorpay({
      key_id: process.env.RAZORPAYX_KEY_ID!,
      key_secret: process.env.RAZORPAYX_KEY_SECRET!,
    });
  }
  return xClient;
}

export interface VendorPayoutInput {
  name: string;
  phone: string;
  accountNumber: string;
  ifsc: string;
  holderName: string;
  amount: number; // rupees
  referenceId: string; // must be unique per payout
}

// Creates the vendor contact + fund account and initiates an IMPS transfer to
// their bank account. Uses the SDK's generic HTTP client because the 2.x
// typings don't expose the RazorpayX (contacts/payouts) resources.
export async function createVendorPayout(input: VendorPayoutInput): Promise<{ id: string; status: string }> {
  const client = getRazorpayXClient();

  const contact = await client.api.post<
    { name: string; contact: string; type: string; notes?: Record<string, string> },
    { id: string }
  >({
    url: '/v1/contacts',
    data: {
      name: input.name,
      contact: input.phone,
      type: 'vendor',
      notes: { reference: input.referenceId },
    },
  });

  const fundAccount = await client.api.post<
    { contact_id: string; account_type: string; bank_account: Record<string, string> },
    { id: string }
  >({
    url: '/v1/fund_accounts',
    data: {
      contact_id: contact.id,
      account_type: 'bank_account',
      bank_account: {
        name: input.holderName,
        ifsc: input.ifsc,
        account_number: input.accountNumber,
      },
    },
  });

  const payout = await client.api.post<
    Record<string, unknown>,
    { id: string; status: string }
  >({
    url: '/v1/payouts',
    data: {
      account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
      fund_account_id: fundAccount.id,
      amount: Math.round(input.amount * 100),
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      reference_id: input.referenceId,
      narration: `BazaarSetu vendor settlement ${input.referenceId}`,
    },
  });

  return { id: payout.id, status: payout.status };
}
