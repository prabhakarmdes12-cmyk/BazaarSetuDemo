# Paaska Pilot Runbook — Phase B Hostile Tests (Part 1 Evidence Report)

**Execution Timestamp:** 2026-09-06T14:22:47.872Z  
**Platform:** Paaska Hyperlocal Operating System (Powered by Chiti Technologies)  
**Flagship Merchant:** Bighi Brothers Mart (Bank More, Dhanbad · 826001)  
**Suite:** Phase B Hostile & Failure Scenarios (10 Scenarios Tested)  
**Result:** **10 / 10 Hostile Path Scenarios PASSED (100%)**

---

## Summary Execution Matrix

| Scenario ID | Test Scenario | Expected Failure Behavior | Result | Audit Evidence |
|---|---|---|---|---|
| **HT-01** | Merchant No-Response SLA Breach | Flagged NEEDS_OPERATOR_ASSIST after 3m timeout | ✅ PASS | Order #5ed33aea unattended for 4.0 mins. Automated telemetry emitted SLA_BREACH_MERCHANT_NO_RESPONSE. |
| **HT-02** | Merchant Reject on Shop Closing | Status = rejected, cancelReason recorded, customer alerted | ✅ PASS | Order transitioned to rejected with reason "Dukaan band ho rahi hai (Closing for night)". Timeline updated. |
| **HT-03** | Merchant Reject on Out of Stock | Status = rejected, cancelReason = Stock khatam | ✅ PASS | Stock exhaustion handled: order marked rejected with refund alert. |
| **HT-04** | Slow Packing Timeline Reassurance | Customer timeline displays reassurance copy when packing >15m | ✅ PASS | Packing time 16.0 mins exceeded threshold. Customer tracking message generated: "Aapka taaza samaan pack ho raha hai — thoda samay aur lag sakta hai.". |
| **HT-06** | Rush Hour Concurrency (5 Rapid Orders) | 5 distinct orders created without collision or deadlocks | ✅ PASS | Created 5 concurrent orders in parallel. All IDs distinct (7c4317, 0b498b, 14b51f, 5f4d6f, d0cc0d). |
| **HT-08** | Merchant Toggles Shop Inactive | Store marked closed; Add to Cart disabled | ✅ PASS | Shop isActive toggled to false, triggering "Currently Closed" banner on customer storefront. Successfully reverted to active. |
| **HT-17** | Customer Instant Cancellation Within 60s | Order transitions to rejected with CANCELLED_BY_CUSTOMER | ✅ PASS | Order #8753fc60 in pending state was cancelled by shopper. Reason saved as CANCELLED_BY_CUSTOMER. |
| **HT-18** | Cancellation Guard Post-Dispatch | Customer direct cancellation blocked; directs to call dukaan | ✅ PASS | Order in status "out_for_delivery". Direct cancellation correctly blocked. UI redirects customer to [ 📞 Call Dukaan ]. |
| **HT-21** | Self-Pickup Allowed Without Saved Address | Destination defaults to Dukaan Counter; address error bypassed | ✅ PASS | Self-pickup checkout succeeded with 0 saved customer addresses. Counter destination assigned automatically. |
| **HT-26** | Invalid Counter Pickup OTP Rejection | Wrong OTP rejected; order status remains ready | ✅ PASS | Submitted OTP "9999" did not match real OTP "7429". Rejection message: "Galat OTP! Kripya customer se sahi 4-digit code lein.". Order preserved in ready state. |

---

## Invariants & Resilience Validations
- **SLA Enforcement (`HT-01`)**: Unattended orders trigger automated operator escalation at 3m threshold.
- **Rejection Integrity (`HT-02`, `HT-03`)**: Rejection reasons recorded in database, triggering instant timeline updates.
- **Concurrency Safety (`HT-06`)**: 5 rapid parallel order submissions created distinct IDs without deadlocks.
- **Cancellation State Guard (`HT-17`, `HT-18`)**: Pending orders allow instant cancellation; post-dispatch orders lock cancellation.
- **Pickup Security (`HT-21`, `HT-26`)**: Zero-address pickup allowed, but incorrect OTP strictly blocks counter release.
