# BazaarSetu Operational Commerce — Phase 5 Pilot Hardening & Final Sign-off

Date: 2026-09-05  
Branch: `arena/01a06eea-bazaarsetudemo`  
Milestone commits: `a807b2c`, `0789a42`, `31a4eb3`

## 1. Summary of Changed Files

### Phase 5 hardening files

- `backend/.env.example` — documents `BAZAARSETU_PILOT_MODE`, pilot locality/PIN/radius config, pilot checkout methods, and dual SQLite/PostgreSQL provider preparation.
- `backend/Dockerfile` — uses the Prisma provider preparation script during production image build so PostgreSQL generation is deterministic.
- `backend/package.json` — adds `db:prepare:provider` and `db:seed:pilot`; updates Prisma scripts to prepare the datasource provider before generate/push.
- `backend/prisma/schema.prisma` — documents SQLite dev/test plus PostgreSQL production flow; adds optional/defaulted customer address/locality/PIN/coordinate fields used by the pilot seed and locality guard.
- `backend/scripts/prepare-prisma-provider.cjs` — infers Prisma provider from `DATABASE_URL` or `BAZAARSETU_PRISMA_PROVIDER`/`PRISMA_PROVIDER`.
- `backend/src/lib/config.ts` — central pilot-mode policy: locality, allowed PINs, radius validation, allowed checkout methods, and `PilotPolicyError`.
- `backend/src/lib/financialGuard.ts` — fail-closed DB health guard for pilot financial writes.
- `backend/src/lib/conversationalCommerce.ts` — carries shop address/coordinate metadata into draft checkout validation.
- `backend/src/routes/basket.ts` — enforces pilot locality/payment constraints and financial DB guard for conversational draft checkout.
- `backend/src/routes/orders.ts` — enforces pilot locality/payment constraints and financial DB guard for cart checkout while preserving legacy non-pilot behavior.
- `backend/src/routes/payouts.ts` — blocks payout creation if pilot DB health is degraded.
- `backend/src/routes/razorpayWebhook.ts` — blocks Razorpay webhook money movement if pilot DB health is degraded.
- `backend/src/routes/shops.ts` — filters/blocks shops outside the configured pilot locality when pilot mode is enabled.
- `backend/src/routes/udhaar.ts` — blocks Udhaar ledger/payment writes if pilot DB health is degraded.
- `backend/src/seed-pilot.ts` — one-click Ashok Nagar / Kanke Road pilot seed with 3 shops, SKUs, customers, ledgers, chats, and telemetry.
- `backend/src/validators/index.ts` — accepts optional pilot delivery fields and optional checkout payment method.
- `vercel.json` — pins Vercel install/build/output commands to the `frontend` app in this monorepo.
- `docs/PHASE5_PILOT_SIGNOFF.md` — this final operator sign-off report.

### Operational commerce files delivered in Phases 1–4

- `BAZAARSETU-OPERATIONAL-COMMERCE-SPEC.md` — authoritative product/operational commerce specification.
- `.github/workflows/ci.yml` — backend/frontend CI gates.
- `backend/src/lib/shopBotEngine.ts` — multilingual deterministic Shop Bot parser and catalogue matcher.
- `backend/src/lib/chitigram.ts` — Chitigram typed action-card bridge.
- `backend/src/lib/operationalEvents.ts` — signed operational event outbox.
- `backend/src/lib/multipart.ts` — dependency-free multipart parser for audio uploads.
- `backend/src/lib/transcription.ts` — mock/Whisper/Ollama transcription adapter with manual-review fallback.
- `backend/src/routes/shopBot.ts` — text parse and voice order endpoints.
- `backend/src/routes/chitigram.ts` — call record persistence endpoint.
- `backend/src/routes/admin.ts` — Chiti Console radar feed and escalation endpoint.
- `backend/src/services/slaService.ts` — merchant reminder/delay SLA sweep.
- `backend/src/__tests__/pilot.conversational.e2e.test.ts` — Phase 1/2 pilot coverage.
- `backend/src/__tests__/pilot.voice-and-radar.test.ts` — Phase 3/4 pilot coverage.
- `frontend/next.config.js` — frontend proxy rewrites for API/uploads.
- `frontend/src/hooks/useChitiConnectCall.ts` — Chiti-Connect WebRTC lifecycle hook.
- `frontend/src/components/ChatInterface.tsx` — basket, quote, order, payment, voice, and call-record cards.
- `frontend/src/app/customer/shop/[id]/page.tsx` — customer Shop Bot, voice order, and call entry point.
- `frontend/src/app/vendor/chats/[id]/page.tsx` — merchant chat, request card, and Chiti-Connect call control.
- `frontend/src/types/index.ts` — shared message/product/order typing, including `VOICE_ORDER`.

## 2. Schema & Models

New operational commerce models:

