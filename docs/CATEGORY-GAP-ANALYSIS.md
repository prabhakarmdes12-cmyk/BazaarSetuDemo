# Category Gap Analysis — Chiti Bazaar vs. Indian Quick Commerce

**Date:** 2026-09-05 · **Method:** competitive teardown of Blinkit, Zepto,
Swiggy Instamart, BigBasket/BB Now and Reliance (JioMart / Reliance Smart),
mapped against our 14-category master catalog.

---

## 1. Where we stood

Chiti Bazaar shipped **14 categories / 1,364 SKUs**. Blinkit's live storefront
runs **20 top-level categories**; Zepto claims 200,000+ products and Instamart
sits in the middle. Our 14 covered the *pantry* well and the *impulse and
non-food* tail barely at all.

Blinkit's live category rail (observed order):

> Paan Corner · Dairy, Bread & Eggs · Fruits & Vegetables · Cold Drinks &
> Juices · Snacks & Munchies · Breakfast & Instant Food · Sweet Tooth ·
> Bakery & Biscuits · Tea, Coffee & Health Drink · Atta, Rice & Dal ·
> Masala, Oil & More · Sauces & Spreads · Chicken, Meat & Fish · Organic &
> Healthy Living · Baby Care · Pharma & Wellness · Cleaning Essentials ·
> Home & Office · Personal Care · Pet Care

Zepto's own listing adds Frozen, Dry Fruits, Meat & Seafood, Electronics,
Beauty & Makeup, Home & Kitchen, and Fitness/Wellness on top of the grocery
base.

**The pattern:** every major player has moved well past groceries. The
non-grocery tail is where basket value and margin live — groceries are the
traffic driver, the tail is the profit.

---

## 2. The gaps we found

Ranked by **(India demand × margin × q-commerce fit)**, not by how easy they
are to build.

### Tier 1 — ship now

| # | Category | Why it matters |
|---|---|---|
| 1 | **Chicken, Meat & Fish** | Blinkit and Zepto both run it as a *headline* category. In Bihar/Jharkhand, fresh chicken and rohu/katla fish are weekly staples. High AOV (₹200–600), high margin, and a genuine differentiator vs. a plain kirana. |
| 2 | **Pharma & Wellness (OTC)** | The archetypal 10-minute purchase — paracetamol at 2am is *the* q-commerce use case. OTC only; **no prescription drugs** (all three majors refuse them). |
| 3 | **Pooja & Festive Needs** | Culturally essential in India and almost absent from Western-modelled apps. Agarbatti, diya, camphor, kumkum, janeu, festival kits. Enormous Diwali/Chhath spikes — and **Chhath Puja is the single biggest festival in Bihar**, which is our home market. |
| 4 | **Frozen Food & Ice Cream** | Zepto lists 799 SKUs here; McCain and Godrej Yummiez are top brands. Impulse-driven, long shelf life, easy inventory. Needs a freezer — a real constraint for a small dukaan, so we flag it. |
| 5 | **Dry Fruits & Makhana** | High-margin, non-perishable, gifting-driven. **Makhana is grown in Bihar (Darbhanga/Madhubani)** — a local sourcing advantage nobody else has. |
| 6 | **Home & Kitchen Needs** | Blinkit's "Home & Office". Bulbs, batteries, matchboxes, candles, dustbins, buckets, mugs, lighters. Genuine 10-minute emergency buys with a fat margin. |
| 7 | **Sauces, Spreads & Breakfast** | Currently scattered across our Instant Food. Jam, honey, peanut butter, cornflakes, oats, mayo, ketchup. Deserves its own shelf — it's how people build a breakfast basket. |
| 8 | **Stationery & Office** | Blinkit and Wikipedia both list it. Pens, notebooks, geometry boxes, glue, chart paper. **Massive school-season demand** and a strong Tier-2/3 fit. |

### Tier 2 — high value, needs an operational answer

| # | Category | Why it matters | Constraint |
|---|---|---|---|
| 9 | **Pet Care** | Growing fast; Blinkit runs a dedicated HUFT tie-up. | Thin in Tier-3 today. Ship small. |
| 10 | **Beauty & Cosmetics** | Blinkit and Zepto are both actively expanding here; premium AOV. | Needs curation to avoid counterfeits. |
| 11 | **Electronics Accessories** | Blinkit positions itself as a "last-minute electronics store" — dead charger before a flight. | BIS compliance on some items. |
| 12 | **Paan Corner** | Blinkit's **#1** rail position — that placement is not an accident. | Tobacco is age-restricted and legally sensitive. **Ship the mouth-freshener half only** (paan masala, saunf, mints, elaichi); no tobacco, no gutkha. |

### Deliberately excluded

