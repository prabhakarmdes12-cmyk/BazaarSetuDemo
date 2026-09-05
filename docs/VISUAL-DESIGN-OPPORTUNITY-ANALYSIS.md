# Visual Design Opportunity Analysis — Chiti Bazaar

**Date:** 2026-09-05
**Scope:** Splash → Home → Category → Product → Cart → Order → Delivery → Payment
**Benchmarks:** Blinkit, Zepto, Swiggy Instamart, BigBasket/BB Now, Flipkart Minutes, JioMart, Amazon Now
**Horizon:** designing for the 2027 user's mental model

> **Method note, stated up front.** Headless-browser installation is blocked in
> this sandbox, so **no screenshots were captured**. Every finding below comes
> from reading the rendered HTML of live routes plus the component source, and
> every number is measured, not estimated. Findings marked **[VISUAL]** are
> layout/geometry conclusions derived from CSS values rather than from looking
> at pixels — they should be confirmed on a device before major rework.

---

## 0. Executive summary

The design system itself is **genuinely good**: a disciplined dark-first
obsidian/emerald palette, one type family pairing, consistent radii, and a real
elevation scale. Colour contrast **passes WCAG AA on every semantic pair I
measured** — that is better than most apps in this category.

The problems are not aesthetic. They are **structural gaps in the journey** and
**a type scale that ignores the actual audience**. Three findings dominate:

| # | Finding | Severity |
|---|---|---|
| 1 | **No product detail page exists.** No route under `/customer/product/*`. | Critical |
| 2 | **No payment screen and no address screen exist.** Cart → `POST /api/orders` → confirm. | Critical |
| 3 | **132 font declarations below 12px**, on an app for Tier-2/3 and older users. | High |

---

## 1. Screen-by-screen audit

### 1.1 Splash (`/splash`)
Visually the most finished screen: hero photo, glass "Verified Shop" badge,
ambient blur, Hinglish CTA ("Aage Badhein"). Good.

- **Three progress dots imply a 3-step onboarding that does not exist** — the
  button jumps straight to `/customer`. The dots promise a journey and then
  break that promise.
- No language choice at the one moment it is cheapest to ask.
- `/` and `/splash` are near-duplicate brand moments; `/` immediately redirects.

### 1.2 Home (`/customer`)
- **12 fallback products are hardcoded with `images.unsplash.com` hotlinks.**
  47 such URLs remain across `customer/page.tsx`, `ProductCard.tsx`,
  `ShopCard.tsx`. These are exactly the unverifiable hotlinks I removed from the
  master catalog; the home screen — the *first* screen — still depends on them.
  If Unsplash rate-limits or the user is on a filtered network, the primary
  shelf degrades.
- Category strip (`SHOP_CATEGORIES`) has **8 entries and is stale** — it does
  not include Pooja, Meat, Pharma, Makhana or any of the 12 categories just
  shipped. Two competing category vocabularies now exist in one app.
- No "buy again" rail. Grep for reorder across the customer flow: **zero hits**.
  For a habitual grocery app this is the single biggest retention miss.

### 1.3 Category / storefront (`/customer/shop/[id]`)
The strongest screen. Sticky dual rail (horizontal on mobile, left rail on
desktop), 26 categories, photo tiles, progressive reveal, discount and 10-min
badges. This is at parity with Blinkit's rail pattern.

- **[VISUAL] Bottom-bar collision.** `AppShell` renders `BottomNavBar` at
  `fixed bottom-0` + `pb-[calc(env(safe-area-inset-bottom)+16px)]` (≈72px tall,
  `z-50`). `BighiStorefront` renders `FloatingCartDock` at `fixed bottom-4`
  (16px, `z-40`). Whenever the cart is non-empty **the dock renders underneath
  the nav bar**. The dock is the primary conversion CTA.
- Shelf headers repeat the category photo already shown in the rail — the same
  image twice within ~40px.

### 1.4 Product detail — **MISSING**
There is no `/customer/product/[id]` route. `ls src/app/customer/` returns
`cart, notifications, orders, page.tsx, profile, referral, shop`.

Consequence: a shopper can never see a full description, ingredients, FSSAI
mark, shelf life, unit economics (₹/kg), or alternatives. For **pharma**
(dosage), **meat** (cut, weight), and **baby care** (age band) — three
categories just added — this is not merely a UX gap, it is a
trust-and-liability gap.

