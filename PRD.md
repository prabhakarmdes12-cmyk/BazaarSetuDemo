# Paaska — Product Requirements Document (PRD)

**Version:** 2.0.0  
**Status:** Live in Pilot (Production Active)  
**Anchor Merchant:** Bighi Brothers Mart (Bank More, Dhanbad · 826001)  
**Parent Ecosystem:** Chiti Technologies Unified Operating System  
**Last Updated:** September 6, 2026

---

## 1. Executive Summary & Product Vision

### 1.1 Vision
To establish **Paaska** (*"Jo chahiye, paas se"*) as the world's premier **Voice-First, Relationship-Driven Quick Commerce Platform**, turning neighborhood kiranas into high-speed digital fulfilment centers while leapfrogging the dark-store model through natural multilingual voice ordering, encrypted merchant hotlines, and trusted community credit.

### 1.2 The Strategic Moat: Kirana vs. Dark Stores
National quick-commerce operators (Blinkit, Zepto, Instamart) rely on high-burn, capital-intensive dark stores that struggle with unit economics in Tier-2 and Tier-3 cities. More critically, they treat Indian commerce as a cold, mechanical vending machine.

Paaska recognizes that in Bharat, grocery shopping is built on **trust, conversation, shopping lists (*parchis*), and flexible credit (*udhaar*)**. By augmenting the existing 12-million-strong kirana network with instant voice AI, real-time calling, and studio-grade visual commerce, Paaska creates an unassailable hyperlocal moat.

---

## 2. Core User Personas

| Persona | Role | Core Jobs-to-be-Done | Key Pain Points Solved |
|---|---|---|---|
| **Rani (Shopper)** | Working Mother & Homemaker in Dhanbad | Orders daily milk, fresh vegetables, pooja essentials, and medicines quickly without typing long search queries. | Avoids high minimum order fees, slow delivery delays, and missing items. Can speak in natural Hindi (*"ek packet doodh aur aadha kilo chini"*) or call the dukaan directly. |
| **Rajesh Bighi (Merchant)** | Kirana Owner, Bighi Brothers Mart | Manages thousands of daily SKUs, accepts orders instantly, handles walk-ins, and tracks customer credit balances. | Never misses an order even when busy weighing atta; receives audible earcon and spoken Hinglish voice alerts; gets paid transparently with zero dark-store commissions. |
| **Amit (Delivery Partner)** | Local 2-Wheeler Fleet Rider | Picks up packed orders from the dukaan and delivers to customer doorsteps within a 1–5 km radius in under 10–15 minutes. | Clear navigation, phone number privacy (no harassment), transparent batch incentives, zero cash confusion. |
| **Vikram (Platform Operator)** | Chiti Technologies Ops Lead | Monitors citywide fulfilment times, inventory gaps, audio dispatch health, and settlement reconciliations. | Real-time cockpit radar in Chiti Console, proactive alerting, automated double-entry ledger audits. |

---

## 3. Product Principles

1. **Voice-First Accessibility**: Speaking is 4× faster than typing on mobile keyboards. Hindi and Hinglish voice inputs must be first-class citizens across search and cart assembly.
2. **Dual-Zone Non-Exclusion**: A store is never marked "unserviceable" if a shopper can reach it. If an address is beyond the 2-wheeler delivery fleet (1–5 km), the store automatically presents **12-Hour Self-Pickup** with driving ETAs for up to 50 km.
3. **Absolute Visual Fidelity**: Shoppers must see the exact brand, size, and packaging variant they are buying. Zero tolerance for placeholder images or misattributed pack shots.
4. **Relationship Credit (Digital Khata)**: Traditional Indian commerce runs on mutual trust. Paaska digitizes neighborhood Udhaar with transparent ledgers and 1-tap WhatsApp reminders.
5. **Strict Local Privacy**: Zero leakage of customer phone numbers in signaling channels, call payloads, or web client bundles.

---

## 4. System Capabilities & Feature Specifications

### 4.1 Dual-Zone Location Intelligence (P0)
- **Zone 1: Hyperlocal Delivery Zone (1–5 km)**:
  - Radius defined dynamically by the merchant (default 3.5 km, configurable in 0.5 km steps).
  - PIN code whitelist override for edge neighborhoods.
  - Calculated using real road network curvature (Road Distance = Straight Distance x 1.3).
  - Displays prominent **⚡ 10-Minute Instant Delivery** badge.
  - Delivery fee rules: base fee (₹15.0) waived above threshold (₹199.0).
- **Zone 2: District Commute Self-Pickup Zone (10–50 km)**:
  - Applicable to all shoppers within a 50 km radius who commute into commercial hubs (e.g., Katras, Sindri, Govindpur traveling to Bank More).
  - Displays **🛍️ Self-Pickup Available • X km drive • ~Y min** calculated at an average city speed of 30 km/h.
  - Zero delivery fee (₹0), bypasses delivery address collection, and issues a **12-Hour 4-Digit Pickup OTP**.

### 4.2 Paaska Sahayak — Conversational Voice Parchi (P0)
- **Shopper Voice Input**:
  - Live 16kHz mono audio recorder (`useVoiceRecorder`) with visual waveform amplitude metering.
  - Web Speech API transcript hints coupled with backend speech processing pipeline.
  - Ambient access via pulsing search bar microphone and floating leaf-green mic FAB.