1. `ConversationDraft`
   - Stores the customer basket draft and its lifecycle.
   - Statuses: `DRAFT`, `CUSTOMER_CONFIRMED`, `SENT_TO_MERCHANT`, `MERCHANT_REVIEW`, `CHANGES_PROPOSED`, `FINAL_QUOTE`, `NEEDS_OPERATOR_ASSIST`, `CONVERTED`, `EXPIRED`, `CANCELLED`.

2. `DraftItem`
   - Stores each parsed line item with raw text, requested name, quantity, unit, catalogue match, confidence, price fields, and merchant availability status.
   - Unmatched items remain `NEEDS_MERCHANT_CHECK`.

3. `DraftAdjustment`
   - Stores merchant edits: `PRICE_CHANGE`, `QUANTITY_CHANGE`, `SUBSTITUTION`, `UNAVAILABLE`, `CUSTOM_ITEM`.
   - Tracks customer response: `PROPOSED`, `CUSTOMER_ACCEPTED`, `CUSTOMER_DECLINED`, `SUPERSEDED`.

4. `OperationalEventLog`
   - Durable Chiti Console outbox for all marketplace telemetry.
   - Stores event ID/type/version, related shop/customer/conversation/order IDs, payload, delivery flag, attempts, and timestamp.

Phase 5 also added defaulted/optional `User` locality fields: `address`, `locality`, `pincode`, `lat`, `lng`.

## 3. Preserved Legacy Functionality

Catalogue, cart, orders, Udhaar, and payments are intact.

- Catalogue browsing and product CRUD continue through existing shop/product routes.
- Cart add/update/list checkout paths remain available.
- Existing order creation, status timeline, public tracking, repeat order, and vendor order views are preserved.
- Udhaar ledger views, credit entries, reminders, limits, payments, DSO, and summary routes are preserved.
- Razorpay payment links and RazorpayX payouts remain available when configured.
- Phase 5 restrictions are gated by `BAZAARSETU_PILOT_MODE=true`; default mode remains backward-compatible.
- Pilot financial guards only add fail-closed protection in pilot mode; they do not fake or partially complete money movement.

## 4. Shop Bot Multilingual Architecture

The Shop Bot accepts Hindi, English, and Hinglish shopping messages through the same deterministic parser.

Pipeline:

1. Customer text or voice transcript arrives through `/api/shop-bot/parse` or `/api/shop-bot/voice-order`.
2. `parseShoppingIntent()` normalizes common Hindi/Hinglish/English wording.
3. Quantity and unit extraction maps phrases such as `2kg atta`, `ek packet namak`, `aadha kilo tamatar`, and `sasta accha oil`.
4. Catalogue matching compares only against real products from the target shop.
5. Confident matches receive `matchedProductId`, `catalogPrice`, and `AVAILABLE` status.
6. Unmatched or ambiguous items remain `NEEDS_MERCHANT_CHECK`.
7. No price, brand, product ID, or availability is fabricated.
8. Merchant-facing unresolved questions are generated for pending checks.

Voice orders use the same path after transcription. If transcription is unavailable, the audio URL is retained and the message is marked for manual review rather than guessing the basket.

## 5. State Machine Verification

Typical pilot trace:

1. Customer sends a freeform list.
   - Endpoint: `POST /api/shop-bot/parse` or `POST /api/shop-bot/voice-order`.
   - State: `DRAFT`.
   - Card/event: `BAZAAR.BASKET_PROPOSAL`, `BAZAAR.BASKET_DRAFT_UPDATED` or `BAZAAR.VOICE_ORDER_RECEIVED`.

2. Customer confirms the basket.
   - Endpoint: `POST /api/basket/draft/:draftId/confirm`.
   - State: `SENT_TO_MERCHANT`.
   - Event: `BAZAAR.BASKET_CONFIRMED`.

3. Merchant opens the request.
   - Endpoint: `GET /api/basket/draft/:chatId`.
   - State: `MERCHANT_REVIEW`.
   - Event: `BAZAAR.MERCHANT_REQUEST_VIEWED`.

4. Merchant proposes a substitution/edit.
   - Endpoint: `POST /api/basket/draft/:draftId/adjustments`.
   - State: `CHANGES_PROPOSED`.
   - Card/event: `BAZAAR.SUBSTITUTION`, `BAZAAR.SUBSTITUTION_PROPOSED` or `BAZAAR.DRAFT_ADJUSTED`.

5. Customer accepts or rejects substitution.
   - Endpoint: `POST /api/basket/adjustments/:adjustmentId/respond`.
   - State remains negotiable until quote.
   - Event: `BAZAAR.SUBSTITUTION_ACCEPTED` or `BAZAAR.SUBSTITUTION_DECLINED`.

