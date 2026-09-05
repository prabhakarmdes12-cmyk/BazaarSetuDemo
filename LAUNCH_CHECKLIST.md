# BazaarSetu: Launch Checklist

**Verdict:** Not market-ready yet. Core product (auth, shops, products, cart, orders, chats, udhaar, referrals, admin) works end-to-end and is a solid demo/MVP. The gap to a real launch is money movement, real OTP delivery, deployment, and honest dashboards — not the product surface.

**Grounding:** This list is based on the actual codebase. Verified facts:

- OTP delivery: dev-only echo historically; **now wired via `backend/src/lib/sms.ts`** (Fast2SMS provider supported). Production fails closed with 503 if no provider is configured — the OTP is never echoed in prod responses.
- WhatsApp sends return `wa.me` deep links with `sentViaProvider: false` (`backend/src/lib/whatsapp.ts`). **No WABA provider.**
- Udhaar "Pay" flow is a simulated `setTimeout` → success page; no `POST /api/udhaar/:shopId/pay` exists.
- Payouts/BankAccount/Report/PlatformSettings models + endpoints from `plan.md` Phase 6 were **never built** (that was the one unfinished phase).
- `validateEnv` (`backend/src/lib/config.ts`) already fail-fasts on `DATABASE_URL` + `JWT_SECRET` in production — the guardrails exist.
- ONDC is an opt-in stub (`ENABLE_ONDC=true`, `backend/src/routes/ondc.ts`).
- Backend has jest + supertest tests; helmet, rate limiting, request log, nosniff uploads are in place.
- Not deployed anywhere. Running on localhost :5000/:3001.

---

## Sprint plan (in dependency order)

### Sprint A — Real payments (P0, 6–8 days)
Money must actually move and be recorded. No simulation.

1. **Prisma models** — add `Payment`, `BankAccount` (schema draft already in `plan.md` §3.6.1). Run `prisma migrate`.
2. **Udhaar pay endpoint** — `POST /api/udhaar/:shopId/pay` `{ amount, method: 'upi'|'cash'|'wallet' }`.
   - Validate amount ≤ outstanding balance.
   - On success: create `UdharEntry` (type PAYMENT) + update ledger `totalPaid`.
   - Return `{ paymentId, newBalance }`. Persist the real payment ID (currently the success page fakes `BSTU-…`).
3. **Payment gateway integration** (Razorpay is the pragmatic pick for UPI/CC/DC/netbanking in India; PhonePe is UPI-only).
   - Checkout: server-side order creation → `razorpay.checkout` → webhook to confirm.
   - **Webhook security:** verify signature, idempotency key on `Payment.paymentId`.
   - Cash-at-shop = "recorded manual payment" (already a valid udhaar use-case, keep).
4. ✅ **Payouts** — `GET /api/vendor/payouts` + `POST /api/vendor/payouts/link-bank` + `POST /api/vendor/payouts/request` + `GET /api/vendor/payouts/history` (`backend/src/routes/payouts.ts`).
   - Link-bank stores account **encrypted at rest** (AES-256-GCM via `lib/encrypt.ts`), masked in responses.
   - Actual settlement via **RazorpayX** (`lib/razorpayX.ts`, env-gated: `RAZORPAYX_KEY_ID/SECRET/ACCOUNT_NUMBER`). Unconfigured requests return **503 — no faked transfers**.
   - Available balance = platform-collected (paid Payments) − settled (non-failed Payouts). No wallet, no float.
5. **Frontend wiring** — pay page calls the real endpoint; success page renders the real `paymentId`; payouts page reads real balance/history. Remove `setTimeout` simulation.
6. **Do NOT ship a "BazaarSetu Wallet"** — a stored-balance wallet implies holding customer money (escrow/PG wallet, settlement licensing). Keep UPI + Cash only; remove or gate the wallet method.

### Sprint B — SMS OTP (P0, 1–2 days) — ✅ DONE
1. ✅ Provider: **Fast2SMS** implemented (`backend/src/lib/sms.ts`), switchable via `SMS_PROVIDER` env.
2. ✅ `deliverOtp` in `auth.ts` now calls the gateway; dev-mode passthrough only when `NODE_ENV !== 'production'`.
3. ✅ OTP is **never** returned in a prod API response — unconfigured prod returns 503. Env vars: `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER_ID`.
4. ✅ Existing `authLimiter` retained as the brute-force control.
5. Remaining before launch: create the Fast2SMS sender ID (requires DLT registration), set `SMS_PROVIDER=fast2sms` + `SMS_API_KEY` in prod env.

### Sprint C — WhatsApp delivery (P1, 1–2 days, optional at launch)
1. Current `wa.me` deep links genuinely work on any phone — acceptable MVP.
2. Upgrade path: Twilio/Msg91 WhatsApp Business API when volumes justify the cost. Provider abstraction already exists (`lib/whatsapp.ts`) — just add a real `sendWhatsAppText` branch.

