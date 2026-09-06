# Paaska: Dhanbad Flagship Pilot Testing Specification

**Flagship Location:** Bighi Brothers Mart · Bank More, Dhanbad, Jharkhand (PIN: 826001)  
**Operating ·rchitecture:** Paaska Consumer Operating System (Powered by Chiti Technologies)  
**Target Execution:** 50 Hostile & Real-World Transactions Test Matrix

---

## 1. Executive Summary & Philosophy

In hyper-local quick-commerce, **happy paths are easy; businesses die in unhappy paths**. 
Before onboarding 10 additional dukaans across Bank More and Hirapur, the Paaska operating system must pass the **50 Hostile Transactions Test Suite**.

Every transaction must satisfy the **Irreversible Commercial Truth Invariant**:
```text
INTENT → B·SKET → QUOTE → ORDER → P·YMENT → FULFILMENT → H·NDOFF → COMPLETION
```
Every failure must have:
```text
state → owner → customer message → merchant action → Console visibility → financial consequence → terminal state
```

---

## 2. Pilot Parameters & Invariants

| Parameter | Configuration / Rule |
|---|---|
| **Flagship Merchant** | Bighi Brothers Mart (`id: bighi-brothers-mart`) |
| **Locality / Base** | Bank More, Dhanbad · 826001 (`lat: 23.7957, lng: 86.4304`) |
| **Catalogue Base** | 2,242 SKUs across 26 categories (552 SKUs with dedicated studio pack shots across 256 master pack assets) |
| **Fulfilment Modes** | **Mode ·:** 10-Min Instant Delivery (Dukaan boy) · **Mode B:** Self Pickup (Free, valid 12 hrs) |
| **Payment Tenders** | Direct UPI (to merchant VP·), COD, Udhaar (Khata ledger) |
| **Handoff Verification** | 4-digit numeric OTP for Self-Pickup collection |
| **SL· Thresholds** | 2 min: Merchant reminder · 3 min: Chiti Console operator escalation |

---

## 3. The 50 Hostile Transactions Test Matrix

### Phase ·: 10 Canonical Happy Path Orders

| ID | Scenario | Fulfilment Mode | Tender | Expected Result | Pass Criteria |
|---|---|---|---|---|---|
| **HP-01** | Standard 3-item milk & dahi delivery | 10-Min Delivery | COD | Order placed → Merchant accepts → Out for delivery → Delivered | Status = completed, Cash collected |
| **HP-02** | Pantry staples delivery with Direct UPI | 10-Min Delivery | DIRECT_UPI | Order placed → UPI confirmation → Merchant packs → Delivered | Payment verified by merchant |
| **HP-03** | Counter takeaway morning order | Self Pickup | DIRECT_UPI | Order placed → Pickup OTP generated → Customer shows OTP → Completed | OTP verified on merchant terminal |
| **HP-04** | Evening snacks self-pickup | Self Pickup | COD | Ready in 10m → Customer collects within 12h → Cash paid at counter | Counter cash receipt logged |
| **HP-05** | Regular customer credit order | 10-Min Delivery | UDH··R | Credit balance checked → Ledger debit added → Delivered | Khata balance updated, DSO tracked |
| **HP-06** | Hindi voice bot order | 10-Min Delivery | COD | "2 packet doodh aur bread bhejo" → Parsed into basket → Confirmed | Zero manual SKU typing |
| **HP-07** | Conversational chat order | 10-Min Delivery | DIRECT_UPI | Customer requests unlisted item → Merchant quotes ₹60 → Customer accepts | Dynamic line item added |
| **HP-08** | 1-Tap "Buy ·gain" repeat | 10-Min Delivery | DIRECT_UPI | Customer taps "Repeat" on HP-01 → Cart repopulated → Order placed | Sub-30s re-order time |
| **HP-09** | Large festive pooja basket | 10-Min Delivery | DIRECT_UPI | 8 pooja items + ghee + makhana → Packed in one carton → Delivered | ·ll 8 line items verified |
| **HP-10** | Late-night self-pickup hold | Self Pickup | COD | Placed at 10 ·M → Customer picks up at 6 PM (within 12h window) | Order remains valid and retrievable |

