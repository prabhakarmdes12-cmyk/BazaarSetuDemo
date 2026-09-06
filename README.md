# Paaska ⚡🛍️

> **"Jo chahiye, paas se."**  
> The World's First Voice-First, Relationship-Driven Hyperlocal Quick Commerce Operating System.  
> *Designed and engineered according to Chiti Technologies Unified Architecture.*

---

## 🌟 Overview

**Paaska** (built on the BazaarSetu commerce runtime) bridges the gap between quick-commerce speed and trusted neighborhood kiranas, starting with our flagship pilot anchor:
**Bighi Brothers Mart (Bank More, Dhanbad · 826001)**.

While national quick-commerce players (Blinkit, Zepto, Instamart) rely on high-burn dark stores with cold, impersonal apps, Paaska empowers neighborhood dukaans with:
1. **⚡ 10-Minute Instant Delivery**: Hyperlocal doorstep delivery powered by the store's 2-wheeler fleet within a 1–5 km radius.
2. **🛍️ 12-Hour Free Self-Pickup**: Regional commute pickup with driving ETAs for shoppers traveling up to 50 km, secured by a 4-digit numeric OTP.
3. **🎙️ Paaska Sahayak (Voice Parchi)**: Multilingual conversational ordering allowing customers to speak their shopping lists in Hindi/Hinglish (*"Bhaiya, do packet doodh, aadha kilo chini aur das wali Maggi"*).
4. **📞 Chiti Connect Dukaan Hotline**: Direct, 1-tap encrypted in-app calling connecting the shopper straight to the shop counter with an emerald 21-bar live audio visualizer and zero mobile number exposure.
5. **📢 Merchant Audio Dispatch**: Ear-piercing two-tone urgency earcons and spoken Hinglish order summaries (*"Naya order! Ramesh ji ne 4 items mangwaye hain"*) cutting through noisy shopfronts.
6. **📸 Studio-Grade Master Product Catalog**: 326 verified 600x600 studio pack shots on `#F8FAFC` sweep mapping to 752 SKUs across 26 categories (0% categories: 0) with zero visual misattribution.
7. **📒 Digital Khata (Udhaar)**: Transparent community credit ledger with one-tap WhatsApp payment balance reminders.

---

## 🏗️ Architecture & Core Pillars

```
                                  PAASKA OPERATING SYSTEM
       ┌─────────────────────────────────────┬─────────────────────────────────────┬─────────────────────────────────────┐
       │                                     │                                     │                                     │
       ▼                                     ▼                                     ▼                                     ▼
   PILLAR 1:                             PILLAR 2:                             PILLAR 3:                             PILLAR 4:
 PAASKA SAHAYAK                      CHITI CONNECT HOTLINE                 DUAL-ZONE LOGISTICS                  MASTER PRODUCT ASSETS
(Voice Parchi Engine)                (Encrypted Calling)                   (Delivery + Pickup)                  (Zero-Misattribution)
       │                                     │                                     │                                     │
 • Ambient Floating Mic               • 1-Tap [ 📞 Call Dukaan ]            • 1-5 km Instant Delivery             • 256 Studio Pack Shots
 • Hindi Quantity Parsing             • WebRTC P2P Audio Channel            • 10-50 km Driving Self-Pickup        • 552 SKUs / 22 Categories
 • Live Catalog Entity Match          • Zero Mobile Number Leakage          • Road Curvature Factor (1.3x)        • 600x600 Sweep Photography
 • 1-Tap Checkout Bottom Sheet        • 21-Bar Waveform Visualizer          • 12-Hour 4-Digit Pickup OTP          • 0 Orphan Asset Enforcement
```

---

## 📊 Live Category Coverage Matrix (Pilot Status)

