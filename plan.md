# Chiti Bazaar: Demo to Real App Implementation Plan

## Executive Summary

This plan bridges the gap between the Chiti Bazaar design demo (36 screens, 4 roles) and the current working Next.js + Express application. The demo showcases a polished, Hindi/Hinglish hyperlocal marketplace UI. The real app has functional backend APIs and core screens but is missing several UI screens, visual polish, and specific features demonstrated in the demo.

**Total Estimated Effort: 19–27 days**

---

## 1. Current State Analysis

### 1.1 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14.2 (App Router), React 18, TypeScript 5.4 |
| Styling | Tailwind CSS 3.4, Plus Jakarta Sans (headlines), Inter (body), Material Symbols Outlined (icons) |
| Real-time | Socket.IO Client 4.8 |
| Backend | Express 4.18, Prisma 5.10, SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (30-day expiry), OTP-based (dev: hardcoded 1234) |
| DB Models | User, Shop, Product, Chat, Message, MessageRead, Cart, CartItem, Order, OrderItem, FavoriteShop, Notification, UdharLedger, UdharEntry |

### 1.2 Existing Frontend Routes

| Route | Page | Status |
|-------|------|--------|
| `/` | Root redirect (role-based) | Exists |
| `/login` | Phone OTP login + registration | Exists |
| `/admin` | Admin dashboard | Exists (partial) |
| `/customer` | Customer home — shop discovery | Exists (partial) |
| `/customer/shop/[id]` | Shop detail with products + chat | Exists |
| `/customer/cart` | Shopping cart + checkout | Exists |
| `/customer/orders` | Order history | Exists |
| `/customer/notifications` | Notifications list | Exists |
| `/customer/profile` | User profile + settings | Exists |
| `/vendor` | Vendor dashboard | Exists (partial) |
| `/vendor/products` | Product CRUD management | Exists |
| `/vendor/orders` | Order management | Exists |
| `/vendor/chats` | Chat list | Exists |
| `/vendor/chats/[id]` | Individual chat | Exists |
| `/vendor/udhaar` | Udhaar ledger (vendor-side) | Exists |

### 1.3 Demo App Structure (36 Screens)

**Customer Flow (12 screens):** Splash → Login → OTP → Home Discovery → Shop Products → Shop Chat → Cart → Order Confirm → Order Status → Order History → Profile → Notifications

**Vendor Flow (15 screens):** Dashboard → Stats → Inventory → Add Product → Orders → Chat List → Chat → Payouts → Payout Schedule → Link Bank → Bank Success → Edit Profile → Performance Detail → Yearly Report → Reports

**Admin Flow (5 screens):** Overview → Shops → Orders → Settings → Settings with Reports

**Udhaar Khata Flow (4 screens):** Ledger → Shop Ledger Detail → Make Payment → Payment Success

---

## 2. Gap Analysis

### 2.1 Feature-by-Feature Comparison

