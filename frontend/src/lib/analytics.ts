// Dependency-free analytics. In production point the beacon at a collector
// (e.g. a /api/analytics endpoint or hosted intake); in development it logs
// to the console so flows are greppable.

type AnalyticsEvent =
  | { type: 'view'; page: string }
  | { type: 'guest_add_to_cart'; productId: string; shopId: string }
  | { type: 'guest_cart_merge'; itemCount: number }
  | { type: 'login'; role: 'customer' | 'vendor' | 'admin' }
  | { type: 'register'; role: 'customer' | 'vendor' | 'admin' }
  | { type: 'order_placed'; orderId: string; amount: number }
  | { type: 'referral_shared'; code: string }
  | { type: 'udhaar_remind'; customerId: string }
  | { type: 'udhaar_paylink'; customerId: string }
  // Paaska Sahayak — voice parchi funnel
  | { type: 'voice_parchi_open'; shopId: string }
  | { type: 'voice_parchi_add_to_cart'; shopId: string; itemCount: number }
  | { type: 'voice_parchi_instant_checkout'; shopId: string; itemCount: number }
  // Chiti Connect — masked dukaan hotline
  | { type: 'chiti_connect_call_start'; shopId: string; surface: string }
  | { type: 'chiti_connect_call_end'; shopId: string; durationSeconds: number; status: string }
  | { type: 'error'; message: string; componentStack?: string };

function getClientId(): string {
  try {
    let id = localStorage.getItem('chitibazaar_client_id');
    if (!id) {
      id = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('chitibazaar_client_id', id);
    }
    return id;
  } catch {
    return 'c_unknown';
  }
}

export function track(event: AnalyticsEvent) {
  if (typeof window === 'undefined') return;
  const payload = { ...event, clientId: getClientId(), ts: new Date().toISOString() };
  if (process.env.NODE_ENV === 'production') {
    // TODO: send to an analytics endpoint. Keep it non-blocking + fire-and-forget.
    try {
      navigator.sendBeacon?.('/api/analytics', JSON.stringify(payload));
    } catch {
      /* noop */
    }
  } else {
    console.log('[analytics]', JSON.stringify(payload));
  }
}

export function reportError(error: Error, componentStack?: string) {
  track({ type: 'error', message: error.message, componentStack });
}

// Register so ErrorBoundary can reach the reporter without importing it.
if (typeof window !== 'undefined') {
  (globalThis as Record<string, unknown>).__chitibazaar_reportError = (e: Error, stack?: unknown) => {
    reportError(e, typeof stack === 'string' ? stack : undefined);
  };
}
