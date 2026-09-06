// Environment validation — fail fast in production, mirroring the chiti-console pattern.
// JWT secret is env-only with NO hardcoded fallback in production.

export type PilotCheckoutMethod = 'DIRECT_UPI' | 'COD' | 'UDHAAR' | 'RAZORPAY';

export interface PilotConfig {
  enabled: boolean;
  localityName: string;
  allowedPincodes: string[];
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  checkoutMethods: PilotCheckoutMethod[];
}

export interface PilotDeliveryInput {
  shop?: {
    lat?: number | null;
    lng?: number | null;
    address?: string | null;
  } | null;
  customer?: {
    lat?: number | null;
    lng?: number | null;
    address?: string | null;
    pincode?: string | null;
  } | null;
  deliveryAddress?: string | null;
  deliveryPincode?: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
}

export interface PilotDeliveryDecision {
  ok: boolean;
  localityName: string;
  pincode?: string;
  shopDistanceKm?: number;
  customerDistanceKm?: number;
  reasons: string[];
}

export class PilotPolicyError extends Error {
  statusCode: number;
  details: PilotDeliveryDecision | Record<string, unknown>;

  constructor(message: string, details: PilotDeliveryDecision | Record<string, unknown>, statusCode = 400) {
    super(message);
    this.name = 'PilotPolicyError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function envFlag(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'y', 'on'].includes(value.trim().toLowerCase());
}

function envNumber(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envList(name: string, fallback: string[]): string[] {
  const value = process.env[name];
  if (!value) return fallback;
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production. Set it to a long random string.');
    }
    // Development-only convenience value — never used in production.
    return 'dev-only-insecure-secret';
  }
  return secret;
}

export function isPilotMode(): boolean {
  return envFlag('BAZAARSETU_PILOT_MODE', false);
}

export function getPilotConfig(): PilotConfig {
  const checkoutMethods = envList('BAZAARSETU_PILOT_CHECKOUT_METHODS', ['DIRECT_UPI', 'COD', 'UDHAAR'])
    .map((method) => method.toUpperCase())
    .filter((method): method is PilotCheckoutMethod => ['DIRECT_UPI', 'COD', 'UDHAAR', 'RAZORPAY'].includes(method));

  return {
    enabled: isPilotMode(),
    localityName: process.env.BAZAARSETU_PILOT_LOCALITY || 'Ashok Nagar / Kanke Road',
    // Ranchi pilot defaults. Override per city with BAZAARSETU_PILOT_PINCODES.
    allowedPincodes: envList('BAZAARSETU_PILOT_PINCODES', ['834002', '834008']),
    centerLat: envNumber('BAZAARSETU_PILOT_CENTER_LAT', 23.375),
    centerLng: envNumber('BAZAARSETU_PILOT_CENTER_LNG', 85.329),
    radiusKm: envNumber('BAZAARSETU_PILOT_RADIUS_KM', 5),
    checkoutMethods: checkoutMethods.length > 0 ? checkoutMethods : ['DIRECT_UPI', 'COD', 'UDHAAR'],
  };
}

export function getPilotCheckoutMethods(): PilotCheckoutMethod[] {
  return getPilotConfig().checkoutMethods;
}

export function getAvailableCheckoutMethods(): PilotCheckoutMethod[] {
  return isPilotMode() ? getPilotCheckoutMethods() : ['COD', 'DIRECT_UPI', 'UDHAAR', 'RAZORPAY'];
}

export function assertPilotCheckoutMethod(method: string): asserts method is PilotCheckoutMethod {
  if (!isPilotMode()) return;
  const allowed = getPilotCheckoutMethods();
  if (!allowed.includes(method as PilotCheckoutMethod)) {
    throw new PilotPolicyError(
      `Pilot checkout supports only ${allowed.join(', ')} right now`,
      { method, allowedMethods: allowed },
    );
  }
}

export function normalizePincode(value?: string | null): string | undefined {
  const match = String(value || '').match(/\b\d{6}\b/);
  return match?.[0];
}

function hasValidCoords(lat?: number | null, lng?: number | null): lat is number {
  return typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0);
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isPilotShopEligible(shop?: PilotDeliveryInput['shop']): boolean {
  if (!isPilotMode()) return true;
  const config = getPilotConfig();
  if (hasValidCoords(shop?.lat, shop?.lng)) {
    return distanceKm(config.centerLat, config.centerLng, shop!.lat!, shop!.lng!) <= config.radiusKm;
  }
  const shopPin = normalizePincode(shop?.address);
  const addressMentionsLocality = Boolean(shop?.address?.toLowerCase().includes(config.localityName.toLowerCase().split('/')[0].trim()));
  return Boolean((shopPin && config.allowedPincodes.includes(shopPin)) || addressMentionsLocality);
}