| Category | Covered / Total | Percentage | Status |
|---|---|---|---|
| `meat` | 50 / 50 | **100.0%** | ⭐ Fully Mapped |
| `pooja` | 23 / 54 | 42.6% | 🟢 Deepened Line |
| `chocolates` | 34 / 84 | 40.5% | 🟢 Deepened Line |
| `homekitchen` | 24 / 67 | 35.8% | 🟢 Deepened Line |
| `munchies` | 30 / 85 | 35.3% | 🟢 Deepened Line |
| `breakfast` | 33 / 96 | 34.4% | 🟢 Deepened Line |
| `paan` | 13 / 41 | 31.7% | 🟢 Deepened Line |
| `tea` | 31 / 103 | 30.1% | 🟢 Deepened Line |
| `household` | 41 / 137 | 29.9% | 🟢 Deepened Line |
| `biscuits` | 24 / 83 | 28.9% | 🟢 Deepened Line |
| `dairy` | 21 / 85 | 24.7% | 🟡 Under 25% |
| `dryfruits` | 21 / 89 | 23.6% | 🟡 Under 25% |
| `oils` | 31 / 134 | 23.1% | 🟡 Under 25% |
| `instant` | 23 / 100 | 23.0% | 🟡 Under 25% |
| `staples` | 29 / 128 | 22.7% | 🟡 Under 25% |
| `personal` | 42 / 186 | 22.6% | 🟡 Under 25% |
| `drinks` | 27 / 123 | 22.0% | 🟡 Under 25% |
| `fruits` | 6 / 35 | 17.1% | 🟡 Under 25% |
| `pharma` | 19 / 119 | 16.0% | 🟡 Under 25% |
| `frozen` | 8 / 53 | 15.1% | 🟡 Under 25% |
| `vegetables` | 8 / 59 | 13.6% | 🟡 Under 25% |
| `baby` | 14 / 117 | 12.0% | 🟡 Under 25% |
| `stationery` | 0 / 60 | 0.0% | 🔴 Target Batch 6 |
| `beauty` | 0 / 60 | 0.0% | 🔴 Target Batch 6 |
| `pet` | 0 / 48 | 0.0% | 🔴 Target Batch 6 |
| `electronics` | 0 / 46 | 0.0% | 🔴 Target Batch 6 |

---

## 🚀 Quick Start & Development Guide

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- SQLite3 (bundled with Prisma)

### 1. Repository Setup
```bash
git clone https://github.com/prabhakarmdes12-cmyk/chiti-bazaar.git
cd chiti-bazaar
```

### 2. Backend Setup & Seeding
```bash
cd backend
npm install
npm run db:push
npm test               # Run 58-test suite across 10 suites
npm run dev            # Starts API on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run catalog:assets # Verify 256 assets map to 552 SKUs
npm run dev -- -p 3005 # Starts Storefront on http://localhost:3005
```

### 4. Seeding Dhanbad Pilot Anchor (Bighi Brothers Mart)
```bash
node scratch/seed_bighi_brothers_mart.js
# Seeds all 2,242 SKUs with updated asset mappings & delivery settings
```

---

## 🧪 Quality Gates & CI Verification

Every commit on `main` and `production` must strictly satisfy 5 quality gates:
```bash
# Gate 1: Backend Test Suite (58/58 passing)
npm --prefix backend test

# Gate 2: Frontend Typecheck (0 errors)
node frontend/node_modules/typescript/bin/tsc -p frontend/tsconfig.json --noEmit

# Gate 3: Backend Typecheck (0 errors)
node backend/node_modules/typescript/bin/tsc -p backend/tsconfig.json --noEmit

# Gate 4: Catalog Asset Verification (0 bad IDs, 0 orphans)
npm --prefix frontend run catalog:assets

# Gate 5: Production Build (32/32 routes compiled clean)
npm --prefix frontend run build
```

---

## 📚 Comprehensive Documentation Index

- [Product Requirements Document (PRD.md)](file:///D:/Projects/BazaarSetu/PRD.md)
- [Agent Development Guide (AGENTS.md)](file:///D:/Projects/BazaarSetu/AGENTS.md)
- [System Architecture (docs/architecture/ARCHITECTURE.md)](file:///D:/Projects/BazaarSetu/docs/architecture/ARCHITECTURE.md)
- [System Invariants (docs/architecture/INVARIANTS.md)](file:///D:/Projects/BazaarSetu/docs/architecture/INVARIANTS.md)
- [API Reference (docs/api/API_REFERENCE.md)](file:///D:/Projects/BazaarSetu/docs/api/API_REFERENCE.md)
- [Catalog Asset Pipeline (docs/CATALOG_ASSET_PIPELINE.md)](file:///D:/Projects/BazaarSetu/docs/CATALOG_ASSET_PIPELINE.md)
- [Voice & Calling Architecture Spec (docs/PAASKA_VOICE_CONNECT_SPEC.md)](file:///D:/Projects/BazaarSetu/docs/PAASKA_VOICE_CONNECT_SPEC.md)
- [Pilot 50 Hostile Transactions Test Spec (docs/PAASKA_PILOT_TEST_SPEC.md)](file:///D:/Projects/BazaarSetu/docs/PAASKA_PILOT_TEST_SPEC.md)

---

## 🔒 Privacy & Operational Guarantees

Paaska operates under the **Chiti Technologies Privacy Standard** (`VOICE_INV_007` & `PAASKA_INV_002`):
- Customer phone numbers are never exposed to merchants, riders, or third-party SDKs.
- Voice recordings are ephemeral and destroyed immediately following intent parsing unless explicitly opted-in.
- Calling uses masked, end-to-end encrypted WebRTC audio streams.
