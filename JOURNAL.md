# Chiti Bazaar Development Journal

## Project: Chiti Bazaar — "Bridge between local shops and customers"

A hyperlocal multi-vendor grocery commerce platform connecting Indian shopkeepers with nearby customers through chat-first commerce.

---

## 2026-03-28 — MVP Build Session

### Objective
Design and build a production-ready MVP for Chiti Bazaar from scratch.

### What Was Built

#### 1. Project Structure
```
Chiti Bazaar/
├── frontend/          # Next.js 14 + TypeScript + TailwindCSS
├── backend/           # Express + Prisma + SQLite + Socket.io
├── package.json       # Root workspace (concurrently)
└── JOURNAL.md
```

#### 2. Frontend (Next.js 14 App Router)

**Design System**
- Custom Tailwind theme: Primary `#FF6B00` (Deep Saffron), Background `#F9F5F0` (Soft Beige), Success `#22A45D`
- Custom component classes: `btn-primary`, `btn-secondary`, `btn-success`, `card`, `input-field`, badges
- Chat bubble styles for customer/vendor distinction
- Mobile-first, rounded corners, soft shadows

**Pages Built**
| Route | Description |
|---|---|
| `/login` | OTP-based auth (phone → OTP → register) |
| `/customer` | Shop discovery with search |
| `/customer/shop/[id]` | Shop page with Chat/Catalog tabs |
| `/customer/cart` | Cart with quantity controls + order placement |
| `/customer/orders` | Order history with status badges |
| `/customer/profile` | Profile page with logout |
| `/vendor` | Dashboard with stats (today/pending/revenue) |
| `/vendor/products` | Product management (add/toggle availability) |
| `/vendor/chats` | Customer chat list |
| `/vendor/chats/[id]` | Real-time chat with product sharing |
| `/vendor/orders` | Order management with status updates |
| `/admin` | Admin panel (overview/shops/orders tabs) |

**Components**
- `Layout` — App shell with sticky header + bottom nav
- `ShopCard` — Shop listing with rating/status
- `ProductCard` — Full/compact variants with add-to-cart
- `OrderCard` — Order display with vendor action buttons
- `ChatInterface` — Real-time chat with product quick-share (vendor)
- `CartComponent` — Cart items with quantity controls

**Utilities**
- `lib/api.ts` — Typed API client wrapping fetch
- `lib/socket.ts` — Socket.io client singleton
- `hooks/useAuth.ts` — Auth state + OTP/register/logout
- `hooks/useSocket.ts` — Socket connection + chat events

#### 3. Backend (Express + Prisma + SQLite)

**Database Schema (Prisma)**
- `User` — phone, name, role (customer/vendor/admin)
- `Shop` — name, address, rating, isActive
- `Product` — name, price, unit, category, isAvailable
- `Chat` — customer-shop pair with messages
- `Message` — TEXT or PRODUCT type, with JSON productData
- `Cart` + `CartItem` — per-shop cart
- `Order` + `OrderItem` — order with status flow

