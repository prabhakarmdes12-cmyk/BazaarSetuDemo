export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'customer' | 'vendor' | 'admin';
  referralCode?: string;
  createdAt: string;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  image: string;
  lat: number;
  lng: number;
  isActive: boolean;
  rating: number;
  upiId?: string;
  isFavorite?: boolean;
  distance?: number;
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  /** Optional strikethrough MRP; when omitted the card derives a deterministic one. */
  mrp?: number;
  image: string;
  category: string;
  unit: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface Chat {
  id: string;
  customerId: string;
  shopId: string;
  customerName?: string;
  shopName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
}

export type MessageType =
  | 'TEXT'
  | 'PRODUCT'
  | 'VOICE_ORDER'
  | 'BAZAAR.BASKET_PROPOSAL'
  | 'BAZAAR.SUBSTITUTION'
  | 'BAZAAR.FINAL_QUOTE'
  | 'BAZAAR.ORDER_CARD'
  | 'BAZAAR.PAYMENT_REQUEST'
  | 'BAZAAR.UDHAAR_RECEIPT'
  | 'CHITIGRAM.CALL_RECORD'
  | (string & {});

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderRole: 'customer' | 'vendor' | 'CUSTOMER' | 'MERCHANT' | 'SHOP_BOT' | 'CHITI_OPERATOR';
  type: MessageType;
  content: string;
  product?: Product;
  payload?: unknown;
  isRead?: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  id: string;
  customerId: string;
  shopId: string;
  shopName?: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'pickup' | 'completed' | 'rejected';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  shopId: string;
  shopName?: string;
  customerName?: string;
  publicToken?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: string;
  isRead: boolean;
  createdAt: string;
}

export interface UdharEntry {
  id: string;
  type: string;
  amount: number;
  note: string;
  createdAt: string;
}

export interface UdharLedger {
  id: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  creditLimit?: number;
  lastRemindedAt?: string | null;
  dsoDays?: number;
  entries: UdharEntry[];
}

export interface UdhaarVendorSummary {
  totalDue: number;
  totalPaid: number;
  outstanding: number;
  collectionRate: number;
  customerCount: number;
  activeCustomerCount: number;
  dsoDays: number;
  overdueCount: number;
  creditUtilization: number;
}

export interface UdhaarPayment {
  id: string;
  amount: number;
  method: string;
  status: string;
  customerId: string;
  customerName: string;
  createdAt: string;
}

export interface UdhaarPaymentsResponse {
  payments: UdhaarPayment[];
  total: number;
  collectedToday: number;
  totalCollected: number;
}

export interface ReferralInfo {
  code: string | null;
  totalCount: number;
  joinedCount: number;
  pendingCount: number;
  rewardedCount: number;
  rewardAmount: number;
}

export interface VendorSummary {
  today: { orders: number; revenue: number; pending: number; completed: number };
  overall: { totalOrders: number; totalRevenue: number };
  topProducts: { name: string; qty: number; revenue: number }[];
}

export interface TypingUser {
  userId: string;
  userRole: string;
  chatId: string;
}

export const ORDER_STEPS: { key: OrderStatus; label: string; labelHi: string; icon: string }[] = [
  { key: 'pending', label: 'Placed', labelHi: 'Order Diya', icon: 'edit_note' },
  { key: 'accepted', label: 'Accepted', labelHi: 'Sweekar Kiya', icon: 'check_circle' },
  { key: 'preparing', label: 'Preparing', labelHi: 'Ban Raha Hai', icon: 'package_2' },
  { key: 'ready', label: 'Ready', labelHi: 'Taiyaar Hai', icon: 'inventory_2' },
  { key: 'out_for_delivery', label: 'Out for delivery', labelHi: 'Delivery Ke Liye Nikla', icon: 'local_shipping' },
  { key: 'pickup', label: 'Pickup ready', labelHi: 'Pickup Ready', icon: 'storefront' },
  { key: 'completed', label: 'Completed', labelHi: 'Complete Ho Gaya', icon: 'celebration' },
];

export const CATEGORIES = [
  'General', 'Grains', 'Oil', 'Dairy', 'Vegetables', 'Fruits',
  'Snacks', 'Beverages', 'Essentials', 'Spices', 'Personal Care', 'Household',
];