export function evaluatePilotDelivery(input: PilotDeliveryInput): PilotDeliveryDecision {
  const config = getPilotConfig();
  if (!config.enabled) return { ok: true, localityName: config.localityName, reasons: [] };

  const pincode = normalizePincode(input.deliveryPincode) ||
    normalizePincode(input.deliveryAddress) ||
    normalizePincode(input.customer?.pincode) ||
    normalizePincode(input.customer?.address);
  const reasons: string[] = [];

  if (!pincode) {
    reasons.push(`Delivery PIN is required for the ${config.localityName} pilot`);
  } else if (config.allowedPincodes.length > 0 && !config.allowedPincodes.includes(pincode)) {
    reasons.push(`PIN ${pincode} is outside the ${config.localityName} pilot area`);
  }

  let shopDistanceKm: number | undefined;
  if (hasValidCoords(input.shop?.lat, input.shop?.lng)) {
    shopDistanceKm = distanceKm(config.centerLat, config.centerLng, input.shop!.lat!, input.shop!.lng!);
    if (shopDistanceKm > config.radiusKm) {
      reasons.push(`Shop is ${shopDistanceKm.toFixed(1)}km from pilot center; limit is ${config.radiusKm}km`);
    }
  } else {
    const shopPin = normalizePincode(input.shop?.address);
    const addressMentionsLocality = Boolean(input.shop?.address?.toLowerCase().includes(config.localityName.toLowerCase().split('/')[0].trim()));
    if (!shopPin || !config.allowedPincodes.includes(shopPin)) {
      if (!addressMentionsLocality) reasons.push('Shop must have pilot-area coordinates or an allowed pilot PIN in its address');
    }
  }

  let customerDistanceKm: number | undefined;
  if (hasValidCoords(input.deliveryLat, input.deliveryLng)) {
    customerDistanceKm = distanceKm(config.centerLat, config.centerLng, input.deliveryLat!, input.deliveryLng!);
    if (customerDistanceKm > config.radiusKm) {
      reasons.push(`Delivery address is ${customerDistanceKm.toFixed(1)}km from pilot center; limit is ${config.radiusKm}km`);
    }
  } else if (hasValidCoords(input.customer?.lat, input.customer?.lng)) {
    customerDistanceKm = distanceKm(config.centerLat, config.centerLng, input.customer!.lat!, input.customer!.lng!);
    if (customerDistanceKm > config.radiusKm) {
      reasons.push(`Customer address is ${customerDistanceKm.toFixed(1)}km from pilot center; limit is ${config.radiusKm}km`);
    }
  }

  return {
    ok: reasons.length === 0,
    localityName: config.localityName,
    pincode,
    shopDistanceKm,
    customerDistanceKm,
    reasons,
  };
}

export function assertPilotDeliveryAllowed(input: PilotDeliveryInput): PilotDeliveryDecision {
  const decision = evaluatePilotDelivery(input);
  if (!decision.ok) {
    throw new PilotPolicyError('Delivery address is outside the active Chiti Bazaar pilot locality', decision);
  }
  return decision;
}

export function validateEnv() {
  if (process.env.NODE_ENV !== 'development') {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}.\n` +
          'Check backend/.env.example for the full list of required variables.',
      );
    }
  }

  if (isPilotMode()) {
    const pilot = getPilotConfig();
    if (pilot.allowedPincodes.length === 0 || pilot.allowedPincodes.some((pin) => !/^\d{6}$/.test(pin))) {
      throw new Error('BAZAARSETU_PILOT_PINCODES must contain at least one valid 6-digit PIN when pilot mode is enabled.');
    }
    if (pilot.radiusKm <= 0) {
      throw new Error('BAZAARSETU_PILOT_RADIUS_KM must be greater than zero when pilot mode is enabled.');
    }
  }
}

export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (raw) return raw.split(',').map((o) => o.trim()).filter(Boolean);
  // Development default — the Next.js dev server.
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3005',
    'https://paaska.chiti.tech',
    'https://chiti-bazaar.vercel.app',
    'https://bazarsetu.chiti.tech'
  ];
}