| Feature | Demo Has | Real App Has | Gap Level |
|---------|----------|--------------|-----------|
| Splash Screen | Full branded splash with hero image, CTA, progress dots | Missing | **HIGH** |
| Login/OTP | 2 screens (phone + OTP verify) | Exists | ✅ Match |
| Customer Home | Hero greeting, search, category pills, featured banner, shop cards grid, "become vendor" CTA | Partial | **MEDIUM** |
| Shop Detail | Hero image, Products/Chat tabs, product grid with "Add to bag" | Exists | ✅ Match |
| Shop Chat | Quick action chips (Milk, Bread, Atta), product message sharing | Exists | ✅ Match |
| Cart | Item list, quantities, subtotal, checkout | Exists | ✅ Match |
| Order Confirmation | Success screen with order ID, store details, "Track Order" CTA | Missing | **HIGH** |
| Order Status | Stepper (Pending → Accepted → Preparing → Completed) with timestamps | Missing | **HIGH** |
| Order History | Past orders list with repeat order | Exists | ✅ Match |
| Customer Profile | Settings, addresses, logout | Exists | ✅ Match |
| Notifications | Notification feed | Exists | ✅ Match |
| Vendor Dashboard | Stats grid (Today's orders, Pending, Earnings), Quick Actions, Recent Orders, Shop Performance | Partial | **MEDIUM** |
| Vendor Stats | Revenue chart, Customer Smiles rating, Udhaar summary, Top Performers scroll | Missing | **HIGH** |
| Vendor Inventory | Product list with stock toggle, search, add product CTA | Exists | ✅ Match |
| Add Product | Form with image upload, name, price, unit, description | Exists | ✅ Match |
| Vendor Orders | Order management with accept/reject/complete actions | Exists | ✅ Match |
| Vendor Chat List | List of customer conversations | Exists | ✅ Match |
| Vendor Chat | Individual chat with customer | Exists | ✅ Match |
| Vendor Payouts | Payout dashboard, balance, settlement schedule | Missing | **HIGH** |
| Link Bank Account | Bank account linking form + success confirmation | Missing | **HIGH** |
| Edit Profile | Shop profile editing, open/closed toggle | Missing | **MEDIUM** |
| Performance Detail | Performance metrics detail view with progress bars | Missing | **HIGH** |
| Yearly Report | Annual performance report with charts | Missing | **HIGH** |
| Business Reports | Download business reports (PDF/CSV) | Missing | **HIGH** |
| Admin Overview | Stats (Total Orders, Active Shops, Revenue), Revenue chart, Quick Actions | Partial | **MEDIUM** |
| Admin Shops | Shop list with enable/disable toggle, search | Exists | ✅ Match |
| Admin Orders | All orders list with filters | Exists | ✅ Match |
| Admin Settings | Platform configuration, admin profile, security, report generation | Missing | **HIGH** |
| Udhaar Ledger | Shop list with pending balances, summary card | Exists (vendor side) | **MEDIUM** |
| Shop Ledger Detail | Transaction timeline grouped by date per shop | Missing | **HIGH** |
| Make Payment | Payment method selection (UPI, Wallet, Cash), balance display | Missing | **HIGH** |
| Payment Success | Success confirmation with receipt download, transaction details | Missing | **HIGH** |

### 2.2 Missing Routes Summary

| Route | Screen | Role |
|-------|--------|------|
| `/splash` | Splash/Onboarding screen | Public |
| `/customer/orders/[id]/confirm` | Order confirmation | Customer |
| `/customer/orders/[id]` | Order status tracker | Customer |
| `/vendor/stats` | Stats/Analytics dashboard | Vendor |
| `/vendor/payouts` | Payouts dashboard | Vendor |
| `/vendor/payouts/link-bank` | Link bank account | Vendor |
| `/vendor/profile/edit` | Edit shop profile | Vendor |
| `/vendor/performance` | Performance detail | Vendor |
| `/vendor/reports` | Business reports download | Vendor |
| `/vendor/reports/yearly` | Yearly report | Vendor |
| `/vendor/udhaar/[shopId]` | Shop ledger detail | Vendor |
| `/vendor/udhaar/[shopId]/pay` | Make udhaar payment | Vendor |
| `/admin/settings` | Admin settings | Admin |

### 2.3 Missing Backend Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/vendor/stats` | Vendor statistics (revenue, rating, top products) |
| `GET` | `/api/vendor/payouts` | Payout history and balance |
| `POST` | `/api/vendor/payouts/link-bank` | Link bank account |
| `GET` | `/api/vendor/reports` | Generate/download reports |
| `PATCH` | `/api/vendor/profile` | Update shop profile |
| `POST` | `/api/udhaar/:shopId/pay` | Record udhaar payment |
| `GET` | `/api/admin/settings` | Get platform settings |
| `PATCH` | `/api/admin/settings` | Update platform settings |
| `GET` | `/api/orders/:id/status` | Get order status timeline |

### 2.4 Missing Database Models

| Model | Fields | Purpose |
|-------|--------|---------|
| `Payout` | id, vendorId, amount, status (pending/processing/completed), bankAccountId, scheduledDate, completedDate | Track vendor payouts |
| `BankAccount` | id, vendorId, accountNumber, ifsc, bankName, holderName, isPrimary | Store vendor bank details |
| `Report` | id, vendorId, type (daily/weekly/monthly/yearly), period, fileUrl, generatedAt | Track generated reports |
| `PlatformSettings` | id, key, value, updatedAt | Store admin platform config |

---

## 3. Implementation Plan

### Phase 1: Design System Alignment (2–3 days) ✅ DONE

**Goal:** Make the real app's visual foundation exactly match the demo's design tokens and utility classes.

#### 3.1.1 Update `frontend/tailwind.config.ts`

Add missing arbitrary value support and extend the config:

```typescript
// Add to theme.extend:
borderRadius: {
  '3xl': '1.5rem',
  '4xl': '2rem',
},
boxShadow: {
  'editorial': '0 8px 32px rgba(85,67,54,0.04)',
  'editorial-lg': '0 16px 48px rgba(85,67,54,0.08)',
  'saffron': '0 12px 24px rgba(143,78,0,0.2)',
  'saffron-lg': '0 32px 64px rgba(143,78,0,0.15)',
  'bottom-nav': '0 -8px 24px rgba(0,0,0,0.05)',
  'top-bar': '0 32px 0 rgba(85,67,54,0.08)',
},
```

#### 3.1.2 Update `frontend/src/styles/globals.css`

Add the following utility classes that the demo uses extensively:

```css
/* Editorial gradient (saffron) */
.editorial-gradient {
  background: linear-gradient(135deg, #8f4e00, #ff9933);
}

.digital-courtyard-gradient {
  background: linear-gradient(135deg, #8f4e00, #ff9933);
}

.saffron-gradient {
  background: linear-gradient(135deg, #8f4e00, #ff9933);
}

/* Organic shape for decorative elements */
.organic-shape {
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
}

/* OTP input focus */
.otp-input-focus:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(143,78,0,0.3);
}

/* Digital courtyard shadow */
.digital-courtyard-shadow {
  box-shadow: 0 8px 32px rgba(85,67,54,0.04);
}

/* Editorial shadow */
.editorial-shadow {
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}

/* Top bar shadow */
.shadow-top-bar {
  box-shadow: 0 32px 0 rgba(85,67,54,0.08);
}

/* Bottom nav shadow */
.shadow-bottom-nav {
  box-shadow: 0 -8px 24px rgba(0,0,0,0.05);
}

/* No scrollbar */
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar (alias) */
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
```

#### 3.1.3 Unify Layout System

Consolidate `AppShell.tsx` and `Layout.tsx` into a single `AppShell` component that supports:
- **TopBar:** Sticky, `backdrop-blur-xl`, `bg-white/80`, `shadow-[0_32px_0_rgba(85,67,54,0.08)]`
- **BottomNav:** Fixed bottom, `rounded-t-[24px]`, `backdrop-blur-xl`, `bg-white/80`, `shadow-[0_-8px_24px_rgba(0,0,0,0.05)]`, `pb-6 pt-3`
- **FAB:** Fixed `bottom-28 right-6`, gradient background, `rounded-full`, shadow
- **Configurable per role:** Bottom nav items change based on user role

**Files to modify:**
- `frontend/src/components/AppShell.tsx` — Refactor to accept role prop
- `frontend/src/components/BottomNavBar.tsx` — Update styling to match demo exactly
- `frontend/src/components/TopNav.tsx` — Update shadow and backdrop styles
- `frontend/src/components/FloatingActionButton.tsx` — Update positioning and style

#### 3.1.4 Update UI Components

Update `frontend/src/components/ui/` components:
- `Button.tsx` — Add `active:scale-95` and `active:scale-[0.98]` to all variants
- `Card.tsx` — Add `hover:shadow-xl transition-all duration-300`
- `Badge.tsx` — Match demo badge styles (`text-[10px] font-bold uppercase tracking-wider`)

---

### Phase 2: Missing Customer Screens (3–4 days) ✅ DONE

#### 3.2.1 Splash Screen

**File:** `frontend/src/app/splash/page.tsx`

**Demo Reference:** `Design/screens/customer/app.html` lines 14–84

**Features:**
- Full-screen branded splash with hero image (local marketplace photo)
- "Chiti Bazaar" in `font-black text-5xl text-orange-700 italic`
- Tagline: `'Apni local dukaan, ab online'`
- "Aage Badhein" CTA button with `editorial-gradient` background
- Progress dots (3 dots, first one active)
- "Vocal for Local • Made in Bharat" footer
- Decorative background blurs

**Behavior:**
- If user is authenticated → redirect to role-based home
- If not authenticated → redirect to `/login`
- Auto-redirect after 3 seconds OR on CTA click

#### 3.2.2 Order Confirmation Screen

**File:** `frontend/src/app/customer/orders/[id]/confirm/page.tsx`

**Demo Reference:** `Design/screens/customer/app.html` order-confirm section

**Features:**
- Success checkmark icon with animation
- "Order placed!" heading
- Order ID display (e.g., #BS-9021)
- Shop name and items summary
- Estimated delivery/pickup time
- "Track Order" CTA → navigates to order status
- "Continue Shopping" secondary CTA

**Backend Integration:**
- `GET /api/orders/:id` — Fetch order details

#### 3.2.3 Order Status Tracker

**File:** `frontend/src/app/customer/orders/[id]/page.tsx`

**Demo Reference:** `Design/screens/customer/app.html` order-status section

**Features:**
- Horizontal stepper with 4 stages:
  1. **Pending** — Clock icon, "Order received"
  2. **Accepted** — Check icon, "Shop confirmed"
  3. **Preparing** — Local fire dining icon, "Being prepared"
  4. **Completed** — Done icon, "Ready for pickup/delivery"
- Each step shows timestamp when reached
- Active step highlighted with `bg-primary-container`
- Completed steps show `bg-secondary-container`
- Future steps show `bg-surface-container-high` (greyed out)
- Order summary card at bottom

**Backend Integration:**
- `GET /api/orders/:id` — Fetch order with status
- Real-time: Socket.IO `notification` event for status updates

#### 3.2.4 Customer Home Enhancements

**File:** `frontend/src/app/customer/page.tsx` (modify existing)

**Changes to match demo:**

1. **Hero Greeting Section:**
   - `text-4xl font-extrabold` — "Namaste 👋"
   - Subtitle: "Welcome back to your digital courtyard."

2. **Search Bar:**
   - `bg-surface-container-low rounded-xl py-5 pl-12 pr-4`
   - Placeholder: "Kya chahiye? (milk, bread...)"
   - Search button: `bg-primary-container text-on-primary-container px-4 py-2 rounded-lg`

3. **Category Filter Pills:**
   - Horizontal scroll with `no-scrollbar`
   - Active: `bg-orange-700 text-white rounded-full`
   - Inactive: `bg-white border border-outline-variant/30 text-on-surface-variant rounded-full`
   - Categories: Sab, Grocery, Daily use, Vegetables, Fruits, Dairy

4. **Featured Banner:**
   - `h-48 rounded-[2rem] bg-gradient-to-br from-primary to-primary-container`
   - "Local Pride" badge
   - "Support your neighborhood merchants today." heading
   - Background image with `mix-blend-overlay opacity-30`

5. **Shop Cards:**
   - Open/Closed state badges (`bg-secondary/90` for open, `bg-stone-500/90` for closed)
   - Distance display with `distance` icon
   - Delivery time with `schedule` icon
   - Rating badge with filled star
   - Closed shops: `opacity-80`, `grayscale` on image, "Currently Closed" button
   - `group-hover:scale-110 transition-transform duration-500` on images

6. **"Become a Vendor" CTA Section:**
   - `bg-surface-container-low rounded-[2rem] p-10`
   - "Kya aapki apni dukaan hai?" heading
   - "Switch to Vendor" button
   - Decorative image

---

### Phase 3: Missing Vendor Screens (4–5 days) ✅ DONE

#### 3.3.1 Vendor Dashboard Enhancements

**File:** `frontend/src/app/vendor/page.tsx` (modify existing)

**Changes to match demo:**

1. **Greeting Section:**
   - "Namaste, Ramesh ji 👋" (use actual vendor name)
   - "Your store is buzzing with activity today."

2. **Stats Grid (3 columns):**
   - "Aaj ke orders" — Today's order count, `+12%` badge
   - "Pending orders" — Pending count, `Urgent` badge, `border-l-4 border-orange-400`
   - "Aaj ki kamaai" — Today's earnings, `bg-gradient-to-br from-primary to-primary-container text-white`

3. **Quick Actions Bento (2×2 grid):**
   - "Chats dekhein" → `/vendor/chats`
   - "Orders manage" → `/vendor/orders`
   - "Products manage" → `/vendor/products`
   - "Naya Item" → `/vendor/products/add`
   - Each: `w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary shadow-sm`

4. **Recent Orders List:**
   - Order cards with product thumbnail, item name, price, order ID, timestamp, status badge
   - Status badges: "New" (orange), "Packed" (green), "Delivered" (grey)
   - "View All" link

5. **Shop Performance Card:**
   - Customer Rating (4.8 stars)
   - Inventory Health progress bar (92%, green)
   - Delivery Speed progress bar (78%, orange)
   - Insight message: "Ramesh ji, your 'Fast Delivery' badge is attracting 20% more customers!"

6. **Secondary Info Card:**
   - "Grow your sales" — "Start a local ad campaign today."
   - `bg-tertiary-fixed rounded-2xl`

**Backend Integration:**
- `GET /api/orders/vendor/summary` — Today's stats, revenue, top products

#### 3.3.2 Vendor Stats/Analytics Page

**File:** `frontend/src/app/vendor/stats/page.tsx`

**Demo Reference:** `Design/screens/vendor/app.html` stats section (lines 230–401)

**Features:**
1. **Header:** "Analytics Dashboard" badge, "Performance Insights" heading, Weekly/Monthly toggle

2. **Bento Grid Stats:**
   - **Total Revenue Card** (2-col span): `₹1,42,850`, `+12.4% from last month`, CSS bar chart (7 bars for days of week)
   - **Customer Smiles Card**: Circular rating display (4.8), star ratings, "Based on 124 verified reviews"

3. **Udhaar Summary Section:**
   - "Digital Khata Simplified" heading
   - "Manage Ledger" link
   - Pending Udhaar card: `₹12,450`, "8 Customers overdue", `bg-error-container/40`
   - Recovered (MTD) card: `₹8,900`, "15 Settlements today", `bg-secondary-container/20`

4. **Top Performers Section:**
   - Horizontal scroll of product cards
   - Each: product image, "#1 Best Seller" badge, product name, quantity sold, revenue
   - `min-w-[280px] snap-start`

**Backend Integration:**
- `GET /api/vendor/stats` — Revenue, rating, top products, udhaar summary

#### 3.3.3 Vendor Payouts Page

**File:** `frontend/src/app/vendor/payouts/page.tsx`

**Demo Reference:** `Design/screens/vendor/app.html` payouts section

**Features:**
1. **Balance Card:**
   - Available balance amount
   - Pending settlement amount
   - Next settlement date
   - `bg-gradient-to-br from-primary to-primary-container`

2. **Settlement Schedule:**
   - Weekly/monthly schedule display
   - Next payout date countdown

3. **Payout History:**
   - List of past payouts with date, amount, status (Processing/Completed/Failed)
   - Bank account details

4. **Quick Actions:**
   - "Link Bank Account" CTA
   - "View Schedule" link

**Backend Integration:**
- `GET /api/vendor/payouts` — Payout history
- New `Payout` model in Prisma schema

#### 3.3.4 Link Bank Account

**File:** `frontend/src/app/vendor/payouts/link-bank/page.tsx`

**Demo Reference:** `Design/screens/vendor/app.html` link-bank + bank-success sections

**Features:**
1. **Form:**
   - Account Holder Name
   - Account Number (with confirm)
   - IFSC Code
   - Bank Name (auto-filled from IFSC)
   - "Verify & Link" CTA

2. **Success Screen:**
   - Green checkmark animation
   - "Bank account linked successfully!"
   - Account details summary
   - "Back to Payouts" CTA

**Backend Integration:**
- `POST /api/vendor/payouts/link-bank` — Save bank account
- New `BankAccount` model in Prisma schema

#### 3.3.5 Edit Vendor Profile

**File:** `frontend/src/app/vendor/profile/edit/page.tsx`

**Demo Reference:** `Design/screens/vendor/app.html` edit-profile section

**Features:**
1. **Shop Image:** Upload/change shop photo
2. **Shop Name:** Text input
3. **Shop Description:** Textarea
4. **Category:** Dropdown/select
5. **Open/Closed Toggle:** Switch component
6. **Address:** Text input with location picker
7. **Operating Hours:** Start/end time inputs
8. **Save Button:** `editorial-gradient text-white py-4 rounded-xl`

**Backend Integration:**
- `GET /api/shops/vendor/my-shop` — Fetch current shop data
- `PUT /api/shops/:id` — Update shop

#### 3.3.6 Performance Detail Page

**File:** `frontend/src/app/vendor/performance/page.tsx`

**Demo Reference:** `Design/screens/vendor/app.html` performance section

**Features:**
1. **Rating Display:** Large circular rating (4.8) with stars
2. **Metrics Grid:**
   - Inventory Health: progress bar (92%)
   - Delivery Speed: progress bar (78%)
   - Customer Satisfaction: progress bar (95%)
   - Response Time: progress bar (85%)
3. **Monthly Comparison:** Current vs previous month
4. **Tips Section:** "How to improve your rating" cards

**Backend Integration:**
- `GET /api/vendor/stats` — Performance metrics

#### 3.3.7 Yearly Report Page

**File:** `frontend/src/app/vendor/reports/yearly/page.tsx`

**Demo Reference:** `Design/screens/vendor/app.html` yearly-report section

**Features:**
1. **Year Selector:** Dropdown for year selection
2. **Annual Summary Cards:**
   - Total Revenue
   - Total Orders
   - Average Order Value
   - Top Product
3. **Monthly Revenue Chart:** 12-bar CSS chart
4. **Monthly Orders Chart:** 12-bar CSS chart
5. **Download Button:** "Download Annual Report (PDF)"

**Backend Integration:**
- `GET /api/vendor/reports?type=yearly&year=2024` — Yearly data

#### 3.3.8 Business Reports Page

**File:** `frontend/src/app/vendor/reports/page.tsx`

**Demo Reference:** `Design/screens/vendor/app.html` reports section

**Features:**
1. **Report Types:**
   - Daily Sales Report
   - Weekly Summary
   - Monthly Analytics
   - Annual Report
2. **Date Range Picker:** Start/end date
3. **Download Buttons:** PDF and CSV options
4. **Generated Reports List:** Previously generated reports with download links

**Backend Integration:**
- `GET /api/vendor/reports` — List/download reports
- New `Report` model in Prisma schema

---

### Phase 4: Missing Admin Screens (2–3 days) ✅ DONE

#### 3.4.1 Admin Settings Page

**File:** `frontend/src/app/admin/settings/page.tsx`

**Demo Reference:** `Design/screens/admin/app.html` settings section

**Features:**
1. **Admin Profile Header:**
   - Profile photo, name, role ("Super Admin")
   - "Apni local dukaan, ab online" tagline
   - Verified badge

2. **Settings Categories (Bento Grid):**
   - **Mera Profile:** Personal info, email, notifications
   - **Platform Settings:** System-wide toggles (signup open/closed, maintenance mode)
   - **Security:** 2FA, password change, session management
   - **Reports:** Platform-wide report generation
   - **Notifications:** Push notification config
   - **Help & Support:** FAQ, contact

3. **Desktop Side Navigation:**
   - Vertical nav on left side (desktop only)
   - Icons: Dashboard, Shops, Orders, Insights, Settings
   - Active state: `bg-primary-container rounded-2xl shadow-lg`

**Backend Integration:**
- `GET /api/admin/settings` — Fetch platform settings
- `PATCH /api/admin/settings` — Update settings
- New `PlatformSettings` model in Prisma schema

#### 3.4.2 Admin Overview Enhancements

**File:** `frontend/src/app/admin/page.tsx` (modify existing)

**Changes to match demo:**

1. **Welcome Hero Section:**
   - "Namaste, Admin. Everything is flowing well."
   - Asymmetric editorial layout with decorative image

2. **Stats Bento Grid (3 columns):**
   - Total Orders: `1,842`, `+12.5%` trend badge, `border-l-4 border-primary`
   - Active Dukaan: `156`, "Live" badge with pulse dot, `border-l-4 border-secondary`
   - Aaj Ka Revenue: `₹42,890`, "Real-time" badge, `bg-primary-container`

3. **Revenue Growth Chart:**
   - CSS bar chart with 7 bars (Mon–Sun)
   - Bars get progressively darker orange
   - Saturday bar: tallest with `shadow-lg shadow-orange-500/20`
   - Daily/Weekly toggle buttons

4. **Quick Actions:**
   - "Shops enable/disable" → `/admin/shops`
   - "View All Orders" → `/admin/orders`

5. **Merchant Highlight Card:**
   - Dark card (`bg-zinc-900 text-white`)
   - Insight text about top merchant
   - "Review Merchant" CTA

6. **Desktop Side Navigation:**
   - Fixed left sidebar (desktop only)
   - Icon-only navigation
   - Active state with `bg-primary-container`

---

### Phase 5: Missing Udhaar Screens (2–3 days) ✅ DONE

#### 3.5.1 Shop Ledger Detail Page

**File:** `frontend/src/app/vendor/udhaar/[shopId]/page.tsx`

**Demo Reference:** `Design/screens/udhaar/app.html` shop-ledger section (lines 205–349)

**Features:**
1. **Hero Balance Card:**
   - "Kul Baaki (Balance)" label
   - Large balance amount (₹450)
   - "Pending: Sharma ji ka Khata" badge
   - Last payment info (₹200 • 15 Oct)
   - `bg-gradient-to-br from-primary to-primary-container rounded-[2rem]`

2. **Search & Filter:**
   - Search input: "Samaan ya date dhundhein..."
   - Filter button

3. **Transaction Timeline:**
   - Grouped by date with horizontal line dividers
   - Date headers: "18 October, 2023" with `tracking-[0.2em]`
   - Transaction cards:
     - **Credit (Udhaar):** Orange icon, `+₹120`, "Udhaar (Purchase)"
     - **Payment (Chukaya):** Green icon, `-₹200`, "Chukaya (Payment)"
     - Balance after each transaction

4. **Bottom Action Bar:**
   - "Statement" download button
   - "Paisa Chukayein" primary CTA → `/vendor/udhaar/[shopId]/pay`
   - Floating rounded bar: `bg-white/80 backdrop-blur-xl rounded-[2.5rem]`

**Backend Integration:**
- `GET /api/udhaar/:shopId` — Get ledger with entries

#### 3.5.2 Make Payment Page

**File:** `frontend/src/app/vendor/udhaar/[shopId]/pay/page.tsx`

**Demo Reference:** `Design/screens/udhaar/app.html` make-payment section (lines 351–508)

**Features:**
1. **Balance Card:**
   - "Payable Balance" label
   - Large amount (₹450)
   - Previous udhaar and last transaction info
   - `editorial-gradient` background

2. **Payment Methods:**
   - **UPI Transfer** (default selected, `border-2 border-primary-container`):
     - GPay, PhonePe, Paytm logos
     - `radio_button_checked` icon
   - **Chiti Bazaar Wallet:**
     - Balance display (₹1,240)
     - `radio_button_unchecked` icon
   - **Cash at Shop:**
     - "Record cash payment manually"
     - `radio_button_unchecked` icon

3. **Trust Badges:**
   - "Bank-Grade Encryption" with shield icon
   - Security icons row

4. **Payment CTA:**
   - "Paisa Chukayein" with arrow icon
   - `editorial-gradient` background

**Backend Integration:**
- `POST /api/udhaar/:shopId/pay` — Record payment
- New endpoint needed

#### 3.5.3 Payment Success Page

**File:** `frontend/src/app/vendor/udhaar/[shopId]/pay/success/page.tsx`

**Demo Reference:** `Design/screens/udhaar/app.html` payment-success section (lines 510–624)

**Features:**
1. **Success Hero:**
   - Large green checkmark with `bg-primary-container`
   - Decorative sparkles (celebration, stars icons)
   - "Paisa chuka diya!" heading

2. **Transaction Details Card:**
   - Total amount paid (₹450.00)
   - Merchant info with verified badge
   - Payment ID (e.g., BSTU-992834710)
   - Timestamp
   - Method (Bazaar Wallet)
   - Status badge ("Settled")

3. **Action Buttons:**
   - "Receipt Download Karein" — primary gradient
   - "Udhaar Khata Dekhein" — secondary

4. **Success Toast:**
   - "Payment message sent to Sharma Ji"
   - Dark background with close button

---

### Phase 6: Backend Enhancements (3–4 days)

#### 3.6.1 New Database Models

Add to `backend/prisma/schema.prisma`:

```prisma
model Payout {
  id            String   @id @default(cuid())
  vendorId      String
  vendor        User     @relation(fields: [vendorId], references: [id])
  amount        Float
  status        String   @default("pending") // pending, processing, completed, failed
  bankAccountId String?
  bankAccount   BankAccount? @relation(fields: [bankAccountId], references: [id])
  scheduledDate DateTime
  completedDate DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model BankAccount {
  id            String   @id @default(cuid())
  vendorId      String
  vendor        User     @relation(fields: [vendorId], references: [id])
  accountNumber String
  ifsc          String
  bankName      String
  holderName    String
  isPrimary     Boolean  @default(false)
  payouts       Payout[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([vendorId, accountNumber])
}

model Report {
  id         String   @id @default(cuid())
  vendorId   String
  vendor     User     @relation(fields: [vendorId], references: [id])
  type       String   // daily, weekly, monthly, yearly
  period     String   // e.g., "2024-01", "2024-W03", "2024"
  fileUrl    String?
  generatedAt DateTime @default(now())
}

model PlatformSettings {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}
```

Update `User` model to add relations:
```prisma
payouts      Payout[]
bankAccounts BankAccount[]
reports      Report[]
```

#### 3.6.2 New API Routes

**File:** `backend/src/routes/vendor.ts` (extend existing)

```typescript
// Vendor Stats
GET /api/vendor/stats
Response: {
  todayOrders: number,
  pendingOrders: number,
  todayRevenue: number,
  totalRevenue: number,
  rating: number,
  ratingCount: number,
  inventoryHealth: number,
  deliverySpeed: number,
  topProducts: Array<{name, quantitySold, revenue}>,
  udhaarPending: number,
  udhaarRecovered: number
}

// Payouts
GET /api/vendor/payouts
Response: {
  availableBalance: number,
  pendingSettlement: number,
  nextSettlementDate: string,
  payouts: Payout[]
}

// Link Bank Account
POST /api/vendor/payouts/link-bank
Body: { accountNumber, ifsc, bankName, holderName }
Response: BankAccount

// Reports
GET /api/vendor/reports?type=daily|weekly|monthly|yearly&period=2024-01
Response: Report data or file download

// Update Profile
PATCH /api/vendor/profile
Body: { name, description, categoryId, isOpen, address, operatingHours }
Response: Shop
```

**File:** `backend/src/routes/udhaar.ts` (extend existing)

```typescript
// Record Payment
POST /api/udhaar/:shopId/pay
Body: { amount, method: "upi" | "wallet" | "cash" }
Response: { success, paymentId, newBalance }
```

**File:** `backend/src/routes/admin.ts` (extend existing)

```typescript
// Get Settings
GET /api/admin/settings
Response: { signupOpen, maintenanceMode, ... }

// Update Settings
PATCH /api/admin/settings
Body: { key, value }
Response: PlatformSettings
```

#### 3.6.3 Run Prisma Migration

```bash
cd backend
npx prisma migrate dev --name add-payouts-bank-reports-settings
npx prisma generate
```

---

### Phase 7: Navigation & Routing (1–2 days) ✅ DONE

#### 3.7.1 Update Bottom Nav Items

Update `frontend/src/components/BottomNavBar.tsx` to match demo exactly:

**Customer Nav:**
```typescript
[
  { icon: 'home', label: 'Discovery', href: '/customer', fill: true },
  { icon: 'shopping_bag', label: 'Orders', href: '/customer/orders' },
  { icon: 'chat', label: 'Chat', href: '/customer/shop/[id]/chat' }, // or dedicated chat list
  { icon: 'person', label: 'Profile', href: '/customer/profile' },
]
```

**Vendor Nav:**
```typescript
[
  { icon: 'dashboard', label: 'Home', href: '/vendor', fill: true },
  { icon: 'package_2', label: 'Orders', href: '/vendor/orders' },
  { icon: 'analytics', label: 'Stats', href: '/vendor/stats' },
  { icon: 'chat_bubble', label: 'Chats', href: '/vendor/chats' },
]
```

**Admin Nav:**
```typescript
[
  { icon: 'dashboard', label: 'Overview', href: '/admin', fill: true },
  { icon: 'storefront', label: 'Shops', href: '/admin/shops' },
  { icon: 'receipt_long', label: 'Orders', href: '/admin/orders' },
  { icon: 'settings', label: 'Settings', href: '/admin/settings' },
]
```

**Styling:**
- Active tab: `bg-orange-100 text-orange-800 rounded-2xl px-5 py-2`
- Inactive tab: `text-stone-500 px-5 py-2`
- Icons: `material-symbols-outlined` with optional `FILL 1` for active
- Labels: `font-inter text-[11px] font-medium tracking-wide`

#### 3.7.2 Role-Based Landing Page

Update `frontend/src/app/page.tsx` to show role selection cards (matching demo's `Design/index.html`):
- If authenticated → redirect to role home
- If not authenticated → show splash or login

#### 3.7.3 Add Desktop Side Navigation for Admin

**File:** `frontend/src/components/AdminSideNav.tsx`

```typescript
// Fixed left sidebar, desktop only (hidden md:flex)
// w-20, fixed left-0 top-0 h-full
// Vertical icon-only navigation
// Active: bg-primary-container rounded-2xl shadow-lg
// Inactive: text-on-surface-variant hover:bg-orange-50
```

#### 3.7.4 Update App Layout

Update `frontend/src/app/layout.tsx` to:
- Wrap authenticated routes in `AppShell` with role-based nav
- Splash and login screens use minimal layout (no bottom nav)

---

### Phase 8: Polish & Micro-interactions (2–3 days) ✅ DONE

#### 3.8.1 Active Scale on Tap

Add `active:scale-95` or `active:scale-[0.98]` to:
- All buttons
- All cards
- All navigation items
- All interactive elements

#### 3.8.2 Hover Effects

- Shop cards: `hover:shadow-xl transition-all duration-300`
- Product cards: `hover:border-primary/10 transition-all`
- Order cards: `hover:shadow-md transition-shadow`
- Nav items: `hover:text-orange-600 transition-colors`
- Images: `group-hover:scale-110 transition-transform duration-500`

#### 3.8.3 Loading States

Create shimmer skeletons matching demo card layouts:
- `ShopCardSkeleton` — matches shop card dimensions
- `ProductCardSkeleton` — matches product card dimensions
- `OrderCardSkeleton` — matches order card dimensions
- `ChatSkeleton` — matches chat message layout
- `StatsSkeleton` — matches stats grid layout

#### 3.8.4 Empty States

Create illustrated empty states with Hindi/Hinglish messages:
- No shops: "Abhi koi dukaan available nahi hai"
- No orders: "Aapne abhi tak koi order nahi diya"
- No cart: "Cart khali hai"
- No notifications: "Koi nayi soochana nahi"
- No chats: "Abhi koi chat nahi hai"

#### 3.8.5 Hindi/Hinglish Labels

Ensure all UI labels match demo's Hindi/Hinglish style:
- "Namaste" greeting
- "Kya chahiye?" search placeholder
- "Aaj ke orders" stats label
- "Paisa chukayein" payment CTA
- "Sab" category filter
- "Band Hai" closed status
- "Stock mein hai" / "Khatam ho gaya" stock status
- "Details dekhein" action button
- "Naya Item Jodein" add product CTA

#### 3.8.6 Transitions & Animations

- Page transitions: `animate-fade-in`
- Card entrance: `animate-slide-up`
- Modal/overlay: `animate-fade-in`
- Button press: `active:scale-95 transition-transform duration-200`
- Bottom nav slide: `transition-all duration-300 ease-out`
- Image hover: `group-hover:scale-110 transition-transform duration-500`

---

## 4. Implementation Priority

| Priority | Phase | Tasks | Effort |
|----------|-------|-------|--------|
| **P0** | Phase 1: Design System ✅ | Tailwind config, CSS utilities, layout unification, UI component updates | Done |
| **P0** | Phase 2: Customer Screens ✅ | Splash, order confirm, order status, home enhancements | Done |
| **P1** | Phase 3: Vendor Screens ✅ | Dashboard, stats, payouts, bank link, edit profile, performance, reports | Done |
| **P1** | Phase 6: Backend | New models, new endpoints, Prisma migration | 3–4 days |
| **P2** | Phase 4: Admin Screens ✅ | Settings page, overview enhancements, side nav | Done |
| **P2** | Phase 5: Udhaar Screens ✅ | Shop ledger, make payment, payment success | Done |
| **P3** | Phase 7: Navigation ✅ | Bottom nav update, role landing, side nav, layout update | Done |
| **P3** | Phase 8: Polish ✅ | Micro-interactions, loading states, empty states, Hindi labels, animations | Done |

---

## 5. Key Technical Decisions

1. **No new frontend dependencies** — Existing Next.js, Tailwind, Socket.IO stack covers all requirements
2. **CSS-only charts** — Use pure CSS bar charts as in the demo (no chart.js/recharts needed)
3. **Image upload** — Backend already supports base64 upload via `POST /api/upload`
4. **PWA** — Existing `manifest.json` needs icon files added to `public/`
5. **Reuse existing components** — `ShopCard`, `ProductCard`, `OrderCard`, `ChatInterface`, `BottomNavBar` already exist; they need UI alignment only
6. **State management** — Continue with local `useState` + `useEffect`; no Redux/Zustand needed
7. **Form handling** — Continue with manual `useState`; no react-hook-form needed
8. **Auth** — Continue with JWT + localStorage; no NextAuth needed

---

## 6. File Structure After Implementation

```
frontend/src/
├── app/
│   ├── layout.tsx                          (modify — wrap in AppShell)
│   ├── page.tsx                            (modify — role selection or redirect)
│   ├── splash/page.tsx                     (NEW)
│   ├── login/page.tsx                      (existing)
│   ├── admin/
│   │   ├── page.tsx                        (modify — enhanced overview)
│   │   ├── shops/page.tsx                  (existing)
│   │   ├── orders/page.tsx                 (existing)
│   │   └── settings/page.tsx              (NEW)
│   ├── customer/
│   │   ├── page.tsx                        (modify — enhanced home)
│   │   ├── shop/[id]/page.tsx             (existing)
│   │   ├── cart/page.tsx                   (existing)
│   │   ├── orders/
│   │   │   ├── page.tsx                    (existing)
│   │   │   └── [id]/
│   │   │       ├── page.tsx               (NEW — order status)
│   │   │       └── confirm/page.tsx       (NEW — order confirmation)
│   │   ├── notifications/page.tsx         (existing)
│   │   └── profile/page.tsx               (existing)
│   └── vendor/
│       ├── page.tsx                        (modify — enhanced dashboard)
│       ├── stats/page.tsx                 (NEW)
│       ├── products/page.tsx              (existing)
│       ├── orders/page.tsx                (existing)
│       ├── chats/
│       │   ├── page.tsx                   (existing)
│       │   └── [id]/page.tsx             (existing)
│       ├── payouts/
│       │   ├── page.tsx                   (NEW)
│       │   └── link-bank/page.tsx        (NEW)
│       ├── profile/edit/page.tsx         (NEW)
│       ├── performance/page.tsx          (NEW)
│       ├── reports/
│       │   ├── page.tsx                   (NEW)
│       │   └── yearly/page.tsx           (NEW)
│       └── udhaar/
│           ├── page.tsx                   (existing)
│           └── [shopId]/
│               ├── page.tsx              (NEW — shop ledger detail)
│               └── pay/
│                   ├── page.tsx          (NEW — make payment)
│                   └── success/page.tsx  (NEW — payment success)
├── components/
│   ├── AppShell.tsx                       (modify — unified layout)
│   ├── BottomNavBar.tsx                   (modify — match demo styling)
│   ├── TopNav.tsx                         (modify — match demo styling)
│   ├── FloatingActionButton.tsx          (modify — match demo positioning)
│   ├── AdminSideNav.tsx                  (NEW)
│   ├── SplashContent.tsx                 (NEW)
│   ├── OrderStepper.tsx                  (NEW)
│   ├── PaymentMethodSelector.tsx         (NEW)
│   ├── StatsCard.tsx                     (NEW)
│   ├── RevenueChart.tsx                  (NEW — CSS bar chart)
│   ├── RatingCircle.tsx                  (NEW)
│   ├── TopPerformerCard.tsx              (NEW)
│   ├── PayoutCard.tsx                    (NEW)
│   ├── TransactionTimeline.tsx           (NEW)
│   ├── EmptyState.tsx                    (modify — add Hindi messages)
│   └── ui/                              (existing — minor style updates)
├── styles/
│   └── globals.css                       (modify — add utility classes)
└── types/
    └── index.ts                          (modify — add new types)

backend/src/
├── routes/
│   ├── vendor.ts                         (modify — add stats, payouts, reports)
│   ├── admin.ts                          (modify — add settings)
│   ├── udhaar.ts                         (modify — add payment)
│   └── orders.ts                         (modify — add status timeline)
├── middleware/
│   └── auth.ts                           (existing)
└── validators/
    └── index.ts                          (modify — add new schemas)

backend/prisma/
└── schema.prisma                         (modify — add Payout, BankAccount, Report, PlatformSettings)
```

---

## 7. Testing Strategy

1. **Visual regression** — Compare each screen against demo screenshots in `Design/*/screen.png`
2. **API testing** — Verify all new endpoints return correct data
3. **Integration testing** — Test full flows (e.g., order placement → status tracking → completion)
4. **Responsive testing** — Ensure mobile-first layout matches demo on 375px, 414px, 768px, 1024px widths
5. **Real-time testing** — Verify Socket.IO events update UI correctly (order status, chat messages, notifications)

---

## 8. Success Criteria

- [ ] All 36 demo screens have corresponding real app screens
- [ ] Visual design matches demo (colors, typography, spacing, shadows, animations)
- [ ] All bottom navigation items match demo per role
- [ ] Hindi/Hinglish labels used throughout
- [ ] All backend endpoints functional and returning correct data
- [ ] Real-time updates working (order status, chat, notifications)
- [ ] Responsive design works on mobile (375px) and desktop (1024px+)
- [ ] Loading states and empty states implemented
- [ ] Active/hover micro-interactions on all interactive elements