- **Backend Intent & Entity Resolution**:
  - Endpoint: `POST /api/shop-bot/voice-order`.
  - Natural multilingual parsing for colloquial quantities:
    - *"aadha kilo"* → 0.5 kg
    - *"do packet"* → 2 units
    - *"das wali"* → ₹10 price variant
  - Resolves items against the live merchant catalog, returning priced items, SKU photos, and unmatched items with suggestions.
- **1-Tap Review & Checkout**:
  - Interactive bottom sheet (`VoiceParchiModal`) displaying recognized items with quantity incrementors, SKU photography, and one-tap checkout.

### 4.3 Chiti Connect — Encrypted Dukaan Calling Hotline (P0)
- **Real-Time Voice Hotline**:
  - 1-Tap calling mounted on the Bighi storefront hero and active order tracking screens.
  - WebRTC P2P channel (`RTCPeerConnection`) with STUN/TURN traversal and 4-second handshake timeout.
  - Fallback to masked VoIP relay if P2P fails.
- **In-App Call Experience**:
  - Emerald 21-bar live audio frequency visualizer (`ChitiConnectVisualizer`).
  - Active call modal (`DukaanHotlineModal`) displaying dukaan identity, call timer, mute, speaker, and end call controls.
  - Zero exposure of personal mobile numbers; call logs sanitized on termination via `/api/chitigram/call-record`.

### 4.4 Merchant Fulfilment Cockpit & Audio Dispatch (P0)
- **Urgent Action Inbox**:
  - Live WebSocket connection pushing incoming orders to the merchant dashboard.
  - Countdown timer for acceptance (target <60 seconds).
  - One-tap status transitions: `PENDING` → `ACCEPTED` → `PACKED` → `OUT_FOR_DELIVERY` / `READY_FOR_PICKUP`.
- **Hands-Free Audio Dispatch**:
  - 2-tone high-frequency oscillator earcon (880 Hz / 1320 Hz) designed to penetrate ambient kirana market noise.
  - Spoken Hinglish order announcement via SpeechSynthesis: *"Naya order! Ramesh ji ne 4 items mangwaye hain. Total 340 rupaye. Bank More ke liye."*
  - De-duplicated alerts and persisted audio toggle.

### 4.5 Central Master Product Asset Pipeline (P0)
- **Photographic Standard**:
  - High-resolution 600x600 studio photography with clean `#F8FAFC` sweep and grounded contact shadow.
  - Format: Progressive JPEG, strictly verified dimensions.
- **Zero-Misattribution Mapping**:
  - Canonical identity tuple: `[categoryId, name, unit, assetSlug]`.
  - Manifest validation tool (`npm run catalog:assets`) enforcing 0 bad IDs and 0 unmapped orphan assets.
- **Current Milestone**:
  - 256 verified pack shots mapping to 552 SKUs across 22 categories in production.
  - All food aisles above 20% coverage (Meat 100%, Chocolates 40%, Munchies 35%, Breakfast 34%, Tea 30%, Biscuits 29%).

### 4.6 Digital Khata (Udhaar Ledger) (P1)
- Double-entry credit ledger tracking customer running balances.
- Merchant approval workflow for credit purchases.
- Settlement recording with cash or UPI links.
- Automated WhatsApp payment balance reminders with payment deep links.

---

## 5. Non-Functional Requirements (NFRs)

| Dimension | Specification | Verification Method |
|---|---|---|
| **Catalog API Latency** | <= 120 ms (p95) on 3G/4G networks | Synthetic load testing on `GET /api/products` |
| **Voice Transcription & Parsing** | <= 1.2 s from audio end to priced basket | Automated E2E test in `pilot.voice-and-radar.test.ts` |
| **WebRTC Call Signaling** | <= 4 s handshake connection | Network disconnect injection & masked fallback test |
| **Offline Resilience** | Full category browsing & cached cart operational offline | PWA Service Worker & localStorage synchronization |
| **Privacy Invariant** | 0 phone numbers leaked in client payloads or WebRTC SDP | Static regex scanner & privacy test suite (`privacy.test.ts`) |
| **Code Quality Gates** | 100% clean TypeScript (`tsc --noEmit`), 0 ESLint errors | CI/CD build scripts on frontend and backend |

---

## 6. Pilot Acceptance Criteria (Dhanbad Wave 1)

1. **HP-01 to HP-10 (Location & Routing)**:
   - Shopper at Bank More (0.2 km) gets Instant Delivery in 10 mins.
   - Shopper in Sindri (18.6 km) gets Self-Pickup option with ~47 min driving ETA.
2. **HP-11 to HP-20 (Voice-First Ordering)**:
   - Voice parchi correctly extracts Hindi quantities and maps to live SKUs.
3. **HP-21 to HP-30 (Chiti Connect Calling)**:
   - Shopper connects to Bighi Mart hotline within 4 seconds; visualizer pulses with audio stream.
4. **HP-31 to HP-40 (Merchant Fulfilment)**:
   - Audio dispatch plays earcon and speaks Hinglish summary on new order arrival.
   - Merchant verifies 4-digit pickup OTP at counter before handing over goods.
5. **HP-41 to HP-50 (Digital Khata & Settlement)**:
   - Khata order increments ledger; cash settlement brings balance to ₹0.