Nuance worth stating: Blinkit and Zepto deliberately *de-emphasise* product
pages, and 2026 trend writing explicitly recommends "skip product pages" for
one-tap repeat buys. That is correct for milk. It is **not** correct for a
₹1,800 BP monitor or a paracetamol strip. The answer is a **bottom-sheet
detail** — not a full page — so the one-tap path stays intact.

### 1.5 Cart (`/customer/cart`)
Clean bill breakdown, sticky pay bar, guest-mode notice, "100% Secure".

- **No delivery address anywhere in the app.** Grep for address/pincode/location
  in cart and home: **zero hits**. A hyperlocal delivery app cannot ship without
  it — and "Delivery partner fee: FREE" is hardcoded, which is exactly the
  hidden-fee pattern that erodes trust once real fees appear.
- **No ETA in the cart.** The 10-minute promise appears on tiles and vanishes at
  the moment of commitment, which is when it matters most.
- No "add ₹X more" nudge — a standard AOV lever across all three majors.

### 1.6 Payment — **MISSING**
`handlePlaceOrder` posts `{ shopId }` and routes to confirm. There is **no
payment method selection anywhere** — grep for UPI/razorpay/COD across the
customer flow returns nothing.

For India in 2027 this is the most consequential gap. UPI is the default
payment mental model; the absence of a UPI/COD choice — and of a
`Pay on delivery` affordance for a `udhaar`-literate audience — is a hard
blocker to launch, not a polish item.

### 1.7 Order & delivery (`/customer/orders/[id]`)
`ORDER_STEPS` is well modelled with bilingual labels (`labelHi`) — good, and
notably the **only** place bilingual strings are structured rather than
hardcoded.

- No live map, no rider identity, no live countdown. 2026 benchmarks put live
  tracking at the centre of post-order UX and tie it to a ~40% drop in support
  contacts. Ours is a static stepper.
- `pickup` and `out_for_delivery` are siblings in one linear stepper, so a
  pickup order still renders a delivery-shaped progress bar.

---

## 2. Cross-cutting visual findings

### 2.1 Type scale — the biggest systemic defect
Measured across 72 `.tsx` files:

| Size | Count |
|---|---|
| 9px | 5 |
| 10px | **85** |
| 11px | 42 |
| 12px | 3 |
| 13px | 3 |
| 15px | 1 |

**132 of 141 arbitrary sizes are below 12px.** On the storefront page alone the
rendered HTML contains **862** sub-11px declarations.

This is a mismatch with the audience. Chiti Bazaar targets Muzaffarpur and
Bihar Tier-2/3 — including first-time smartphone shoppers and older users,
often on low-cost panels in daylight. 10px Inter on `#070A07` is legible in a
design tool and marginal on a ₹7,000 phone outdoors. **Contrast passes; size
does not.**

There is also scale sprawl: an arbitrary px ladder (9/10/11/12/13/15) running
*in parallel* with the Tailwind ladder (`xs` ×170, `sm` ×193, `lg` ×81 …). Two
competing type systems.

### 2.2 Colour & contrast — genuinely strong (measured)
WCAG ratios against `surface #070A07` / `container-low #0E140E`:

| Foreground | on surface | on container-low | Verdict |
|---|---:|---:|---|
| white | 19.90 | 18.67 | PASS AA |
| on-surface-variant `#A3B19B` | 8.83 | 8.28 | PASS AA |
| primary `#10B981` | 7.84 | 7.36 | PASS AA |
| warning `#F59E0B` | 9.26 | 8.69 | PASS AA |
| error `#EF4444` | 5.29 | 4.96 | PASS AA |
| secondary `#22C55E` | 8.73 | 8.19 | PASS AA |

Every pair clears 4.5:1. No changes needed. Keep this.

One strategic caveat: **the app is dark-only** (`darkMode: 'class'`, obsidian
surfaces, no light theme). Dark mode is correct for the 8pm–midnight peak, but
Indian daylight outdoor use is a large share of grocery ordering, and every
major competitor is light-first. This is a deliberate brand bet worth
re-testing, not an error.

### 2.3 Touch targets — **[VISUAL]**
The storefront markup contains 26 `w-8/h-8` (32px) and 28 `w-9/h-9` (36px)
interactive elements. Both are below the 44×44px iOS / 48dp Android floor.
Quantity steppers use `px-3 py-1` (~28px tall) — the most-tapped control in the
entire app, and the one most likely to be used one-handed while walking.

