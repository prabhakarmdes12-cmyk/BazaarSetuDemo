# BazaarSetu Design Journal

> A comprehensive documentation of the BazaarSetu multi-vendor marketplace — technical architecture, UX design principles, user stories, personas, and customer journeys.

---

## Table of Contents

1. [Product Vision](#product-vision)
2. [User Personas](#user-personas)
3. [User Stories](#user-stories)
4. [Customer Journeys](#customer-journeys)
5. [Information Architecture](#information-architecture)
6. [Design System — The Digital Courtyard](#design-system)
7. [Technical Architecture](#technical-architecture)
8. [Screen Inventory](#screen-inventory)
9. [Navigation Flows](#navigation-flows)
10. [UX Design Decisions](#ux-design-decisions)
11. [Technical Implementation](#technical-implementation)

---

## Product Vision

**BazaarSetu** ("Bazaar Bridge") is a hyperlocal multi-vendor marketplace designed for the Indian small-town and tier-2/3 city market. The tagline **"Apni local dukaan, ab online"** ("Your local shop, now online") captures its core value proposition: bringing the trust and convenience of neighborhood kirana stores into a digital experience.

### Core Principles

- **Trust-first**: Every interaction builds trust between buyer and local merchant
- **Vernacular-native**: Hindi-English (Hinglish) UI language throughout
- **Mobile-first**: Designed for 884px viewport (iPhone-class devices)
- **Low-bandwidth**: Minimal JavaScript, no build step, works on 3G
- **Offline-resilient**: Static HTML can be cached and served offline

---

## User Personas

### Persona 1: Arjun Kumar — The Customer

| Attribute | Detail |
|-----------|--------|
| **Age** | 28 |
| **Location** | Sector 14, Tier-2 city (e.g., Meerut, Bareilly) |
| **Occupation** | IT professional, works from home |
| **Tech comfort** | High — uses WhatsApp, UPI, Instagram daily |
| **Pain points** | Doesn't know which local shops are open, tired of calling to check stock, wants to compare prices across nearby shops |
| **Goals** | Order groceries from trusted local shops, track orders in real-time, maintain udhaar (credit) ledger digitally |
| **Devices** | Android phone (Redmi Note series), uses Jio network |

**Behavioral traits:**
- Prefers browsing over searching
- Trusts shops with verified badges and high ratings
- Values delivery speed over price
- Uses UPI (GPay/PhonePe) for payments
- Keeps mental notes of udhaar with 3-4 shops

---

### Persona 2: Ramesh Sharma — The Vendor/Merchant

| Attribute | Detail |
|-----------|--------|
| **Age** | 42 |
| **Location** | Owns "Sharma Fresh Produce" in Sector 14 market |
| **Business** | Kirana store, 15 years old, ₹3-5 lakh monthly revenue |
| **Tech comfort** | Moderate — uses WhatsApp Business, basic smartphone |
| **Pain points** | Can't manage orders on phone calls alone, loses paper udhaar diaries, no visibility into monthly performance |
| **Goals** | Accept orders digitally, manage inventory, track payouts, maintain customer udhaar digitally |
| **Devices** | Android phone (Samsung M-series), wife helps with tech |

**Behavioral traits:**
- Checks dashboard 4-5 times a day
- Prioritizes order management over everything
- Needs simple, large-button UI
- Values quick payout settlement
- Wants to see which products sell most

---

### Persona 3: Priya Verma — The Admin/Platform Manager

| Attribute | Detail |
|-----------|--------|
| **Age** | 32 |
| **Location** | Remote, manages the platform from home office |
| **Role** | Operations manager for BazaarSetu |
| **Tech comfort** | High — comfortable with dashboards and analytics |
| **Pain points** | Needs to monitor all shops/orders at scale, handle disputes, manage platform settings |
| **Goals** | Ensure smooth operations, approve/manage shops, track platform health |
| **Devices** | Laptop (primary), phone for on-the-go monitoring |

---

## User Stories

### Customer Stories

| ID | Story | Priority | Screen |
|----|-------|----------|--------|
| C-01 | As a customer, I want to log in with my phone number so I can access my account securely | P0 | login, otp |
| C-02 | As a customer, I want to discover nearby shops so I can browse their products | P0 | home, shop-products |
| C-03 | As a customer, I want to add products to my cart and checkout so I can place an order | P0 | cart, order-confirm |
| C-04 | As a customer, I want to track my order status so I know when it will be ready | P1 | order-status |
| C-05 | As a customer, I want to view my order history so I can reorder easily | P1 | order-history |
| C-06 | As a customer, I want to chat with a shop owner so I can ask about products | P1 | shop-chat |
| C-07 | As a customer, I want to see my profile and saved addresses | P2 | profile |
| C-08 | As a customer, I want to receive notifications about my orders | P2 | notifications |
| C-09 | As a customer, I want to see shop ratings and reviews to decide which shop to buy from | P1 | home |
| C-10 | As a customer, I want to filter shops by category (Grocery, Vegetables, Dairy) | P2 | home |

### Vendor Stories

| ID | Story | Priority | Screen |
|----|-------|----------|--------|
| V-01 | As a vendor, I want to see my dashboard with today's orders, revenue, and ratings | P0 | dashboard |
| V-02 | As a vendor, I want to manage my inventory (add, edit, stock levels) | P0 | inventory, add-product |
| V-03 | As a vendor, I want to view and update order status (accept, pack, complete) | P0 | orders |
| V-04 | As a vendor, I want to chat with customers about their orders | P1 | chat-list, chat |
| V-05 | As a vendor, I want to track my payouts and see when money will be settled | P1 | payouts, payout-schedule |
| V-06 | As a vendor, I want to link my bank account for payouts | P1 | link-bank, bank-success |
| V-07 | As a vendor, I want to see my performance metrics (revenue, orders, ratings) | P2 | performance, yearly-report |
| V-08 | As a vendor, I want to download business reports | P2 | reports |
| V-09 | As a vendor, I want to edit my shop profile and toggle shop open/closed | P1 | edit-profile |
| V-10 | As a vendor, I want to see detailed stats with trends | P2 | stats |

### Admin Stories

| ID | Story | Priority | Screen |
|----|-------|----------|--------|
| A-01 | As an admin, I want to see platform overview (total shops, orders, revenue) | P0 | overview |
| A-02 | As an admin, I want to manage shops (approve, disable, view details) | P0 | shops |
| A-03 | As an admin, I want to view all orders across the platform | P1 | orders |
| A-04 | As an admin, I want to configure platform settings | P2 | settings |
| A-05 | As an admin, I want to generate and download platform reports | P2 | settings-reports |

### Udhaar Khata Stories

| ID | Story | Priority | Screen |
|----|-------|----------|--------|
| U-01 | As a customer, I want to see my udhaar (credit) balance with each shop | P0 | ledger |
| U-02 | As a customer, I want to see detailed transaction history with a shop | P0 | shop-ledger |
| U-03 | As a customer, I want to make a payment to settle my udhaar | P0 | make-payment |
| U-04 | As a customer, I want to see payment confirmation after settling udhaar | P1 | payment-success |

---

## Customer Journeys

### Journey 1: First-Time Customer Order

```
SPLASH → LOGIN → OTP → HOME → SHOP-PRODUCTS → CART → ORDER-CONFIRM → ORDER-STATUS
```

**Steps:**

1. **Splash** — Brand introduction, "Aage Badhein" CTA
   - *Emotion:* Curiosity, anticipation
   - *Friction:* None — single clear CTA

2. **Login** — Phone number entry with country code
   - *Emotion:* Trust (secure portal badge)
   - *Friction:* Must enter valid 10-digit number

3. **OTP** — 4-digit verification code (pre-filled for demo)
   - *Emotion:* Confidence (security badge visible)
   - *Friction:* Waiting for SMS, potential wrong code entry

4. **Home** — Discovery feed with shop cards, categories, featured items
   - *Emotion:* Excitement, exploration
   - *Key actions:* Browse shops, tap "Browse Items", open cart

5. **Shop Products** — Product grid with images, prices, ratings
   - *Emotion:* Consideration, comparison
   - *Key actions:* View products, switch to chat, add to cart

6. **Cart** — Cart items with quantities, subtotal, checkout CTA
   - *Emotion:* Review, commitment
   - *Key actions:* Adjust quantities, proceed to checkout

7. **Order Confirm** — Success screen with order ID, store details
   - *Emotion:* Satisfaction, relief
   - *Key actions:* Track order, return to bazaar

8. **Order Status** — Stepper showing Pending → Accepted → Preparing → Completed
   - *Emotion:* Anticipation, tracking
   - *Key actions:* Call merchant, track location

**Drop-off risks:**
- OTP screen (if SMS doesn't arrive)
- Cart screen (if total is higher than expected)

---

### Journey 2: Vendor Daily Operations

```
DASHBOARD → ORDERS (manage) → INVENTORY (update) → CHAT-LIST (reply) → PAYOUTS (check)
```

**Steps:**

1. **Dashboard** — Morning check: today's orders, revenue, ratings
   - *Emotion:* Motivation, urgency (if many pending orders)
   - *Key actions:* Quick-action cards to orders, inventory, chats, add product

2. **Orders** — View pending orders, accept/reject, update status
   - *Emotion:* Focus, productivity
   - *Key actions:* Accept order, mark as packed, mark as delivered

3. **Inventory** — Check stock levels, update quantities
   - *Emotion:* Control, organization
   - *Key actions:* Toggle stock, edit product, add new item

4. **Chat List** — Reply to customer queries
   - *Emotion:* Customer connection, responsiveness
   - *Key actions:* Open chat, send reply

5. **Payouts** — Check balance, initiate settlement
   - *Emotion:* Financial satisfaction
   - *Key actions:* Request payout, view schedule, link bank

**Critical path:** Dashboard → Orders (highest frequency action)

---

### Journey 3: Udhaar Settlement

```
LEDGER → SHOP-LEDGER → MAKE-PAYMENT → PAYMENT-SUCCESS
```

**Steps:**

1. **Ledger** — View all shops with pending balances
   - *Emotion:* Awareness, slight stress (seeing debts)
   - *Key actions:* Tap shop to see details, start settlement

2. **Shop Ledger** — Detailed transaction timeline
   - *Emotion:* Clarity, understanding
   - *Key actions:* Review entries, initiate payment

3. **Make Payment** — Select payment method (UPI, Wallet, Cash)
   - *Emotion:* Commitment, trust in security
   - *Key actions:* Select method, confirm payment

4. **Payment Success** — Confirmation with receipt download
   - *Emotion:* Relief, satisfaction
   - *Key actions:* Download receipt, return to ledger

---

### Journey 4: Admin Platform Monitoring

```
OVERVIEW → SHOPS (manage) → ORDERS (monitor) → SETTINGS (configure)
```

**Steps:**

1. **Overview** — Platform-wide metrics (shops, orders, revenue)
   - *Emotion:* Control, situational awareness
   - *Key actions:* Drill into shops or orders

2. **Shops** — List of all shops with enable/disable toggles
   - *Emotion:* Administrative authority
   - *Key actions:* Toggle shop status, view details

3. **Orders** — All orders across the platform
   - *Emotion:* Operational oversight
   - *Key actions:* Filter, search, view details

4. **Settings** — Platform configuration, reports
   - *Emotion:* System control
   - *Key actions:* Toggle settings, download reports

---

## Information Architecture

```
BazaarSetu
├── Customer Flow
│   ├── Onboarding: splash → login → otp
│   ├── Discovery: home → shop-products → shop-chat
│   ├── Transaction: cart → order-confirm → order-status
│   ├── History: order-history
│   └── Account: profile → notifications
│
├── Vendor Flow
│   ├── Dashboard: dashboard
│   ├── Operations: orders, inventory → add-product
│   ├── Communication: chat-list → chat
│   ├── Finance: payouts → payout-schedule, link-bank → bank-success
│   └── Analytics: stats, performance → yearly-report, reports
│
├── Admin Flow
│   ├── Overview: overview
│   ├── Management: shops, orders
│   └── Configuration: settings → settings-reports
│
└── Udhaar Khata Flow
    ├── Ledger: ledger
    ├── Detail: shop-ledger
    └── Payment: make-payment → payment-success
```

---

## Design System

### Brand Identity — "The Digital Courtyard"

The design language draws from the visual warmth of Indian bazaars — terracotta tones, organic shapes, and the golden hour light of a market square.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#8f4e00` | Deep saffron — CTAs, key actions |
| `primary-container` | `#ff9933` | Bright saffron — gradients, active states |
| `primary-fixed` | `#ffdcc2` | Light saffron — backgrounds, chips |
| `secondary` | `#056e00` | Courtyard green — success, verified |
| `secondary-container` | `#8dfc75` | Light green — badges, highlights |
| `tertiary` | `#006685` | Sky blue — info, admin accents |
| `error` | `#ba1a1a` | Red — errors, overdue |
| `surface` | `#f9f9f9` | Off-white — page background |
| `on-surface` | `#1a1c1c` | Near-black — primary text |

### Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headlines | Plus Jakarta Sans | 700-800 | Section titles, brand, CTAs |
| Body | Inter | 400-600 | Paragraphs, descriptions |
| Labels | Inter | 600 | Buttons, chips, badges |

### Key UI Patterns

1. **Bento Cards** — Rounded cards (12-24px radius) with subtle shadows, used for shop cards, stat cards, order items
2. **Editorial Gradient** — `linear-gradient(135deg, #8f4e00 0%, #ff9933 100%)` for hero sections and primary CTAs
3. **Glass Navigation** — Bottom nav and top bar use `backdrop-blur(20px)` with 80% white opacity
4. **Tonal Layering** — Separation via surface color shifts instead of borders (the "No-Line Rule")
5. **Asymmetric Layouts** — Intentionally off-center elements for visual interest (large stat card next to small action card)
6. **Hinglish Labels** — All UI text in Hindi-English mix (e.g., "Order confirm ho gaya", "Paisa chuka diya")

### Spacing & Scale

- Base unit: 4px
- Card padding: 16-24px
- Section gaps: 32-48px
- Touch targets: minimum 48px
- Border radius: 12px (cards), 24px (nav), 9999px (pills/badges)

---

## Technical Architecture

### Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Markup | Static HTML5 | No build step, works offline |
| Styling | Tailwind CSS (CDN) + shared `styles.css` | Rapid prototyping, consistent tokens |
| Interactivity | Vanilla JS (hash router) | Zero dependencies, fast load |
| Fonts | Google Fonts (Plus Jakarta Sans, Inter, Material Symbols) | Free, high quality |
| Routing | `window.location.hash` | No server needed, works with `file://` |

### File Structure

```
Design/
├── index.html                    # Landing — role selection
├── css/
│   ├── tokens.css                # CSS custom properties (~50 tokens)
│   └── styles.css                # Shared component styles (~300 lines)
├── js/
│   ├── config.js                 # Tailwind theme config
│   ├── router.js                 # Hash-based SPA router (~50 lines)
│   └── components.js             # Shared nav/render helpers
├── screens/
│   ├── customer/app.html         # 12 screens, ~1500 lines
│   ├── vendor/app.html           # 15 screens, ~2400 lines
│   ├── admin/app.html            # 5 screens, ~970 lines
│   └── udhaar/app.html           # 4 screens, ~630 lines
└── JOURNAL.md                    # This file
```

### Routing Mechanism

Each flow file embeds all screens as hidden `<div class="screen" id="...">` elements. The router:

1. Listens to `hashchange` events
2. Hides all `.screen` divs
3. Shows the matching `#screen-id` div
4. Updates bottom nav active state
5. Scrolls to top

```javascript
// Simplified router logic
window.addEventListener('hashchange', function() {
  var id = window.location.hash.slice(1);
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.toggle('active', s.id === id);
  });
});
```

### Code Reduction

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Total files | 37 HTML | 10 files (4 flows + 5 shared + 1 landing) | 73% fewer |
| Tailwind configs | 37 copies | 1 (config.js) | 97% reduction |
| Font imports | 111 | 4 (one per flow) | 96% reduction |
| Material Icons CSS | 37 | 4 | 89% reduction |
| Bottom nav components | 20+ duplicated | Shared pattern | ~95% reduction |
| Total lines | ~15,000+ | ~5,500 | 63% reduction |

---

## Screen Inventory

### Customer Screens (12)

| # | Screen ID | Source | Purpose | Key Actions |
|---|-----------|--------|---------|-------------|
| 1 | `splash` | 1._splash_screen | Brand intro | → login |
| 2 | `login` | 2._login_phone | Phone auth | → otp |
| 3 | `otp` | 3._otp_verification | OTP verify | → home |
| 4 | `home` | 4._home_discovery | Discovery feed | → shop-products, cart |
| 5 | `shop-products` | 6._shop_page_products | Shop catalog | → cart, shop-chat |
| 6 | `shop-chat` | 6._shop_page_chat | Shop chat | — |
| 7 | `cart` | 8._cart_screen | Cart | → order-confirm |
| 8 | `order-confirm` | 9._order_confirmation | Success | → order-status, home |
| 9 | `order-status` | 10._order_status | Order tracking | — |
| 10 | `order-history` | 11._order_history | Past orders | — |
| 11 | `profile` | 12._customer_profile_settings | Account | → order-history |
| 12 | `notifications` | 19._notifications_system | Updates | → order-history |

### Vendor Screens (15)

| # | Screen ID | Source | Purpose | Key Actions |
|---|-----------|--------|---------|-------------|
| 1 | `dashboard` | vendor_dashboard | Home | → inventory, orders, chat-list, add-product |
| 2 | `stats` | vendor_stats_overview | Overview stats | — |
| 3 | `inventory` | 13.1_vendor_inventory_management | Stock management | → add-product |
| 4 | `add-product` | 16._add_product_vendor | New product | — |
| 5 | `orders` | 17._vendor_orders_management | Order management | — |
| 6 | `chat-list` | 14._vendor_chat_list | Conversations | → chat |
| 7 | `chat` | 15._vendor_chat_screen | Individual chat | — |
| 8 | `payouts` | merchant_payouts | Payout dashboard | → payout-schedule, link-bank |
| 9 | `payout-schedule` | payout_schedule | Settlement calendar | — |
| 10 | `link-bank` | link_bank_account_form | Bank linking | → bank-success |
| 11 | `bank-success` | bank_account_linked_success | Confirmation | → payouts, dashboard |
| 12 | `edit-profile` | edit_vendor_profile | Shop profile | — |
| 13 | `performance` | merchant_performance_detail_view | Performance detail | → yearly-report |
| 14 | `yearly-report` | merchant_performance_with_yearly_report | Annual report | — |
| 15 | `reports` | business_reports_download | Download reports | — |

### Admin Screens (5)

| # | Screen ID | Source | Purpose | Key Actions |
|---|-----------|--------|---------|-------------|
| 1 | `overview` | 18._admin_panel_overview | Dashboard | → shops, orders |
| 2 | `shops` | 18.1_admin_shops_management | Shop management | — |
| 3 | `orders` | 18.2_admin_all_orders_list | All orders | — |
| 4 | `settings` | admin_settings | Configuration | → settings-reports |
| 5 | `settings-reports` | admin_settings_with_reports | Reports | — |

### Udhaar Khata Screens (4)

| # | Screen ID | Source | Purpose | Key Actions |
|---|-----------|--------|---------|-------------|
| 1 | `ledger` | 20._udhaar_khata_digital_ledger | Shop list | → shop-ledger, make-payment |
| 2 | `shop-ledger` | 20.1_shop_wise_detailed_ledger | Transaction history | → make-payment |
| 3 | `make-payment` | 20.2_make_payment | Payment flow | → payment-success |
| 4 | `payment-success` | 20.3_payment_success | Confirmation | → ledger |

---

## Navigation Flows

### Bottom Navigation by Role

| Role | Tab 1 | Tab 2 | Tab 3 | Tab 4 |
|------|-------|-------|-------|-------|
| Customer | Discovery `#home` | Orders `#order-history` | Chat `#shop-chat` | Profile `#profile` |
| Vendor | Home `#dashboard` | Orders `#orders` | Stats `#stats` | Chats `#chat-list` |
| Admin | Overview `#overview` | Shops `#shops` | Orders `#orders` | Settings `#settings` |
| Udhaar | Home `#home` | Udhaar `#ledger` | Orders `#order-history` | Profile `#profile` |

### Cross-Flow Navigation

- Customer profile "Udhaar Khata" link → opens udhaar flow
- All flows return to `index.html` via the back button on the first screen (conceptually — currently navigates within flow)

---

## UX Design Decisions

### 1. Hinglish UI Language

All copy is in Hindi-English mix to match the target audience's daily communication style. Examples:
- "Order confirm ho gaya" instead of "Order Confirmed"
- "Paisa chuka diya" instead of "Payment Successful"
- "Dukaan Khuli Hai" instead of "Shop Open"

**Rationale:** Creates emotional connection and reduces cognitive load for users who think in Hindi but operate digital tools in English.

### 2. The Digital Courtyard Metaphor

The design system is named "The Digital Courtyard" — evoking the central chowk/maidan of an Indian market town where all paths converge.

**Visual expression:**
- Warm saffron/terracotta palette (market clay, turmeric, sunset)
- Organic asymmetric layouts (like market stalls of different sizes)
- Tonal layering instead of harsh borders (like dust filtering golden light)

### 3. Glass-morphism Navigation

Bottom nav bars and top app bars use `backdrop-filter: blur(20px)` with semi-transparent white backgrounds.

**Rationale:**
- Feels premium without being heavy
- Maintains context (content visible behind nav)
- Works well on any background color

### 4. Transactional Focus Screens

Screens like order confirmation, payment success, and OTP verification suppress the bottom navigation bar.

**Rationale:** Reduces distraction during critical conversion moments. User should only see the primary CTA.

### 5. Asymmetric Bento Layouts

Dashboard and stat screens use intentionally asymmetric card layouts (large card next to small cards).

**Rationale:**
- Creates visual hierarchy without explicit labels
- Mimics the organic, unplanned feel of a real bazaar
- Guides eye to most important metric first

### 6. Badge System

| Badge | Color | Meaning |
|-------|-------|---------|
| Open | Green bg | Shop is open |
| Closed | Gray bg | Shop is closed |
| New | Saffron bg | New item/order |
| Packed | Light green | Order packed |
| Delivered | Gray | Order delivered |
| Urgent/Overdue | Red bg | Overdue payment |

### 7. Progressive Disclosure

Complex features (inventory management, payout schedule, reports) are hidden behind quick-action cards on the dashboard rather than cluttering the main view.

**Rationale:** Vendor needs quick access to daily tasks (orders, chat) without being overwhelmed by secondary features.

---

## Technical Implementation

### Build Process

None. The project is pure static HTML + CSS + JS. To run:

```bash
# Option 1: Open directly
open index.html

# Option 2: Simple HTTP server (for testing)
npx serve .
# or
python -m http.server 8000
```

### Browser Compatibility

- Chrome/Edge 90+ (primary target — Android WebView)
- Safari 14+ (iOS fallback)
- Firefox 88+
- No IE support

### Performance Characteristics

| Metric | Value |
|--------|-------|
| First paint | <500ms (no build step, CDN resources) |
| Total page weight | ~165KB (vendor, largest flow) |
| External dependencies | 3 (Tailwind CDN, Google Fonts, Material Symbols) |
| JavaScript | ~5KB total (router + components + config) |
| CSS | ~9KB total (tokens + styles) |

### Known Limitations

1. **No persistence** — State resets on page reload (no localStorage/backend)
2. **No real auth** — OTP is pre-filled, no server verification
3. **No real cart** — Cart items are static HTML
4. **No real chat** — Messages are static, no WebSocket
5. **Image CDN dependency** — All product/shop images load from Google-hosted URLs

### Remaining Dead Links (Acceptable)

These `href="#"` links point to features not yet designed:
- Customer profile: "Saved Addresses", "Mera Khata", "Help", "About"
- Login: "Terms & Conditions", "Privacy Policy"

These are placeholders for future screens and are not navigation bugs.

---

## Design Assets Reference

The original 37 screen designs are preserved in their respective folders with `screen.png` files for visual reference:

| Flow | Source Folders |
|------|---------------|
| Customer | `1._splash_screen` through `12._customer_profile_settings`, `19._notifications_system` |
| Vendor | `vendor_dashboard`, `vendor_stats_overview`, `13.1_vendor_inventory_management` through `17._vendor_orders_management`, `merchant_payouts`, `payout_schedule`, `link_bank_account_form`, `bank_account_linked_success`, `edit_vendor_profile`, `merchant_performance_detail_view`, `merchant_performance_with_yearly_report`, `business_reports_download` |
| Admin | `18._admin_panel_overview`, `18.1_admin_shops_management`, `18.2_admin_all_orders_list`, `admin_settings`, `admin_settings_with_reports` |
| Udhaar | `20._udhaar_khata_digital_ledger`, `20.1_shop_wise_detailed_ledger`, `20.2_make_payment`, `20.3_payment_success` |

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-31 | 1.0 | Initial restructure: 37 standalone files → 4 SPA flows with shared assets |
| 2026-03-31 | 1.1 | Hygiene audit: fixed 30 issues (tag mismatches, dead links, nav consistency) |
| 2026-03-31 | 1.2 | Added JOURNAL.md with full technical + UX documentation |