**API Routes**
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/send-otp` | Send OTP (dev: returns 1234) |
| POST | `/api/auth/verify-otp` | Verify OTP + get token |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/shops` | List active shops |
| GET | `/api/shops/:id` | Get single shop |
| GET | `/api/shops/:id/products` | Get shop products |
| GET | `/api/products/vendor` | Get vendor products |
| POST | `/api/products` | Create product |
| PATCH | `/api/products/:id` | Update product |
| POST | `/api/chats` | Create/get chat |
| GET | `/api/chats/:id` | Get chat with messages |
| GET | `/api/chats/vendor` | Get vendor chats |
| GET | `/api/cart` | Get customer cart |
| GET | `/api/cart/:shopId` | Get cart for shop |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:shopId/items` | Update cart item |
| DELETE | `/api/cart/:shopId/items/:productId` | Remove cart item |
| POST | `/api/orders` | Create order from cart |
| GET | `/api/orders/my` | Get customer orders |
| GET | `/api/orders/vendor` | Get vendor orders |
| PATCH | `/api/orders/:id/status` | Update order status |
| GET | `/api/admin/shops` | Admin: list all shops |
| PATCH | `/api/admin/shops/:id` | Admin: toggle shop |
| GET | `/api/admin/orders` | Admin: all orders |
| GET | `/api/admin/analytics` | Admin: analytics |

**Real-time (Socket.io)**
- `join_chat` / `leave_chat` — Room management
- `send_message` — Text message broadcast
- `send_product_message` — Vendor creates product inline + shares in chat
- `new_message` event — Real-time message delivery
- `chat_updated` event — Notify when new product added

**Auth**
- JWT-based with 30-day expiry
- OTP in dev mode: always `1234`
- Role-based middleware: `authenticateToken`, `requireRole`

#### 4. Seed Data
- Admin: `9999999999`
- Vendor 1 (Ramesh): `9876543210` — Ramesh General Store (8 products)
- Vendor 2 (Suresh): `9876543211` — Suresh Kirana (7 products)
- Customer 1 (Amit): `8888888888`
- Customer 2 (Priya): `7777777777`
- OTP for all: `1234`
- Pre-seeded: 1 chat with messages, 2 orders

### Technical Decisions

1. **SQLite over PostgreSQL** — Simpler for MVP; swap `schema.prisma` datasource for production
2. **Chat-first architecture** — Products can be created inline during chat, not just from catalog
3. **Per-shop cart** — One cart per customer-shop pair; prevents mixing vendors
4. **Product data in messages** — Stored as JSON in `productData` field for PRODUCT type messages
5. **No file uploads** — Images are URL strings; can add S3/cloud storage later
6. **Dev OTP** — Returns `1234` for all users; replace with SMS gateway for production

### Build Status

- **Backend**: TypeScript compiles cleanly, Prisma schema pushed, seed data loaded
- **Frontend**: Next.js builds successfully, all 14 routes compile

### How to Run

```bash
# From root
npm run setup        # Install deps + seed DB
npm run dev          # Start both frontend (3000) and backend (5000)
```

Or separately:
```bash
cd backend && npm run dev    # localhost:5000
cd frontend && npm run dev   # localhost:3000
```

### What's Next

- [ ] Add product image upload (S3/local)
- [ ] Push notifications for new orders/messages
- [ ] Location-based shop sorting
- [ ] Repeat order button
- [ ] Favorite shops
- [ ] Vendor daily summary
- [ ] Migrate SQLite → PostgreSQL for production
- [ ] Add SMS OTP gateway (Twilio/MSG91)
- [ ] Rate limiting and input sanitization
- [ ] PWA manifest for installability

---

*Built by Kilo — 2026-03-28*

---

## 2026-03-29 — Production Upgrade Session

### Objective
Upgrade Chiti Bazaar from MVP to production-ready deployable system. Focus on real-world usability for shopkeepers, customer retention, system reliability, and low-tech friendliness.

### What Was Built

#### 1. Database Schema Upgrade (5 new models)

**New Models:**
- `FavoriteShop` — User-Shop favorite with unique constraint
- `Notification` — In-app notifications with type, title, body, isRead
- `UdharLedger` — Per customer-shop credit ledger with totalDue/totalPaid
- `UdharEntry` — Individual credit/payment entries with type, amount, note
- `MessageRead` — Read receipts for chat messages

**Modified Models:**
- `Message` — Added `isRead` boolean field
- `Shop` — Added lat/lng index for location queries
- `Product` — Added category index, re-added orderItems relation
- `OrderItem` — Added product relation back to Product

#### 2. New Backend Routes (13 new endpoints)

- Favorites: toggle, list, check
- Notifications: list, unread-count, mark-read, mark-single-read
- Udhaar: customer ledger, vendor add entry, vendor list all
- Upload: base64 image upload
- Orders: repeat order, vendor daily summary

**Shops route upgraded:** Location-based sorting with Haversine distance calculation. Returns isFavorite and distance fields.

**Orders route upgraded:** Creates notifications on new order and status changes. Emits socket events for real-time delivery.

#### 3. New Backend Middleware

- Zod schema validation middleware
- Rate limiting: Auth (20/15min), API (100/min), Upload (10/min)
- Global error handler with dev/prod message toggle
- Zod validators for all endpoints

#### 4. Socket.io Upgrades

- `typing` / `user_typing` — Typing indicator
- `stop_typing` / `user_stop_typing` — Stop typing
- `mark_read` / `messages_read` — Read receipts
- `notification` — Real-time notification delivery to user room
- All message sends now create notifications for the other party

#### 5. New Frontend Components (5 new)

- `OrderProgress` — Visual stepper: Placed to Accepted to Preparing to Ready
- `NotificationBell` — Bell icon with unread count badge
- `Skeletons` — Shop, Product, Order, Chat loading skeletons
- `FavoriteButton` — Heart toggle with API call
- `UdharPanel` — Credit ledger display with balance and transactions

#### 6. Frontend Pages Updated/Added

- `/customer` — Favorites section, sort tabs, notification bell, distance indicators
- `/customer/shop/[id]` — Favorite button, typing indicator, read receipts, time grouping
- `/customer/orders` — Active/past grouping, OrderProgress stepper, Repeat Order button
- `/customer/cart` — Order success animation
- `/customer/notifications` — NEW — Notification list with mark-read
- `/vendor` — Real-time new order alert, VendorSummary with top products, Udhaar link
- `/vendor/products` — Category filter tabs, CATEGORIES dropdown
- `/vendor/orders` — OrderProgress stepper, active order count badge
- `/vendor/udhaar` — NEW — Udhaar ledger list with customer balances
- `/admin` — Enhanced analytics: daily trends, user counts, pending/completed split

#### 7. Chat Improvements

- Typing indicator with animated dots
- Read receipts (single check / double check)
- Time-based message grouping (30 min gap threshold)
- Hinglish labels throughout

#### 8. Production Readiness

- PWA manifest (manifest.json)
- PostgreSQL migration template (.env.example)
- Rate limiting on all API routes
- Zod input validation on all mutation endpoints
- Consistent error handling
- Base64 image upload endpoint

#### 9. UI Polish

- Skeleton loaders for all loading states
- Hinglish empty states
- Scrollbar-hide utility
- Order success animation
- Real-time new order alert banner

### Build Status

- Backend: TypeScript compiles cleanly
- Frontend: Next.js builds successfully, 16 routes (up from 14)

### Remaining for Production

- SMS OTP gateway (Twilio/MSG91)
- Cloud image storage (S3/Cloudinary)
- Push notifications (FCM/Web Push)
- PostgreSQL migration
- Monitoring (Sentry)
- WhatsApp-style vendor summary

---

*Production upgrade by Kilo — 2026-03-29*

---

## 2026-03-30 — UI/UX Migration & Animation System

### Objective
Migrate the entire frontend from the fragmented MVP theme to the unified Material Design 3 token system from the Design HTML files. Rebuild all active pages to match the design mockups. Implement a production-grade animation and responsive system.

### What Was Built

#### 1. Tailwind Theme Unification (Phase 1)

**`tailwind.config.ts` — Complete Rewrite**
- Replaced 9-color MVP palette (primary `#FF6B00`, `soft-beige`, `dark-slate`) with 45+ Material Design 3 color tokens from design HTML files
- Primary color: `#FF6B00` → `#8f4e00` (brown-orange saffron)
- Font families: Added `headline` (Plus Jakarta Sans), `body`/`label` (Inter)
- Border radius aligned to design: `DEFAULT: 0.25rem`, `xl: 0.75rem`
- Added `darkMode: 'class'` support
- Plugins: `@tailwindcss/forms`, `@tailwindcss/container-queries`