### 2.4 Language — inconsistent register
Hinglish is used warmly and well ("Dukaan se seedha baat karke order karein",
"Cart khali hai", "Order ho gaya!"). But it sits beside untranslated English
("Bill details", "Items total", "Delivery partner fee", "100% Secure",
"VERIFIED", "PAYING").

The **money moment is the most English part of the app** — precisely where a
first-time user most needs their own language. There is no Devanagari option
and no language switch, despite `Noto Sans Devanagari` already being loaded in
the font stack. The type infrastructure is ready; the content is not.

### 2.5 Accessibility
37 `aria-label`s and 14 `alt` attributes across the codebase — thin for ~36
routes. `CatalogTile` correctly marks decorative layers `aria-hidden`.

A `prefers-reduced-motion` block **does** already exist in `globals.css` and
covers everything via the universal selector — an earlier draft of this document
claimed it was missing, which was wrong. Its explicit class list had drifted
behind the newer decorative animations (`leaf-sway`, `float`, `pulse-ring`),
so those names have now been added for clarity.

---

## 3. Designing for the 2027 mental model

Four shifts, and where we stand:

| Shift | 2027 expectation | Chiti Bazaar today |
|---|---|---|
| **Intent over navigation** | Say/type "doodh aur bread", basket assembles | Text search only; `onVoiceSearch` is a stub |
| **Predictive home** | Home is a personalised reorder list | Static shelves, no reorder |
| **Radical fee transparency** | Full landed cost before commitment | Hardcoded "FREE" |
| **Live, human tracking** | Map + rider identity | Static stepper |

The strategic read: **the majors are converging on a sterile dark-store
aesthetic.** Blinkit, Zepto and Instamart increasingly look alike — efficient,
anonymous, warehouse-shaped. None of them can credibly show *your actual
shopkeeper*.

Chiti Bazaar's differentiator is already in the product (`ChatInterface`,
`udhaar`, "Dukaan se seedha baat karke order karein") but **not yet in the
visual language**. The named, photographed, reachable shopkeeper should be the
hero of the interface, not a chat icon. That is the one thing a Gurgaon dark
store structurally cannot copy — and it is *more* valuable in 2027, not less,
as AI-mediated commerce makes every other storefront feel identical.

---

## 4. Prioritised opportunities

**P0 — blockers**
1. **Payment screen.** UPI (intent + QR), COD, and `udhaar` as a first-class
   tender. Nothing ships without this.
2. **Address / location.** Map pin + saved labels (Ghar / Dukaan / Kaam),
   surfaced in the top bar and confirmed in the cart.
3. **Product detail bottom-sheet.** Not a full page — preserves one-tap. Must
   carry ₹/kg, FSSAI, pack shot, and for pharma/meat/baby the
   category-specific fields.

**P1 — high leverage**
4. **Type scale floor of 12px**, and collapse the two ladders into one. Body
   13–14px, captions 12px. Single highest-impact visual change for our users.
5. **Fix the bottom-bar collision** — dock above nav, or hide nav when the dock
   is live. **[VISUAL]**
6. **Touch targets to 44px** on steppers, ADD, and quantity controls.
7. **Reorder rail** on home, driven by order history.
8. **Real ETA + full fee breakdown** in cart.

**P2 — differentiation**
9. **Shopkeeper as hero** — photo, name, "usually replies in 2 min", one-tap
   call. Lean into the thing dark stores cannot fake.
10. **Full Hinglish/Devanagari pass on the money screens**, plus a language
    toggle on splash (where the dead progress dots currently sit).
11. **Voice search** — wire `onVoiceSearch` to Web Speech API, Hindi-first.
12. **Live delivery tracking** with rider identity.
13. **Retire the 47 Unsplash hotlinks** on home; self-host as already done for
    the catalog.
14. **`prefers-reduced-motion`** guard.

---

## 5. What NOT to change

- The obsidian + emerald palette. It is distinctive, measurably accessible, and
  correct for night-peak ordering.
- The 26-category rail architecture on the storefront.
- The `CatalogTile` photo-over-gradient fallback.
- Hinglish as the brand voice — extend it, do not dilute it.
- `ORDER_STEPS`' bilingual structure; make it the pattern for all copy.
