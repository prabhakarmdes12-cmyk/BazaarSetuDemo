# Paaska (BazaarSetu) — Agent Development Guide

## Design System
This project adheres strictly to the **Chiti Technologies Unified Design System v3**:
- **Typography**: Outfit (display headings & hero numbers), Inter (body, pricing, product descriptions), JetBrains Mono (SKU IDs, coordinates, code/diagnostics).
- **Color Palette**: Dark quick-commerce obsidian (`#0B0F17`) default for navigation & system cards, crisp grocery white (`#FFFFFF`) for customer storefront shelves, and vibrant leaf green (`#10B981` / `#059669`) for instant delivery accents, call visualizers, and buy buttons.
- **Grid**: Strict 8pt spacing grid (`p-2`, `p-4`, `p-6`, `gap-2`, `gap-4`).
- **Glassmorphism**: Backdrop blur (`backdrop-blur-md bg-slate-900/80 border border-slate-700/50`) for modals, action bottom sheets, and the floating mic FAB.
- **Icons**: Lucide React icons with consistent 16/20/24px bounding boxes.

## Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Socket.IO Client.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite (`dev.db` locally) / PostgreSQL (production).
- **Real-time & Media**: WebRTC (`RTCPeerConnection`), Web Audio API (`AudioContext` earcon generator), Web Speech API, Socket.IO.
- **Catalog Engine**: Central Master Product Asset Pipeline (`scripts/gen-catalog-assets.cjs`), 600x600 progressive JPEG studio photography.

## Key Invariants
Refer to `docs/architecture/INVARIANTS.md` for complete mathematical and formal definitions:
- `PAASKA_INV_001` — **Dual-Zone Non-Exclusion**: A store is never hidden if within 50 km; outside delivery radius it automatically flips to Self-Pickup with driving ETA.
- `PAASKA_INV_002` — **Zero Phone Number Leakage**: Customer and merchant personal phone numbers are never transmitted over signaling channels, WebRTC SDPs, or public client payloads.
- `PAASKA_INV_003` — **Absolute Asset Identity**: Product images are strictly mapped by `[categoryId, name, unit, assetSlug]`. Generic or placeholder images are prohibited.
- `PAASKA_INV_004` — **Offline Independence**: Core storefront UI, category shelves, and local cart must remain functional when connectivity drops.
- `PAASKA_INV_005` — **Deterministic Khata Core**: Credit ledger operations require double-entry debit/credit integrity with immutable transaction logs.
- `PAASKA_INV_006` — **Graceful Audio Degradation**: SpeechSynthesis failures fallback seamlessly to Web Audio oscillator chimes, and ultimately to silent visual toasts.
- `PAASKA_INV_007` — **Local Privacy**: Raw shopper audio snippets are purged immediately following transcription parsing unless explicit user opt-in is granted.
- `PAASKA_INV_008` — **12-Hour Pickup OTP Integrity**: Self-pickup orders generate a cryptographically random 4-digit OTP valid for 12 hours, verified before counter release.
- `PAASKA_INV_009` — **Sub-Second Category Navigation**: Storefront left-category aside rail must maintain smooth vertical scrolling with bidirectional auto-scroll spy hooks.
- `PAASKA_INV_010` — **Real Catalog Unit Authority**: Lookup and resolution are determined by authoritative catalog units (`categoryId::name::unit`), never by image filenames.
- `PAASKA_INV_011` — **Zero Orphan Asset Policy**: Pack shots residing in `/public/catalog/items/` must be mapped to at least one valid SKU; dead bundle assets are rejected.
- `PAASKA_INV_012` — **Backward-Compatible Serviceability**: The backend returns `isDeliverable` as an exact alias for `canDeliver` alongside `roadDistance` and `drivingEtaMinutes`.

## Error Codes
| Code | Category | HTTP Status | Description |
|---|---|---|---|
| `SHOP_NOT_FOUND` | Client | 404 | Specified store does not exist in the active registry |
| `OUTSIDE_SERVICE_AREA` | Client | 400 | Location exceeds both delivery radius and 50 km pickup threshold |
| `INVALID_QUANTITY` | Client | 400 | Parsed voice quantity or cart increment is malformed |
| `VOICE_PARSE_FAILED` | Client | 422 | Audio transcription was intelligible but no catalog entities matched |
| `CALL_SIGNALING_FAILED` | Internal | 500 | WebRTC STUN/TURN handshake timed out or peer unavailable |
| `OTP_INVALID` | Client | 403 | Counter pickup OTP does not match the active order record |
| `OTP_EXPIRED` | Client | 410 | Counter pickup OTP has exceeded the 12-hour fulfillment window |
| `INSUFFICIENT_FUNDS` | Client | 402 | Payout account lacks sufficient balance for transfer |
| `CATALOG_MISMATCH` | Internal | 500 | Discrepancy detected between catalog asset manifest and SKU records |