**`globals.css` — Font Loading & Base Styles**
- Loads Plus Jakarta Sans (400-800), Inter (400-600), Material Symbols Outlined via Google Fonts
- CSS custom properties aligned to MD3 token values
- Heading elements auto-apply Plus Jakarta Sans
- Material Symbols `font-variation-settings` configured
- Component classes updated to use new token names

**`layout.tsx`**
- Theme color: `#FF6B00` → `#8f4e00`
- Body: `bg-soft-beige` → `bg-surface text-on-surface`

#### 2. UI Kit — Atomic Design Components

Created `src/components/ui/` with 5 atomic components:

| Component | File | Purpose |
|---|---|---|
| `Icon` | `ui/Icon.tsx` | Material Symbols wrapper (`name`, `filled`, `size`) |
| `Button` | `ui/Button.tsx` | 5 variants (`primary`/`secondary`/`success`/`ghost`/`surface`), 3 sizes |
| `Badge` | `ui/Badge.tsx` | Status pills (`success`/`warning`/`error`/`info`) |
| `Input` | `ui/Input.tsx` | Text input with `icon` and `rightElement` slots |
| `Card` | `ui/Card.tsx` | Surface container with hover shadow transition |

#### 3. Structural Components (from Design)

Created 9 new structural components mapped from `4._home_discovery/code.html`:

