// Guest cart — a localStorage cart that lets anonymous shoppers add items and
// browse until checkout, then merge into their server cart on login/register.
// Keyed per product id; quantities are merged, never duplicated.

import { api } from './api';

export interface GuestCartItem {
  productId: string;
  shopId: string;
  shopName: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  quantity: number;
  // Optional strikethrough MRP + branded icon-tile metadata (used by the
  // icon-based Bighi master catalog, which ships no product photos).
  mrp?: number;
  icon?: string;
  from?: string;
  to?: string;
}

const KEY = 'chitibazaar_guest_cart';

function read(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GuestCartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: GuestCartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full/blocked — guest cart is best-effort */
  }
}

export function getGuestCart(): GuestCartItem[] {
  return read();
}

export function addToGuestCart(item: Omit<GuestCartItem, 'quantity'>, quantity = 1): GuestCartItem[] {
  const items = read();
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + quantity);
  } else {
    items.push({ ...item, quantity });
  }
  write(items);
  return items;
}

export function updateGuestQuantity(productId: string, quantity: number): GuestCartItem[] {
  if (quantity <= 0) return removeGuestItem(productId);
  const items = read().map((i) => (i.productId === productId ? { ...i, quantity } : i));
  write(items);
  return items;
}

export function removeGuestItem(productId: string): GuestCartItem[] {
  const items = read().filter((i) => i.productId !== productId);
  write(items);
  return items;
}

export function clearGuestCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}

export function guestCartCount(): number {
  return read().reduce((s, i) => s + i.quantity, 0);
}

// Merge the local guest cart into the server cart. Backend add increments
// quantity for an existing product, so re-running this is idempotent per item.
export async function mergeGuestCart(token: string): Promise<{ merged: number; failed: number }> {
  const items = read();
  if (items.length === 0) return { merged: 0, failed: 0 };

  let merged = 0;
  let failed = 0;
  for (const item of items) {
    try {
      await api.post(
        '/api/cart',
        { shopId: item.shopId, productId: item.productId, quantity: item.quantity },
        token,
      );
      merged++;
    } catch {
      failed++;
    }
  }
  // Only drop the local copy once everything made it to the server; a partial
  // merge keeps the leftover items so nothing is silently lost.
  if (failed === 0) clearGuestCart();
  return { merged, failed };
}