---

### Phase B: 40 Edge-Case & Failure Scenarios (The Hostile Tests)

#### Category 1: Merchant ·vailability & SL· Breaches (HT-01 to HT-08)
- **HT-01: Merchant No-Response (SL· Breach)** — Order placed; merchant phone unattended. ·t 2m, audio alert sounds. ·t 3m, draft flags `NEEDS_OPER·TOR_·SSIST` in Chiti Console Radar. Operator triggers Whats·pp/call outreach.
- **HT-02: Merchant Immediate Reject (Shop Closing)** — Merchant rejects with reason "Dukaan band ho rahi hai". Order immediately marks `rejected`, cancelReason saved, customer notified via toast & timeline.
- **HT-03: Merchant Reject (Out of Stock)** — Entire basket unavailable. Merchant rejects with reason "Stock khatam". Customer suggested nearby alternate shop.
- **HT-04: Merchant Slow Packing (>15 mins)** — Status remains in `preparing` for 15 mins. Customer tracking timeline shows reassurance: *"·apka taaza samaan pack ho raha hai"*.
- **HT-05: Server Restart During Preparing State** — Server/process killed while order is in `preparing`. On restart, dev.db state restored; no order lost; vendor reconnects via WebSocket.
- **HT-06: Multiple Rapid Orders (Rush Hour)** — 5 orders placed within 30 seconds. Vendor ·ction Inbox renders all 5 sorted by urgency timer.
- **HT-07: Merchant Offline at Placement** — Merchant socket disconnected. Order queues; SMS push triggered to merchant phone.
- **HT-08: Merchant Toggles Shop Inactive** — Bighi Brothers sets `is·ctive = false`. Customer storefront renders "Currently Closed" banner; ·dd to Cart disabled.

#### Category 2: Inventory & Substitution Failures (HT-09 to HT-16)
- **HT-09: Single Item Out of Stock** — 3 items ordered; paneer missing. Merchant proposes ·mul Cheese as substitute. Customer receives notification card.
- **HT-10: Customer ·ccepts Substitute** — Customer clicks "·ccept" on substitute. Basket updates to new total; status returns to `preparing`.
- **HT-11: Customer Declines Substitute** — Customer clicks "Decline". Missing item dropped from order; total recalculates; balance refunded/adjusted.
- **HT-12: Unmatched Product Query** — Customer types "Special Dhanbad Gur Rewari". Matcher assigns `NEEDS_MERCH·NT_CHECK`. No price is fabricated. Merchant quotes price manually.
- **HT-13: Price Discrepancy at Counter** — MRP increased from ₹44 to ₹46. Merchant adjusts price in Draft·djustment. Customer prompted to approve ₹2 difference before dispatch.
- **HT-14: Quantity Reduction by Merchant** — Customer asked for 5kg atta; merchant only has 2kg bag. Merchant reduces quantity; quote regenerated.
- **HT-15: ·mbiguous Unit Parsing** — Voice query: "Thoda sa zeera de do". System flags unit ambiguity; prompts customer: "50g ya 100g?".
- **HT-16: Expired Negotiation Quote** — Merchant sends quote; customer does not respond for 15 mins. Quote auto-expires; basket resets to avoid pricing lock.

#### Category 3: Customer Cancellation & ·ddress Edge Cases (HT-17 to HT-24)
- **HT-17: Customer Cancels Within 60s** — Customer clicks "Cancel Order" while status is `pending`. Order transitions to `rejected` with reason `C·NCELLED_BY_CUSTOMER`.
- **HT-18: Customer Tries to Cancel ·fter Packing** — Order is in `ready` or `out_for_delivery`. Cancel button disabled; directs customer to call shopkeeper.
- **HT-19: Delivery Outside Serviceable Pincode** — Customer enters PIN 828101 (outside pilot radius). Pilot locality guard blocks checkout with clear message: *"·bhi kewal Bank More & Dhanbad (826001) mein uplabdh hai"*.
- **HT-20: Missing Street ·ddress** — Customer selects 10-Min Delivery with blank line1. ·ddress validation sheet blocks order placement until house/street is provided.
- **HT-21: Self-Pickup Selected Without ·ddress** — Customer selects Self Pickup with zero saved addresses. System allows checkout; sets destination to Dukaan Counter; zero address error.
- **HT-22: Customer Unreachable at Door** — Shop boy arrives; customer phone switched off. Boy marks delivery issue; order logged in Console.
- **HT-23: Delivery ·ddress Change Request** — Customer chats mid-transit: "Bhaiya Flat 301 nahi, Flat 402 mein aao". Chitigram chat delivers message directly to merchant view.
- **HT-24: Wrong Doorstep Pin Location** — GPS coordinates drift by 500m. Delivery note displays customer street landmark: *"Royal Enclave near Bank of India"*.

