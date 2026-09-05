# Paaska ⚡🍃

> **"Jo chahiye, paas se."**  
> Hyperlocal 10-Minute Instant Delivery & Counter Pickup Operating System for Neighborhood Dukaans.  
> *Powered by Chiti Technologies*

---

## 🏬 Overview

**Paaska** (built on the BazaarSetu commerce runtime) is a living local-commerce operating system. It bridges the gap between quick-commerce convenience and trusted neighborhood kiranas, starting with our pilot flagship: **Bighi Brothers Mart (Bank More, Dhanbad · 826001)**.

Paaska allows shoppers to order daily milk, groceries, pooja essentials, produce, and medicines in **10 minutes** or choose **12-Hour Self Pickup (Free)** from verified local merchants, backed by a modern digital khata (credit ledger).

---

## 🚀 Key Capabilities Live in Pilot

1. **⚡ 10-Minute Instant Delivery & 12-Hour Self Pickup**:
   - **Mode A (10-Min Delivery):** Instant doorstep delivery fulfilling local kirana orders in under 15–30 minutes with our bold 10-minute marketing anchor.
   - **Mode B (Self Pickup):** Free takeaway with a generated **4-digit Pickup OTP** valid for 12 hours from Bighi Brothers Mart counter.
2. **📦 Master Central Product Repository (2,145 SKUs · 26 Categories)**:
   - **96 Studio Pack Shots** (600×600 JPG on clean studio sweep) covering 191 high-velocity SKUs.
   - **Identity-Keyed Architecture:** Manifest keyed by `[categoryId, name, unit, slug]` ensuring zero image misattribution.
3. **🔁 1-Tap "Buy Again" Retention Rail**:
   - Horizontal carousel on `/customer` rendering past orders with a 1-tap re-order button into cart.
4. **📥 Vendor Action Inbox**:
   - Replaces static dashboards with an urgent operational queue: timer indicators, accept/pack buttons, reject reasons, and OTP verification.
5. **⚠️ One-Tap Sahayata & Dispute Resolution**:
   - Built-in reporting for missing, damaged, or delayed items with automatic operational telemetry.

---

## 🛠️ Tech Stack & Invariants

- **Frontend:** Next.js 14/16 (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide icons.
- **Backend:** Node.js, Express, Prisma ORM, SQLite (Dev) / PostgreSQL (Prod), WebSockets.
- **Control Plane:** Chiti Console Integration (`D:\Projects\chiti-console`) with Fulfilment & Money Radars.

---

## 🧪 Pilot Verification & Testing

See the full **50 Hostile Transactions Testing Specification**:
[PAASKA_PILOT_TEST_SPEC.md](file:///D:/Projects/BazaarSetu/docs/PAASKA_PILOT_TEST_SPEC.md)