### Sprint D — Dashboards & analytics (P1, 2–3 days)
Build the `plan.md` Phase 6 endpoints that were skipped; wire the currently-empty pages to real data:
- `GET /api/vendor/stats` (rating/ratingCount need a `Review` model + rating aggregation first — that's a prerequisite).
- `GET /api/vendor/reports?type=...&period=...` (+ `Report` model, PDF/CSV generation).
- `GET /api/admin/settings` + `PATCH /api/admin/settings` (+ `PlatformSettings` model).
- Consider adding a `Review`/rating table before claiming "ratings" anywhere.
- UI: pages already render honest empty states — just feed them real endpoints.

### Sprint E — Deployment & ops (P0, 2–3 days)
Artifacts ready (`backend/Dockerfile`, `frontend/Dockerfile` + standalone output, `docker-compose.yml`, `.dockerignore`s, Postgres provider swap + boot-time `db push`, HEALTHCHECKs on both images). Remaining work requires live host accounts:

1. **Backend:** PostgreSQL (prod) — `backend/Dockerfile` already swaps the Prisma provider to `postgresql` and runs `db push` on boot. Deploy the image to **Railway / Render / Fly.io** (one process hosts Express + Socket.IO; keep it non-serverless).
2. **Frontend:** **Vercel** or the `frontend/Dockerfile`. Critical: **Socket.IO needs a real-time-capable backend host** — Vercel functions can't hold websockets. Point `NEXT_PUBLIC_API_URL` + `API_PROXY_URL` at the deployed backend URL and use Vercel for static/SSR pages only.
3. **Env/secrets:** `JWT_SECRET` (long random), `DATABASE_URL` (Postgres), `CORS_ORIGINS` → deployed frontend URL, `SMS_PROVIDER`/`SMS_API_KEY`, Razorpay + RazorpayX keys, `PAYOUT_ENC_KEY`. `validateEnv` already enforces `DATABASE_URL` + `JWT_SECRET`.
4. **HTTPS:** default on all these hosts; just wire the custom domain.
5. **Backups:** on the DB host — daily `pg_dump` + retention, plus one restore drill.
6. **Monitoring:** `GET /api/health` exists and is the container HEALTHCHECK; configure uptime pinging + logs on the host.

### Sprint F — Launch hardening & compliance (P2, 2–4 days)
1. **Security review:** confirm no secrets in repo; `.env`/`.env.local` git-ignored; JWT expiry sane; role guards on all admin/vendor routes (spot-check each).
2. ✅ **DPDP Act (India):** phone numbers = personal data.
   - ✅ Signup requires explicit consent (`acceptPrivacy: true` literal in `registerSchema`; consent timestamp `User.privacyAcceptedAt` recorded).
   - ✅ Public `/privacy` + `/terms` pages (static, built into the frontend) linked from the login/register flow and profile.
   - ✅ Data-deletion path: `DELETE /api/auth/account` erases every user trace in one transaction (`lib/deleteAccount.ts`) — carts/orders/udhaar/chats/favorites/notifications/products/bank accounts; referral rows holding the user's phone are anonymised.
   - Remaining before launch: refund/return policy page; verify privacy text against final legal review.
3. **Payment compliance:** PCI-DSS scope is avoided by using Razorpay's hosted checkout (never touch raw card data). Keep udhaar records auditable (already timestamped).
4. **Content/branding:** replace placeholder images + external Google-hosted images with real licensed assets; legal (ToS, refund/return policy).
5. ✅ **E2E smoke tests** — `backend/src/__tests__/e2e.smoke.test.ts` walks register (with consent) → browse → cart → order → accept/complete → status; udhaar credit → customer balance → cash pay → vendor ledger → payout dashboard; referral join. `backend/src/__tests__/privacy.test.ts` covers consent rejection, customer/vendor erasure, and referral anonymisation.

---

## Non-goals (guardrails)
- No in-app wallet / stored balances at launch.
- No raw card handling — always hosted checkout.
- No ONDC network onboarding at launch (keep the stub).
- No NextAuth swap — JWT + localStorage is fine for this scale.

---

## Definition of Done (go-live gate)
- [ ] `POST /api/udhaar/:shopId/pay` records real payments; success page shows the persisted ID.
- [ ] OTP arrives via SMS in production; OTP never returned in prod responses.
- [x] Payouts page shows real balance/history from a backend endpoint.- [ ] All dashboards (stats/reports/performance/payouts) render backend data — zero hardcoded figures.
- [ ] Deployed with HTTPS, Postgres, JWT_SECRET, CORS restricted to the real domain.
- [ ] Backups + health monitoring live.
- [x] Privacy policy + consent at signup + data-deletion path in place (refund policy still pending).
- [ ] Backend `jest` suite passes; frontend lint/tsc/build green.
