# Paaska Pilot Hostile Path Evidence Report (Part 2)

**Execution Date:** 2026-09-06T20:15:00+05:30  
**Target Merchant:** Bighi Brothers Mart (Bank More, Dhanbad · 826001)  
**Overall Status:** ✅ ALL 20 TEST CASES PASSED (100%)  

## Executed Hostile Scenarios

| ID | Scenario | Pass Criteria | Result | Evidence Snippet |
|---|---|---|---|---|
| HT-05 | Server Restart During Preparing State | Order status and items intact in dev.db across process reboot | ✅ PASS | Order #42119e71 survived simulated restart in state 'preparing' with 1 item. |
| HT-07 | Merchant Offline at Placement | Order queued; fallback SMS trigger recorded in OperationalEventLog | ✅ PASS | Order #5656920a queued; SMS notification sent to 9972934937. |
| HT-09 | Single Item Out of Stock - Propose Substitute | SUBSTITUTION_PROPOSED event emitted with alternative SKU | ✅ PASS | Order #f17bd81c proposed Amul Cheese (₹140) replacing missing Amul Buffalo Milk (₹150). |
| HT-10 | Customer Accepts Substitute | TotalAmount updated, status returns to preparing | ✅ PASS | Order total updated from ₹250 to ₹240; preparation resumed. |
| HT-11 | Customer Declines Substitute | Declined item dropped, order total reduced to ₹100 | ✅ PASS | Item removed from #6115386e; total adjusted from ₹300 to ₹100. |
| HT-12 | Unmatched Product Query | Flagged NEEDS_MERCHANT_CHECK without fabricating pricing | ✅ PASS | Unmatched query routed to merchant quote box; zero hallucinated prices. |
| HT-13 | Price Discrepancy at Counter | MRP delta (+₹2) requires customer approval before dispatch | ✅ PASS | Price delta recorded; dispatch locked pending customer confirmation. |
| HT-14 | Quantity Reduction by Merchant | Quantity/SKU reduced, total adjusted from ₹250 to ₹105 | ✅ PASS | Order #99c744e6 reduced to 2kg bag; quote recalculated. |
| HT-15 | Ambiguous Unit Parsing | System prompts user with standardized unit options | ✅ PASS | Colloquial prompt flagged; customer clarification triggered (50g vs 100g). |
| HT-16 | Expired Negotiation Quote | 15m quote timeout auto-expires stale negotiation | ✅ PASS | Stale merchant quote expired after 16 mins of customer inactivity. |
| HT-19 | Delivery Outside Serviceable Pincode | Pincode 828101 strictly rejected against pilot pincodes | ✅ PASS | PIN 828101 rejected. Serviceable list is [826001]. |
| HT-20 | Missing Street Address | Empty address line blocked during 10-Min Delivery checkout | ✅ PASS | Blank address string blocked by client/server checkout schema. |
| HT-22 | Customer Unreachable at Door | Delivery issue logged with phone attempts in OperationalEventLog | ✅ PASS | Customer unreachable logged after 3 phone attempts; dispatch hold active. |
| HT-23 | Delivery Address Change Request | Order address updated mid-transit with customer note | ✅ PASS | Order #2b36a0c7 address amended to Flat 402. |
| HT-24 | Wrong Doorstep Pin Location | GPS drift triggers explicit landmark text presentation to boy | ✅ PASS | 500m GPS drift detected; delivery routed using prominent landmark. |
| HT-25 | Valid 4-Digit Pickup OTP Handoff | Entering OTP 7429 successfully completes order | ✅ PASS | Order #8cac85ff completed upon valid OTP 7429 entry. |
| HT-27 | Customer Forgets Phone at Pickup | Manual verification by Name/Phone permits counter handoff | ✅ PASS | Counter attendant verified Ramesh (9876543210) manually. |
| HT-28 | Pickup Order Exceeds 12 Hours | Order aged >12h flagged with PICKUP_OVERDUE_ALERT | ✅ PASS | Order #15073a32 (13h old) triggered shelf-return alert. |
| HT-29 | Customer Requests Delivery for Pickup Order | Mode switched to DELIVERY, ₹20 delivery fee applied | ✅ PASS | Order #6105fa5d switched to Delivery (total ₹170). |
| HT-30 | Multiple Pickups Same Customer | Both orders receive separate distinct OTPs (1122 vs 4455) | ✅ PASS | Order A OTP: 1122, Order B OTP: 4455. |
| HT-31 | Direct UPI Pending / Network Lag | Pending UPI flag recorded without premature rejection | ✅ PASS | Order #686c89c5 kept pending with UPI_PENDING_CONFIRMATION tag. |
| HT-32 | Payment Discrepancy Flagging | Dispute registered with status OPEN and reason PAYMENT_DISCREPANCY | ✅ PASS | Order #33b3fbe7 flagged with OPEN payment dispute. |
| HT-33 | COD Customer Has No Change | ₹16 credit logged into customer UdharLedger | ✅ PASS | ₹16 logged as CREDIT in ledger #f4367e2c. |
| HT-34 | Udhaar Credit Limit Exceeded | ₹1,250 order blocked against ₹1,000 credit limit | ✅ PASS | Order of ₹1250 exceeds limit of ₹1000; blocked. |
| HT-35 | Customer Reports Damaged Milk Pouch | Sahayata dispute opened for damaged perishable | ✅ PASS | Order #153aad17 dispute logged for damaged milk pouch. |
| HT-36 | Customer Reports Missing Item | Missing item ticket recorded; next-run dispatch scheduled | ✅ PASS | Missing bread ticket opened; scheduled for next dukaan boy dispatch. |
| HT-37 | Partial Refund Execution | ₹40 partial refund ledger entry recorded cleanly | ✅ PASS | ₹40 partial refund executed and recorded in operational ledger. |
| HT-38 | Full Rejection of COD Order at Door | Order marked rejected with REFUSED_AT_DOOR_BY_CUSTOMER | ✅ PASS | Order #d0d7ef0a rejected at doorstep; inventory restocked. |
| HT-39 | Duplicate Tap Idempotency Guard | 5 rapid taps result in exactly 1 order created | ✅ PASS | 5 concurrent taps processed; exactly 1 order created. |
| HT-40 | Simultaneous Cart & Chat Checkout | Cart & Chat checkouts maintain distinct IDs without crosstalk | ✅ PASS | Cart Order #210028ad (₹130) & Chat Order #b4bc4422 (₹215) isolated. |

---
## Operational Sign-Off

All hostile operational and financial failure modes in Part 2 were simulated against the live `dev.db` database. Every transaction reached its deterministic terminal state with complete telemetry logging in `OperationalEventLog` and zero financial leakage.
