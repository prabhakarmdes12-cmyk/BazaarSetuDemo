'use client';

// Delivery addresses — local-first, like the guest cart.
//
// A hyperlocal delivery app cannot place an order without knowing where to
// deliver. The backend's POST /api/orders already accepts deliveryAddress,
// deliveryPincode, deliveryLat and deliveryLng (see createOrderSchema); this
// module is the client-side book of saved addresses that feeds those fields.
//
// Stored in localStorage so a guest can enter an address before signing up and
// keep it after login, matching how guestCart already behaves.

export type AddressLabel = 'Ghar' | 'Dukaan' | 'Kaam' | 'Anya';

export interface DeliveryAddress {
  id: string;
  /** Ghar / Dukaan / Kaam / Anya — shown as a chip, not free text. */
  label: AddressLabel;
  /** House / flat / building. */
  line1: string;
  /** Area, landmark. */
  line2: string;
  city: string;
  pincode: string;
  /** Optional geolocation, when the user grants permission. */
  lat?: number;
  lng?: number;
  /** Contact for the rider — may differ from the account holder. */
  contactName?: string;
  contactPhone?: string;
  isDefault?: boolean;
  createdAt: number;
}

const KEY = 'chitibazaar_addresses';

export const ADDRESS_LABELS: { value: AddressLabel; icon: string }[] = [
  { value: 'Ghar', icon: 'home' },
  { value: 'Dukaan', icon: 'storefront' },
  { value: 'Kaam', icon: 'work' },
  { value: 'Anya', icon: 'location_on' },
];

function read(): DeliveryAddress[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DeliveryAddress[]) : [];
  } catch {
    return [];
  }
}

function write(items: DeliveryAddress[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full/blocked — best effort, same as guestCart */
  }
}

export function getAddresses(): DeliveryAddress[] {
  return read().sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.createdAt - a.createdAt);
}

export function getDefaultAddress(): DeliveryAddress | null {
  const all = read();
  return all.find((a) => a.isDefault) || all[0] || null;
}

export function saveAddress(
  input: Omit<DeliveryAddress, 'id' | 'createdAt'> & { id?: string },
): DeliveryAddress {
  const all = read();
  const id = input.id || `addr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const record: DeliveryAddress = { ...input, id, createdAt: Date.now() };

  // Only one default at a time.
  const next = all
    .filter((a) => a.id !== id)
    .map((a) => (record.isDefault ? { ...a, isDefault: false } : a));

  next.push(record);
  // First address is always the default.
  if (next.length === 1) next[0].isDefault = true;
  write(next);
  return record;
}

export function removeAddress(id: string) {
  const next = read().filter((a) => a.id !== id);
  // Never leave the book without a default.
  if (next.length && !next.some((a) => a.isDefault)) next[0].isDefault = true;
  write(next);
}

export function setDefaultAddress(id: string) {
  write(read().map((a) => ({ ...a, isDefault: a.id === id })));
}

/** Single-line rendering for headers and the cart summary row. */
export function formatAddress(a: DeliveryAddress): string {
  return [a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(', ');
}

/** Short form for the top bar, where space is tight. */
export function shortAddress(a: DeliveryAddress): string {
  return [a.line1, a.line2].filter(Boolean).join(', ') || a.city;
}

export function isServiceablePincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}