| Component | Design Section | Description |
|---|---|---|
| `TopNav` | Header (L95-112) | Brand logo, menu button, notification bell with badge |
| `HeroGreeting` | Hero (L115-118) | "Namaste" greeting with dynamic name |
| `SearchBar` | Search (L120-130) | Icon + input + search button |
| `CategoryFilter` | Categories (L132-141) | Horizontal scrollable filter chips |
| `ShopCard` | Shop cards (L166-245) | Image, rating, distance, open/closed states |
| `BottomNavBar` | Bottom nav (L271-294) | 4-tab navigation with Material Icons + active state |
| `FloatingActionButton` | FAB (L296-298) | Cart button with count badge |
| `VendorCTA` | Promo (L257-268) | Vendor signup CTA section |
| `EmptyState` | Empty (L248-254) | Icon + title + description |
| `AppShell` | Base layout | Composes TopNav + main + BottomNavBar + FAB |

#### 4. Page Migrations (All Active Pages)

Every page rebuilt to match corresponding Design HTML:

| Page | Design Reference | Key Changes |
|---|---|---|
| `login/page.tsx` | `2._login_phone` | Centered brand layout, hero image, +91 phone input, gradient CTA, role selection with Material Icons |
| `customer/page.tsx` | `4._home_discovery` | Full rebuild with HeroGreeting, SearchBar, CategoryFilter, ShopCard grid, VendorCTA, EmptyState |
| `customer/cart/page.tsx` | `8._cart_screen` | Fixed header, store identity card, grid cart items, bill summary, fixed checkout bar with gradient CTA |
| `customer/orders/page.tsx` | `11._order_history` | Filter chips, order cards with status badges, gradient repeat button, footer tagline |
| `customer/profile/page.tsx` | `12._customer_profile_settings` | Hero profile section, tonal-separated menu items, brand promise, styled logout |
| `customer/shop/[id]/page.tsx` | `6._shop_page_products` | Shop header with verified badge, hero image, Products/Chat tabs, product grid with gradient buttons |
| `vendor/page.tsx` | `vendor_dashboard` | Stats grid (orders/pending/earnings), quick actions bento, recent orders, shop performance card |
| `vendor/udhaar/page.tsx` | `20._udhaar_khata` | Gradient summary card, ledger cards with color-coded borders, trust badge section |
| `admin/page.tsx` | `18._admin_panel` | Desktop side nav, stats bento, revenue bar chart, quick actions, dark merchant highlight card |

#### 5. Animation & Transition System

**`tailwind.config.ts` — Custom Animations**
Added 6 custom animations with optimized easing:
- `slide-up` / `slide-down` — `cubic-bezier(0.16, 1, 0.3, 1)` spring entrance
- `fade-in` — simple opacity entrance
- `shimmer` — gradient skeleton loading
- `pulse-ring` — notification badge pulse
- `spin-slow` — decorative rotation