- **Alcohol** — licensed, state-by-state; even Blinkit runs it on a separate platform.
- **Prescription medicines** — none of the three majors accept them.
- **Clothing, furniture, large appliances** — explicitly *not* q-commerce categories.
- **Tobacco / gutkha** — age-restricted, reputationally risky for a village-facing brand.

---

## 3. The Chiti Bazaar–specific insight

The majors are metro-first. Blinkit is in 40+ cities, Zepto in ~10 metros.
**Muzaffarpur, Ranchi and Bihar Tier-2/3 are not their battleground** — and
their category mix reflects metro life, not ours.

That produces three openings a copy-paste of Blinkit's rail would miss:

1. **Pooja & festive is under-served.** Chhath Puja is the defining Bihar
   festival, and no national app merchandises for it properly. This should be
   a *hero* rail in October–November, not a buried tab.
2. **Makhana is a local hero SKU.** Grown in Darbhanga/Madhubani. We can sell
   it fresher and cheaper than a Gurgaon dark store.
3. **Home & Kitchen sundries are the real kirana moat.** Matchbox, candle,
   bulb, battery, mosquito coil — the "chalta hai, le aao" items a village
   shopper walks to the shop for. Blinkit can't beat a neighbour on this;
   our vendors already win it offline.

The strategy is therefore **not** to clone Blinkit's 20 rails. It is to cover
the universal 20, then over-index on the four that are locally decisive:
Pooja, Dry Fruits/Makhana, Home & Kitchen, and Meat & Fish.

---

## 4. What shipped

**14 → 26 categories · 1,364 → 2,111 SKUs · 117 → 192 quick-add essentials.**
All 12 Tier-1 and Tier-2 gaps are live, each with pack-size/price matrices
consistent with the existing generator.

| Category | SKUs | Essentials | Tile |
|---|---:|---:|---|
| Dairy, Bread & Eggs | 85 | 9 | photo |
| Fresh Vegetables | 59 | 11 | photo |
| Fresh Fruits | 35 | 7 | photo |
| Atta, Rice & Dals | 115 | 14 | photo |
| Oils, Ghee & Spices | 134 | 9 | photo |
| Munchies & Namkeen | 85 | 7 | photo |
| Biscuits & Bakery | 79 | 7 | photo |
| Chocolates & Sweets | 84 | 5 | photo |
| Cold Drinks & Juices | 107 | 6 | photo |
| Tea, Coffee & Drinks | 97 | 6 | photo |
| Instant Food | 92 | 7 | photo |
| Cleaning & Household | 113 | 10 | photo |
| Personal Care | 154 | 12 | photo |
| Baby Care & Wellness | 117 | 6 | photo |
| **Chicken, Meat & Fish** | 50 | 6 | photo |
| **Breakfast & Spreads** | 96 | 8 | icon |
| **Frozen Food & Ice Cream** | 53 | 5 | photo |
| **Dry Fruits & Makhana** | 89 | 6 | photo |
| **Pharma & Wellness** | 97 | 8 | photo |
| **Pooja & Festive Needs** | 54 | 7 | photo |
| **Home & Kitchen Needs** | 67 | 7 | icon |
| **Stationery & Office** | 60 | 7 | icon |
| **Beauty & Cosmetics** | 60 | 7 | photo |
| **Pet Care** | 48 | 4 | icon |
| **Electronics & Accessories** | 46 | 6 | icon |
| **Paan Corner & Mouth Fresheners** | 35 | 5 | icon |

Compliance guardrails encoded in the generator and verified by an automated
word-boundary audit over all 2,111 SKU names (0 hits):

- Paan Corner is **mouth-fresheners only** — no tobacco, gutkha, khaini or zarda.
- Pharma is **OTC only** — no prescription medicines.
- No alcohol, apparel, or large appliances.

Also fixed: frozen fries/parathas existed in both Instant Food and Frozen at
inconsistent prices (₹120 vs ₹272). Frozen is now the single home for them.

Remaining follow-up: six categories (Breakfast, Home & Kitchen, Stationery,
Pet Care, Electronics, Paan Corner) fall back to the branded icon plate until
their photos are generated — `CatalogTile` degrades gracefully, so nothing
ever looks broken.

---

## 5. Next moves

1. **Seasonal merchandising engine.** Pooja/festive demand is spiky, not flat.
   A Chhath/Diwali rail that auto-promotes in October–November is worth more
   than the category itself.
2. **Freezer flag in vendor onboarding.** Frozen requires cold chain; the
   vendor app should ask before offering those SKUs.
3. **Makhana as a private label.** Sourced in Darbhanga, packed under a Chiti
   Bazaar label — highest-margin move available to us.
4. **ONDC seeding** for the remaining long tail, once the `MasterProduct`
   backend table exists.