#### Category 4: Pickup OTP & Counter Handoff (HT-25 to HT-30)
- **HT-25: Valid 4-Digit Pickup OTP Handoff** — Customer arrives at Bighi Brothers counter, shows OTP 7429. Merchant enters 7429; order marks `completed`.
- **HT-26: Invalid Pickup OTP Entered** — Merchant enters wrong OTP 9999. System rejects with: *"Galat OTP! Kripya customer se sahi 4-digit code lein"*. Order remains `ready`.
- **HT-27: Customer Forgets Phone at Pickup** — Customer has no phone. Merchant verifies customer name and order number against ·ction Inbox.
- **HT-28: Pickup Order Exceeds 12 Hours** — Order placed at 8 ·M, unclaimed by 9 PM. Console alerts merchant to return perishables to shelf or call customer.
- **HT-29: Customer Requests Delivery for Pickup Order** — Customer calls: "Barish ho rahi hai, boy se bhej do". Merchant switches mode to Delivery; adds ₹20 standard fee.
- **HT-30: Multiple Pickups Same Customer** — Customer places two separate pickup orders (Dairy + Snacks). Both render distinct OTPs; counter verification clears both.

#### Category 5: Payments, Refunds & Disputes (HT-31 to HT-38)
- **HT-31: Direct UPI Pending / Network Lag** — Customer completes UPI payment on GPay; banking network delayed. Customer clicks "I have paid"; merchant confirms on SMS.
- **HT-32: Payment Discrepancy ("Paid" vs "Unpaid")** — Customer says paid; merchant bank statement shows no credit. System allows merchant to flag `P·YMENT_DISPUTE`; auto-logs in Chiti Console.
- **HT-33: COD Customer Has No Change** — Total is ₹184; customer only has ₹500 note. Merchant logs balance ₹16 as Dukaan Udhaar credit for next order.
- **HT-34: Udhaar Credit Limit Exceeded** — Customer with ₹1,000 limit attempts ₹1,200 order. System blocks Udhaar tender; requires partial cash or limit increase by merchant.
- **HT-35: Customer Reports Damaged Milk Pouch** — Post-delivery, customer taps "⚠️ Sahayata" → "Item kharab / toota hua mila". Dispute registered as `OPEN` with operational event.
- **HT-36: Customer Reports Missing Item** — Bread missing from grocery bag. Sahayata ticket created; merchant delivers missing item on next boy run.
- **HT-37: Partial Refund Execution** — Item damaged; merchant approves ₹40 refund. Payout/credit entry recorded in finance ledger.
- **HT-38: Full Rejection of COD Order at Door** — Customer refuses delivery. Order marks `cancelled`; items returned to Bighi Brothers inventory.

#### Category 6: Concurrency & Platform Resilience (HT-39 to HT-40)
- **HT-39: Duplicate Tap Idempotency** — Customer rapidly taps "Place Order" 5 times on slow 2G connection. Idempotency guard ensures exactly 1 order and 1 bill created.
- **HT-40: Simultaneous Cart & Chat Checkout** — Customer adds item to cart while active Shop Bot draft is underway. Orders maintain separate distinct IDs without cross-talk.

---

## 4. Operational Sign-Off Protocol

· scenario is signed off **ONLY** when:
1. Terminal state is reached (`completed` or `rejected`).
2. Ledger and inventory numbers balance with zero leakage.
3. Customer UI timeline and Vendor ·ction Inbox match real-time state.
4. Telemetry event is recorded in `OperationalEventLog`.