**Performance Optimizations**
- Replaced `transition-all` (38 instances) with specific property lists (`transition-[opacity,transform]`, `transition-[background-color,box-shadow,transform]`) across all components
- Added `will-change: transform` to `FloatingActionButton`, `ShopCard` images
- `transition-shadow` only on `Card` (shadow-only changes)
- Shimmer effect replaces `animate-pulse` in `Skeletons.tsx`

**Accessibility**
- `prefers-reduced-motion` media query disables all animations/transitions
- Affects: `animate-pulse`, `animate-spin`, `animate-bounce`, custom keyframes, all transitions

#### 6. Responsive System

**dvh Units**
- `body` uses `min-height: 100dvh` (with `100svh` fallback) in `globals.css` and `layout.tsx`
- Handles mobile browser chrome show/hide without layout jumps
- `.dvh-full` and `.dvh-min` utility classes added

**Container Queries**
- `@tailwindcss/container-queries` plugin activated
- `ShopCard.tsx` uses `@container` with `@md:text-sm`, `@lg:text-xl` for component-level responsive typography

**iOS Scroll Performance**
- `.scrollbar-hide` now includes `-webkit-overflow-scrolling: touch` for momentum scrolling

**Backdrop Blur Optimization**
- Mobile: `backdrop-blur-sm` (4px) on TopNav and BottomNavBar
- Desktop: `backdrop-blur-md` via `md:backdrop-blur-md`
- Higher base opacity (`bg-white/90`) compensates for reduced blur

**Safe Area**
- CSS variables `--safe-bottom`, `--safe-top` exposed
- `.safe-top` utility class added

#### 7. Bug Fixes

- Fixed pre-existing TypeScript error in `vendor/products/page.tsx:59` (`...new Set()` → `...Array.from(new Set())`)

### Build Status

- All 16 routes compile successfully
- TypeScript type checking passes
- Static pages generate correctly
- No new warnings or errors

### File Inventory (Changed/Added)

```
frontend/tailwind.config.ts              — Rewritten (theme + animations)
frontend/src/styles/globals.css          — Rewritten (fonts + performance CSS)
frontend/src/app/layout.tsx              — Updated (theme-color, dvh)
frontend/src/components/ui/Icon.tsx      — NEW
frontend/src/components/ui/Button.tsx    — NEW
frontend/src/components/ui/Badge.tsx     — NEW
frontend/src/components/ui/Input.tsx     — NEW
frontend/src/components/ui/Card.tsx      — NEW
frontend/src/components/ui/index.ts      — NEW (barrel export)
frontend/src/components/TopNav.tsx       — NEW
frontend/src/components/HeroGreeting.tsx — NEW
frontend/src/components/SearchBar.tsx    — NEW
frontend/src/components/CategoryFilter.tsx — NEW
frontend/src/components/ShopCard.tsx     — Rewritten
frontend/src/components/BottomNavBar.tsx — NEW
frontend/src/components/FloatingActionButton.tsx — NEW
frontend/src/components/VendorCTA.tsx    — NEW
frontend/src/components/EmptyState.tsx   — NEW
frontend/src/components/AppShell.tsx     — NEW
frontend/src/components/Skeletons.tsx    — Rewritten (shimmer)
frontend/src/app/login/page.tsx          — Rewritten
frontend/src/app/customer/page.tsx       — Rewritten
frontend/src/app/customer/cart/page.tsx  — Rewritten
frontend/src/app/customer/orders/page.tsx — Rewritten
frontend/src/app/customer/profile/page.tsx — Rewritten
frontend/src/app/customer/shop/[id]/page.tsx — Rewritten
frontend/src/app/vendor/page.tsx         — Rewritten
frontend/src/app/vendor/udhaar/page.tsx  — Rewritten
frontend/src/app/admin/page.tsx          — Rewritten
frontend/package.json                    — Updated (new deps)
```

### Dependencies Added

- `@tailwindcss/forms` — Form element styling
- `@tailwindcss/container-queries` — Component-level responsive design

---

*UI/UX migration by Kilo — 2026-03-30*
