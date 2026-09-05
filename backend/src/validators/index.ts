import { z } from 'zod';

// === Auth ===
export const sendOtpSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Invalid phone number (10 digits required)'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Invalid phone number'),
  otp: z.string().regex(/^[0-9]{4,6}$/, 'Invalid OTP'),
});

// Admin role can never be self-assigned through the public API.
// DPDP: registration requires explicit consent to the privacy policy.
export const registerSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Invalid phone number'),
  name: z.string().min(1).max(100),
  role: z.enum(['customer', 'vendor']).optional(),
  ref: z.string().min(3).max(20).optional(),
  acceptPrivacy: z.literal(true, 'Privacy policy consent is required'),
});

// === Products ===
export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  unit: z.string().min(1).max(20),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  image: z.string().max(1000).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price: z.number().positive().optional(),
  unit: z.string().min(1).max(20).optional(),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  image: z.string().max(1000).optional(),
  isAvailable: z.boolean().optional(),
});

// === Cart ===
export const addToCartSchema = z.object({
  shopId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(99).optional(),
});

export const updateCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

// === Orders ===
export const createOrderSchema = z.object({
  shopId: z.string().uuid(),
  paymentMethod: z.enum(['COD', 'DIRECT_UPI', 'UDHAAR', 'RAZORPAY']).optional(),
  deliveryAddress: z.string().max(500).optional(),
  deliveryPincode: z.string().regex(/^\d{6}$/, 'Invalid PIN code').optional(),
  deliveryLat: z.number().min(-90).max(90).optional(),
  deliveryLng: z.number().min(-180).max(180).optional(),
});

const allowedOrderStatuses = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'pickup', 'completed', 'rejected'];

export const updateOrderStatusSchema = z.object({
  status: z.string().refine((value) => allowedOrderStatuses.includes(value.toLowerCase()), 'Invalid order status'),
});

// === Chats ===
export const createChatSchema = z.object({
  shopId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(['TEXT', 'PRODUCT']).optional(),
});

// === Shop Bot / Conversational Commerce ===
export const shopBotParseSchema = z.object({
  customerId: z.string().min(1).max(100),
  shopId: z.string().min(1).max(100),
  conversationId: z.string().min(1).max(100),
  message: z.string().min(1).max(5000),
  locale: z.enum(['hi-IN', 'en-IN', 'hinglish']).optional(),
  clientActionId: z.string().min(1).max(120).optional(),
});

export const confirmDraftSchema = z.object({
  clientActionId: z.string().min(1).max(120).optional(),
});

export const draftAdjustmentSchema = z.object({
  itemId: z.string().min(1).max(100).optional(),
  type: z.enum(['PRICE_CHANGE', 'QUANTITY_CHANGE', 'SUBSTITUTION', 'UNAVAILABLE', 'CUSTOM_ITEM']).optional(),
  originalText: z.string().max(500).optional(),
  proposedName: z.string().max(200).optional(),
  proposedQuantity: z.number().positive().max(100000).optional(),
  proposedPrice: z.number().min(0).max(100000000).optional(),
  replacement: z.string().max(200).optional(),
  price: z.number().min(0).max(100000000).optional(),
  reason: z.string().max(500).optional(),
});

export const respondAdjustmentSchema = z.object({
  status: z.enum(['CUSTOMER_ACCEPTED', 'CUSTOMER_DECLINED']).optional(),
  action: z.enum(['ACCEPT', 'REJECT', 'ACCEPT_SUBSTITUTION', 'REJECT_SUBSTITUTION']).optional(),
});

export const finalQuoteSchema = z.object({
  subtotal: z.number().min(0).max(100000000).optional(),
  quotedSubtotal: z.number().min(0).max(100000000).optional(),
  deliveryFee: z.number().min(0).max(1000000).optional(),
  finalTotal: z.number().min(0).max(100000000).optional(),
  clientActionId: z.string().min(1).max(120).optional(),
});

export const draftCheckoutSchema = z.object({
  paymentMethod: z.enum(['COD', 'DIRECT_UPI', 'UDHAAR', 'RAZORPAY']).optional(),
  clientActionId: z.string().min(1).max(120).optional(),
  deliveryAddress: z.string().max(500).optional(),
  deliveryPincode: z.string().regex(/^\d{6}$/, 'Invalid PIN code').optional(),
  deliveryLat: z.number().min(-90).max(90).optional(),
  deliveryLng: z.number().min(-180).max(180).optional(),
});

export const callRecordSchema = z.object({
  conversationId: z.string().min(1).max(100).optional(),
  chatId: z.string().min(1).max(100).optional(),
  callId: z.string().min(1).max(120).optional(),
  duration: z.number().min(0).max(86400).optional(),
  status: z.string().min(1).max(40),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
});

// === Favorites ===
export const toggleFavoriteSchema = z.object({
  shopId: z.string().uuid(),
});

// === Udhaar ===
export const udhaarEntrySchema = z.object({
  customerId: z.string().uuid(),
  shopId: z.string().uuid(),
  type: z.enum(['CREDIT', 'PAYMENT']),
  amount: z.number().positive(),
  note: z.string().max(200).optional(),
});

export const udhaarCreditLimitSchema = z.object({
  creditLimit: z.number().min(0).max(100_000_000),
});

export const udhaarPaySchema = z.object({
  amount: z.number().positive().max(100_000_000),
  method: z.enum(['upi', 'cash', 'wallet']),
  reference: z.string().max(200).optional(),
});

export const udhaarPaylinkSchema = z.object({
  amount: z.number().positive().max(100_000_000).optional(),
});

// === Referrals ===
export const claimReferralSchema = z.object({
  code: z.string().min(3).max(20),
  phone: z.string().regex(/^[0-9]{10}$/, 'Invalid phone number'),
  name: z.string().max(100).optional(),
});

// === Payouts ===
export const linkBankSchema = z.object({
  accountNumber: z.string().regex(/^\d{9,18}$/, 'Invalid account number (9-18 digits)'),
  ifsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
  bankName: z.string().min(2).max(60),
  holderName: z.string().min(2).max(60),
});

export const payoutRequestSchema = z.object({
  amount: z.number().positive().max(100_000_000),
  bankAccountId: z.string().uuid(),
});

// === Shops ===
export const updateShopSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  image: z.string().max(1000).optional(),
  upiId: z.string().max(100).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

// === Admin ===
export const adminToggleShopSchema = z.object({
  isActive: z.boolean(),
});

// === Upload ===
export const uploadSchema = z.object({
  image: z.string().min(1).max(7_000_000),
  filename: z.string().max(255).optional(),
});

// === Misc ===
export const idParamSchema = z.object({
  id: z.string().uuid(),
});