6. Merchant sends final quote.
   - Endpoint: `POST /api/basket/draft/:draftId/final-quote`.
   - State: `FINAL_QUOTE`.
   - Card/event: `BAZAAR.FINAL_QUOTE`, `BAZAAR.FINAL_QUOTE_CREATED`.

7. Customer checks out.
   - Endpoint: `POST /api/basket/draft/:draftId/checkout`.
   - State: `CONVERTED`.
   - Order created.
   - Cards/events: `BAZAAR.ORDER_CARD`, `BAZAAR.PAYMENT_REQUEST`, optional `BAZAAR.UDHAAR_RECEIPT`, `BAZAAR.ORDER_REQUESTED`.

SLA branch:

- `SENT_TO_MERCHANT` older than 2 minutes emits `BAZAAR.MERCHANT_REMINDER`.
- Older than 3 minutes emits `BAZAAR.MERCHANT_RESPONSE_DELAYED` and marks `NEEDS_OPERATOR_ASSIST`.

## 6. Chitigram & Chiti Console Integration

Supported action/timeline cards:

- `BAZAAR.BASKET_PROPOSAL`
- `BAZAAR.SUBSTITUTION`
- `BAZAAR.FINAL_QUOTE`
- `BAZAAR.PAYMENT_REQUEST`
- `BAZAAR.UDHAAR_RECEIPT`
- `BAZAAR.ORDER_CARD`
- `CHITIGRAM.CALL_RECORD`
- `BAZAAR.OPERATOR_ESCALATION`

Telemetry event families:

- Basket: draft updated/cancelled/confirmed.
- Merchant: request viewed, reminder, response delayed.
- Negotiation: substitution proposed/accepted/declined, draft adjusted.
- Quote/order: final quote created, order requested, order status updated.
- Voice/call: voice order received, Chitigram call record.
- Operator: operator escalated.
- Pilot: pilot locality seeded.

Radar endpoint:

`GET /api/admin/radar/active-requests`

Buckets:

- `ACTIVE_REQUESTS`
- `WAITING_MERCHANT`
- `NEGOTIATING`
- `PAYMENT_PENDING`
- `PREPARING`
- `READY`
- `SLA_BREACHED`

Escalation endpoint:

`POST /api/admin/radar/:draftId/escalate`

## 7. Operator Runbook

### Configure pilot mode

```env
BAZAARSETU_PILOT_MODE=true
BAZAARSETU_PILOT_LOCALITY="Ashok Nagar / Kanke Road"
BAZAARSETU_PILOT_PINCODES="834002,834008"
BAZAARSETU_PILOT_CENTER_LAT="23.375"
BAZAARSETU_PILOT_CENTER_LNG="85.329"
BAZAARSETU_PILOT_RADIUS_KM="5"
BAZAARSETU_PILOT_CHECKOUT_METHODS="DIRECT_UPI,COD,UDHAAR"
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
```

### Prepare database

Development/test SQLite:

```bash
cd backend
npm run db:generate
npm run db:push
```

Production PostgreSQL without Docker:

```bash
cd backend
BAZAARSETU_PRISMA_PROVIDER=postgresql npm run db:generate
BAZAARSETU_PRISMA_PROVIDER=postgresql npm run db:push
```

Docker production prepares PostgreSQL provider during image build.

### Seed pilot

```bash
cd backend
npm run db:seed:pilot
```

Seeded accounts:

- Admin/operator: `9999900000` — Chiti Pilot Operator.
- Vendor: `9876501001` — Gupta General Store.
- Vendor: `9876501002` — Kisan Fresh Sabzi Mandi.
- Vendor: `9876501003` — Verma Medicos.
- Customer: `9000001001` — Priya Sinha, Ashok Nagar, active Gupta Udhaar.
- Customer: `9000001002` — Amit Kumar, Kanke Road, active Sabzi + Medicos Udhaar.

Dev/test OTP: `1234`.

### Launch checklist

1. Verify each real shop address has an allowed PIN and coordinates inside radius.
2. Verify UPI ID is configured for each merchant.
3. Verify catalogue visibility, but do not require catalogue completeness.
4. Ask each test customer to send one text order and one voice order.
5. Confirm unmatched items are routed to merchant review, not auto-priced.
6. Confirm merchant can open request cards and propose substitutions.
7. Confirm customer can accept substitution and checkout through COD, Direct UPI, or Udhaar.
8. Confirm call lifecycle writes `CHITIGRAM.CALL_RECORD` cards.
9. Watch `/api/admin/radar/active-requests` during live traffic.
10. Escalate SLA breaches through `/api/admin/radar/:draftId/escalate`.

## Final Sign-off

Phase 5 is ready for pilot rollout with a one-locality operating envelope, seeded pilot market, fail-closed financial safety guard, and documented Chiti Console runbook. Legacy marketplace functionality remains preserved behind non-pilot defaults.
