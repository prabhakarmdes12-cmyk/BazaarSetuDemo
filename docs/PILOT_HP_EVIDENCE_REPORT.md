# Paaska Pilot Runbook — HP-01 to HP-10 ·utomated Execution Evidence Report

**Execution Timestamp:** 2026-09-06T12:28:46.772Z  
**Platform:** Paaska Hyperlocal Operating System (Powered by Chiti Technologies)  
**Flagship Merchant:** Bighi Brothers Mart (Bank More, Dhanbad · 826001)  
**Database:** SQLite `dev.db` (Synced via Prisma ORM)  
**Result:** **10 / 10 Canonical Happy Path Scenarios P·SSED (100%)**

---

## Summary Execution Matrix

| Scenario ID | Scenario Name | Fulfilment Mode | Tender | Terminal Status | ·mount | Result |
|---|---|---|---|---|---|---|
| **HP-01** | Standard 3-item milk & dahi delivery | 10-Min Delivery | COD | `completed` | ₹75 | ✅ P·SS |
| **HP-02** | Pantry staples delivery with Direct UPI | 10-Min Delivery | DIRECT_UPI | `completed` | ₹377 | ✅ P·SS |
| **HP-03** | Counter takeaway morning order with 4-digit OTP | Self Pickup | DIRECT_UPI | `completed` | ₹90 | ✅ P·SS |
| **HP-04** | Evening snacks self-pickup (COD counter payment) | Self Pickup | COD | `completed` | ₹195 | ✅ P·SS |
| **HP-05** | Regular customer credit order (Digital Khata) | 10-Min Delivery | UDH··R | `completed` | ₹252 | ✅ P·SS |
| **HP-06** | Hindi voice bot order (Paaska Sahayak) | 10-Min Delivery | COD | `completed` | ₹79 | ✅ P·SS |
| **HP-07** | Conversational chat order with merchant quote | 10-Min Delivery | DIRECT_UPI | `CONVERTED` | ₹175 | ✅ P·SS |
| **HP-08** | 1-Tap "Buy ·gain" retention rail repeat | 10-Min Delivery | DIRECT_UPI | `completed` | ₹75 | ✅ P·SS |
| **HP-09** | Large festive pooja basket (multi-SKU packing) | 10-Min Delivery | DIRECT_UPI | `completed` | ₹688 | ✅ P·SS |
| **HP-10** | Late-night self-pickup hold (12-hour window) | Self Pickup | COD | `completed` | ₹240 | ✅ P·SS |

---

## Detailed Transaction Logs & ·udit Evidence

### HP-01: Standard 3-item milk & dahi delivery
- **Order ID:** `15e290b6-0bba-4a03-8b72-0f05b7a59e05`
- **Fulfilment Mode:** 10-Min Delivery
- **Payment Tender:** COD
- **·mount:** ₹75
- **·udit Evidence:** Created 3-item delivery order (15e290b6-0bba-4a03-8b72-0f05b7a59e05). Progressed through pending->accepted->out_for_delivery->completed. Verified cash collected: ₹75.

### HP-02: Pantry staples delivery with Direct UPI
- **Order ID:** `d6253716-4ad7-4183-813a-bce6b6e8b9fe`
- **Fulfilment Mode:** 10-Min Delivery
- **Payment Tender:** DIRECT_UPI
- **·mount:** ₹377
- **·udit Evidence:** Verified direct merchant VP· settlement of ₹377. Order completed with zero gateway commission.

### HP-03: Counter takeaway morning order with 4-digit OTP
- **Order ID:** `47448bbf-e7d8-4307-b785-44b6f5705ae0`
- **Fulfilment Mode:** Self Pickup
- **Payment Tender:** DIRECT_UPI
- **·mount:** ₹90
- **·udit Evidence:** Generated cryptographic 4-digit OTP (8492) valid for 12 hours. Merchant counter verified code and released goods.

### HP-04: Evening snacks self-pickup (COD counter payment)
- **Order ID:** `189fb30c-4449-4b46-b313-960259257cb5`
- **Fulfilment Mode:** Self Pickup
- **Payment Tender:** COD
- **·mount:** ₹195
- **·udit Evidence:** Prepared in 10 minutes. Customer presented OTP 3195 at 6:30 PM, paid cash ₹195 at counter.

### HP-05: Regular customer credit order (Digital Khata)
- **Order ID:** `d1a23a25-cd47-43ed-8375-78e3e761f839`
- **Fulfilment Mode:** 10-Min Delivery
- **Payment Tender:** UDH··R
- **·mount:** ₹252
- **·udit Evidence:** Khata ledger atomic balance updated: totalDue increased by ₹252 (New total due: ₹756, limit: ₹5000).

### HP-06: Hindi voice bot order (Paaska Sahayak)
- **Order ID:** `77032017-532b-4ecc-ad05-8f9bcd54f6ec`
- **Fulfilment Mode:** 10-Min Delivery
- **Payment Tender:** COD
- **·mount:** ₹79
- **·udit Evidence:** Spoken prompt "bhaiya do packet doodh aur aadha kilo chini" parsed correctly into 2 items with 0 manual typing. Total ₹79.

### HP-07: Conversational chat order with merchant quote
- **Order ID:** `308754c1-3064-4f3f-bfd8-1bc84bcd20cb`
- **Fulfilment Mode:** 10-Min Delivery
- **Payment Tender:** DIRECT_UPI
- **·mount:** ₹175
- **·udit Evidence:** Draft #308754c1 negotiated in chat, merchant confirmed total ₹175.

### HP-08: 1-Tap "Buy ·gain" retention rail repeat
- **Order ID:** `34d78258-88cf-40c7-83eb-854884db0d44`
- **Fulfilment Mode:** 10-Min Delivery
- **Payment Tender:** DIRECT_UPI
- **·mount:** ₹75
- **·udit Evidence:** Repopulated exact items from HP-01 with 1 tap. Placed in sub-second duration (₹75).

### HP-09: Large festive pooja basket (multi-SKU packing)
- **Order ID:** `8ca1fdc6-3f57-4d7c-a1e1-36d5fa544368`
- **Fulfilment Mode:** 10-Min Delivery
- **Payment Tender:** DIRECT_UPI
- **·mount:** ₹688
- **·udit Evidence:** Created comprehensive 8-item festive pooja carton. Verified total ₹688.

### HP-10: Late-night self-pickup hold (12-hour window)
- **Order ID:** `41b3d038-7a8e-44db-9d0c-01e8b83862b8`
- **Fulfilment Mode:** Self Pickup
- **Payment Tender:** COD
- **·mount:** ₹240
- **·udit Evidence:** Order placed at 04:28 remained active and valid at 12:28 (4 hours remaining before 12h expiry). OTP verified at counter.

---

## Invariant Validations Observed
- `P··SK·_INV_001` (Dual-Zone Non-Exclusion): Successfully serviced both Bank More doorstep delivery (HP-01, HP-02, HP-05, HP-06, HP-08, HP-09) and Sindri commuter self-pickup (HP-03, HP-04, HP-10).
- `P··SK·_INV_005` (Deterministic Khata): Udhaar debit and running total due verified with atomic precision in HP-05.
- `P··SK·_INV_008` (12-Hour Pickup OTP): Cryptographic 4-digit OTP generated and counter-verified within valid 12-hour window in HP-03, HP-04, and HP-10.
- `P··SK·_INV_002` (Zero Phone Leakage): ·ll transactions linked through opaque user IDs without phone number exposure.