## Quality Assurance & Quality Gates
Before committing or pushing any change to `main` or `production`, all of the following gates must pass:
1. **Backend Tests**: `npm test` in `backend/` must pass 58/58 tests across all 10 test suites.
2. **Frontend Types**: `node D:/Projects/BazaarSetu/frontend/node_modules/typescript/bin/tsc -p D:/Projects/BazaarSetu/frontend/tsconfig.json --noEmit` must pass with zero errors.
3. **Backend Types**: `node D:/Projects/BazaarSetu/backend/node_modules/typescript/bin/tsc -p D:/Projects/BazaarSetu/backend/tsconfig.json --noEmit` must pass with zero errors.
4. **Asset Verification**: `npm run catalog:assets` in `frontend/` must report `badIds 0, orphans 0`.
5. **Frontend Build**: `npm run build` in `frontend/` must compile all 32 static/dynamic routes cleanly.
6. **Git Synchronization**: Deployments must be pushed to both `chiti-bazaar` (`main` and `production`) and `origin` (`main` and `production`).

## Sprint Log

### 2026-09-04 — Sprint 5: Master Catalog Pipeline & Batches 1–4
- Initialized Central Master Product Asset Repository.
- Established 600x600 studio photography pipeline on `#F8FAFC` sweep.
- Built automated verification script `scripts/gen-catalog-assets.cjs`.
- Completed Batches 1–4: 176 pack shots covering 354 SKUs across Dairy, Bakery, Beverages, and Household items.

### 2026-09-05 — Sprint 6: Storefront UI Rebrand & Category Aside Fix
- Rebranded platform to **Paaska** (*"Jo chahiye, paas se"*).
- Redesigned `/customer` storefront with sticky search, active cart drawer, and 1-tap Buy Again carousel.
- Fixed left category menu vertical scroll bug (`bd4a5ac`): added `max-h-[calc(100vh-160px)] overflow-y-auto overscroll-contain` and auto-scrolling category spy hook (`asideRailRef`).

### 2026-09-05 — Sprint 7: Dual-Zone Location Intelligence
- Added merchant delivery settings (`deliveryRadiusKm`, `serviceablePincodes`, `minOrderAmount`, `deliveryFee`, `freeDeliveryAbove`) to `model Shop` in Prisma schema.
- Updated `GET /api/shops` to calculate straight-line distance, road distance (1.3x curvature factor), `canDeliver` (<=3.5 km or matching PIN), and `canPickup` (<=50 km with driving ETA).
- Built interactive Customer Location Picker with saved addresses and 6-digit PIN validation.
- Added dual storefront badges: `⚡ 10 mins (X km drive)` vs `🛍️ Self-Pickup Available • X km drive • ~Y min`.

### 2026-09-06 — Sprint 8: Voice-First Paaska Sahayak & Chiti Connect Hotline
- **WP1 (Voice Input)**: Built `useVoiceRecorder` (16kHz mono, live amplitude, Web Speech hints) and `VoiceParchiModal` (obsidian + leaf-green bottom sheet, item incrementors, 1-tap checkout). Added pulsing mic on search bar and floating mic FAB.
- **WP2 (Backend Intent)**: Built `POST /api/shop-bot/voice-order` with colloquial Hindi parsing (*"aadha kilo"*, *"do packet"*, *"das wali"*) resolving to live catalog SKUs.
- **WP3 (Chiti Connect)**: Implemented encrypted in-app calling (`RTCPeerConnection`, STUN/TURN, 4s timeout fallback), 21-bar emerald audio visualizer (`ChitiConnectVisualizer`), and `DukaanHotlineModal`.
- **WP4 (Audio Dispatch)**: Implemented Web Audio 2-tone urgency earcon (880/1320 Hz) and spoken Hinglish order summaries for noisy merchant environments.
- Added comprehensive E2E test suite `pilot.voice-and-radar.test.ts` (all 58 tests passing).


### 2026-09-06 — Sprint 10: Batch 6 Catalog Completion (326 Assets / 752 SKUs)
- Completed Batch 6 across the final 4 zero-coverage categories (Pet, Electronics, Beauty, Stationery).
- Total studio pack shots increased to **326 shots covering 752 SKUs** across all 26 categories.
- Zero-coverage categories eliminated (**0% categories: 0**).
- Re-seeded `dev.db` with updated SKU image mappings for Bighi Brothers Mart.
- Verified backend test suite (58/58 passing) and Next.js production build (32/32 routes compiled clean).

### 2026-09-06 — Sprint 9: Batch 5 Catalog Completion & Production Deployment
- Completed Batch 5 covering Fresh Meat, Chocolates, Frozen Desserts, Spreads, Instant Mixes, Tea & Health Drinks, and Biscuit varieties.
- Repository reached **256 studio pack shots covering 552 SKUs across 22 categories (0 orphans, all 600x600)**.
- Every single food aisle lifted out of the teens (Meat at 100%, Chocolates 40%, Munchies 35%, Breakfast 34%, Tea 30%, Biscuits 29%).
- Fixed worker concurrency issue during Next.js static generation on Windows (`workerThreads: false, cpus: 1`).
- Re-seeded all 2,242 SKUs into live `dev.db` for Bighi Brothers Mart.
- Merged and deployed clean build (`5ff2a80`) to `chiti-bazaar/production` and `origin/production`.
