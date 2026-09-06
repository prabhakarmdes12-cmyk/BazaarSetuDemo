# Paaska — System Invariants Specification

**Standard:** Chiti Technologies Architectural Governance  
**Status:** Production Mandatory  
**Last Updated:** September 6, 2026

The following 12 invariants are non-negotiable architectural constraints for the Paaska platform. Any PR or deployment that violates an invariant is automatically rejected.

---

## Invariant Index

| Invariant ID | Title | Severity | Enforcement Layer |
|---|---|---|---|
| `PAASKA_INV_001` | Dual-Zone Non-Exclusion | Critical | Backend Geometry & Frontend Store Cards |
| `PAASKA_INV_002` | Zero Phone Number Leakage | Critical | WebRTC Signaling & API Serializers |
| `PAASKA_INV_003` | Absolute Asset Identity | High | Catalog Asset Manifest Compiler |
| `PAASKA_INV_004` | Offline Independence | High | Service Worker & LocalStorage Fallbacks |
| `PAASKA_INV_005` | Deterministic Khata Ledger | Critical | Prisma Database Transactions |
| `PAASKA_INV_006` | Graceful Audio Degradation | Medium | Audio Dispatch & Voice Recorder |
| `PAASKA_INV_007` | Ephemeral Audio Privacy | Critical | ShopBot Multipart Handlers |
| `PAASKA_INV_008` | 12-Hour Pickup OTP Integrity | High | Order Verification FSM |
| `PAASKA_INV_009` | Sub-Second Category Navigation | Medium | Storefront DOM Spy & Aside Rail |
| `PAASKA_INV_010` | Real Catalog Unit Authority | High | SKU Resolution Engine |
| `PAASKA_INV_011` | Zero Orphan Asset Policy | Medium | Pre-build Asset Verification Script |
| `PAASKA_INV_012` | Backward-Compatible Serviceability | High | Shop API Response Serializer |

---

## Detailed Invariant Specifications

### `PAASKA_INV_001` — Dual-Zone Non-Exclusion
- **Statement**: If a store is within 50 km road distance of a customer, it must NEVER be displayed as "unserviceable" or hidden from search results.
- **Rationale**: Commercial hubs like Bank More serve commuters across Dhanbad district. If a store cannot deliver to Sindri (18.6 km), the customer must be offered **12-Hour Counter Self-Pickup** with driving time.
- **Test Assertion**: `expect(shop.canPickup).toBe(true)` when `roadDistance <= 50.0`.

### `PAASKA_INV_002` — Zero Phone Number Leakage
- **Statement**: Raw customer or merchant telephone numbers must never be included in frontend state, WebRTC SDP handshakes, or public socket payloads.
- **Rationale**: Protects female shoppers and delivery staff from unwanted contact, fraud, and offline harassment.
- **Test Assertion**: Tested by `privacy.test.ts` scanning JSON serialization outputs for E.164 phone formats.

### `PAASKA_INV_003` — Absolute Asset Identity
- **Statement**: An image asset must resolve strictly through the canonical tuple `[categoryId, name, unit, assetSlug]` matching the exact SKU in the database.
- **Rationale**: Generic product photos mislead customers into buying incorrect pack sizes (e.g. 500g pouch instead of 1kg jar), causing return disputes.
- **Test Assertion**: `npm run catalog:assets` validates that every mapped asset resolves to a unique, active catalog SKU.

### `PAASKA_INV_004` — Offline Independence
- **Statement**: The customer storefront must render cached category hierarchies, product cards, and past orders even during transient 2G/offline periods.
- **Rationale**: Tier-2/3 network stability is variable; shoppers must not experience blank screens while browsing in basement markets.
- **Test Assertion**: Core storefront passes offline simulation tests in PWA audit.

### `PAASKA_INV_005` — Deterministic Khata Ledger
- **Statement**: Every transaction affecting customer credit (`UDHAAR`) must execute within an atomic Prisma database transaction maintaining double-entry parity.
- **Rationale**: Discrepancies in credit balances permanently damage merchant-customer relationships.
- **Test Assertion**: `udhaar.test.ts` verifies that `currentBalance == SUM(debits) - SUM(credits)`.

### `PAASKA_INV_006` — Graceful Audio Degradation
- **Statement**: Failure of Web Audio or SpeechSynthesis APIs must never block or crash order creation or merchant notifications.
- **Rationale**: Browser permission states, low-end mobile webviews, or mute switches should degrade smoothly to silent banners.
- **Test Assertion**: Audio dispatch functions return gracefully without throwing exceptions when `AudioContext` is suspended or unavailable.

### `PAASKA_INV_007` — Ephemeral Audio Privacy
- **Statement**: Audio recordings captured via `useVoiceRecorder` must be purged from backend RAM buffers immediately after natural language entity extraction completes.
- **Rationale**: Prevents accidental accumulation of sensitive private household conversations.
- **Test Assertion**: Backend unit tests ensure multipart temporary files are cleaned up in `finally` blocks.

### `PAASKA_INV_008` — 12-Hour Pickup OTP Integrity
- **Statement**: Self-pickup orders generate a cryptographically random 4-digit code that expires strictly 12 hours after order acceptance.
- **Rationale**: Prevents fraudulent counter claims while allowing commuters ample time to collect their items after office hours.
- **Test Assertion**: Verification fails if `order.status == 'PICKED_UP'` or `Date.now() > order.pickupExpiresAt`.

### `PAASKA_INV_009` — Sub-Second Category Navigation
- **Statement**: Storefront category transitions must execute via GPU-accelerated CSS scroll spy without triggering React component remounting or layout thrashing.
- **Rationale**: 26 grocery categories require instant, frictionless scanning on low-cost Android devices.
- **Test Assertion**: Verified via `asideRailRef` scroll synchronization in `BighiStorefront.tsx`.

### `PAASKA_INV_010` — Real Catalog Unit Authority
- **Statement**: In the event of discrepancy between an asset filename (e.g. `wafers-75g.jpg`) and catalog specification (`150 g`), the database catalog unit is authoritative.
- **Rationale**: Packaging designs frequently resize without changing product art; visual recognition takes precedence over filenames.
- **Test Assertion**: Lookup matches by `categoryId::name::unit` tuple in `gen-catalog-assets.cjs`.

### `PAASKA_INV_011` — Zero Orphan Asset Policy
- **Statement**: No image file may exist in `/public/catalog/items/` that is not mapped to at least one active SKU in `catalog-assets.json`.
- **Rationale**: Eliminates dead bundle weight and keeps client PWA caching tight.
- **Test Assertion**: `npm run catalog:assets` exits with code 1 if unmapped files exist on disk.

### `PAASKA_INV_012` — Backward-Compatible Serviceability
- **Statement**: `GET /api/shops` must return `isDeliverable` as an exact boolean alias for `canDeliver` alongside `roadDistance` and `drivingEtaMinutes`.
- **Rationale**: Prevents legacy frontend consumers and third-party bots from breaking as location intelligence evolves.
- **Test Assertion**: Backend route tests verify all four keys are present in shop payloads.
