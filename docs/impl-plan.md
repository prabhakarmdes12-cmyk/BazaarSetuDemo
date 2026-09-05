# Chiti Bazaar — 90-Day Growth Implementation Plan

Market context (D-Mart-as-agent research): kiranas ≈ 13M stores; 91%/86% grocery
share; grocery $658B → $992B by FY30; kirana credit gap ₹20 lakh crore; digital
khata shortens collection cycles 30 → 15–20 days; q-commerce <$2B; ~2L kiranas
closed last year; UPI 504M users/20B+ tx; ONDC 3–5% vs 15–30% aggregator
commission.

D-Mart lessons applied: EDLP = udhaar, word-of-mouth over ads, cluster GTM,
no-frills utility.

## Ranked 90-day plays

1. Guest browse (kill login wall)
2. WhatsApp layer (status updates outside the app)
3. Udhaar-first (credit as the wedge)
4. Referrals (word-of-mouth)
5. Vernacular (Hinglish/Hindi/English)
6. Festival packs
7. One-city cluster GTM
8. ONDC foundation

## Implementation phases

### P0 — Instrumentation
- Backend: request-log middleware (method, path, status, duration) mounted on
  `/api`; structured error logging in `errorHandler` (stack in dev, message in prod).
- Frontend: dependency-free `ErrorBoundary` + analytics beacon helper.

### P1 — Kill login wall
- Backend: `optionalAuth` middleware; make browse endpoints public:
  `GET /api/shops`, `GET /api/shops/:id`, `GET /api/shops/:id/products`,
  `GET /api/products/shop/:shopId`, `GET /api/products/shops/:shopId/products`.
- Frontend: guest browse on `/customer`; localStorage guest cart
  (`chitibazaar_guest_cart`); add-to-cart while logged out; checkout-login —
  merge guest cart into server cart on login/register; cart page shows guest
  cart with login CTA when unauthenticated.
- MRP badge on product cards (price + unit trust cue).

### P2 — Udhaar wedge
- Schema: `UdharLedger.creditLimit`, `UdharLedger.lastRemindedAt`,
  `Shop.upiId`.
- `GET /api/udhaar/vendor/summary` — totals, customer count, DSO, collection
  rate, overdue count, credit utilization.
- `GET /api/udhaar/vendor/:customerId` — vendor view of one customer ledger.
- `POST /api/udhaar/:shopId/remind` — throttle via `lastRemindedAt` (7-day
  cooldown), returns WhatsApp link.
- `POST /api/udhaar/limit` — vendor sets credit limit per customer.
- Frontend: udhaar list → summary cards + remind + credit-limit + UPI collect
  (`upi://pay` deep link); real data on detail page.

### P3 — WhatsApp layer
- Schema: `Order.publicToken @unique`.
- `GET /api/orders/public/:publicToken` — status-only, no auth, no PII beyond
  shop name / item names.
- Frontend `lib/whatsapp.ts` — wa.me deep-link builder; order confirm shows
  "Track on WhatsApp"; public status page `/order-status?token=`.

### P4 — Referrals
- Schema: `User.referralCode @unique`, `Referral` model (pending/joined/rewarded).
- `POST /api/referrals/claim`, `GET /api/referrals/mine`.
- Frontend: invite page with share link; `?ref=` picked up at register.

### P5 — Vernacular, ONDC, Credit Health
- `lib/i18n.ts` — tiny Hinglish/Hindi/English dictionary, scoped to login +
  checkout; language toggle.
- ONDC contract stub behind `ENABLE_ONDC`.
- Credit Health tab in vendor udhaar (DSO, utilization, collection rate).

## Risks

- Cart merge idempotency — merge by productId; backend add increments qty.
- Public-token PII leak — status endpoint returns no customer fields.
- Reminder spam — 7-day cooldown enforced server-side.
- i18n sprawl — scope to login + checkout only.
- WA rich templates — wa.me text link only for now.
- ONDC scope — contract stub only, gated by env flag.
