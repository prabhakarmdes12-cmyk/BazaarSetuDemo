# Chiti Bazaar 🛒⚡

> **Hyperlocal 10-Minute Quick-Commerce & Digital Kirana Network**  
> Bringing local neighborhood dukaans online with the speed, visual appetite, and convenience of Blinkit and Zepto, paired with a modern digital khata (credit ledger).

---

## 🌟 Overview

**Chiti Bazaar** bridges the gap between quick-commerce convenience and trusted local neighborhood stores. It empowers shoppers to order daily milk, fresh produce, atta, staples, and munchies in **10 minutes** from verified neighborhood dukaans, while giving merchants a luxury digital ledger to manage credit (udhaar), track payments, and send instant WhatsApp reminders.

### Key Capabilities

1. **⚡ Blinkit-Grade 10-Minute Customer Storefront (`/customer`)**:
   - **Delivery Cockpit**: Live pulsing radar status (`⚡ Delivery in 10 mins`) with precise address selector.
   - **Visual Category Strip**: Dairy & Breakfast, Atta & Dals, Munchies & Biscuits, Chai & Coffee, Cleaning & Hygiene.
   - **Curated Live Grocery Shelves**:
     - *Daily Milk & Breakfast* (Amul Taaza, Britannia Bread, Amul Butter, Tata Salt).
     - *Atta, Rice, Dals & Oils* (Aashirvaad Chakki Atta, Fortune Sunflower Oil, Toor Dal, Chana Dal).
     - *Munchies & Quick Bites* (Maggi 2-Min Noodles, Parle-G, Lay's, Red Label Tea).
     - *Cleaning & Personal Care* (Surf Excel, Vim Bar, Dettol Soap, Colgate).
   - **Interactive Product Cards**: High-resolution grocery photos on elevated plates, `⚡ 10m` tags, green discount badges (`20% OFF`), pack size pills (`500 ml pouch`, `5 kg bag`), bold prices (`₹28` / `₹35`), and instant `ADD +` / `- 1 +` steppers.
   - **Floating Bottom Cart Dock**: Animated floating dock that slides up as items are added: `[ 🛒 {count} items · ₹{total} ] ─── [ View Cart ➔ ]`.
   - **Verified Neighborhood Dukaans**: Showcases local partners (e.g. Gupta General Store, Kisan Fresh) fulfilling 10-min orders.

2. **💳 Luxury Fintech Vendor Portal (`/vendor/udhaar`)**:
   - **Stripe/CRED-Style Obsidian Ledger**: Deep obsidian card with metallic emerald borders and glowing balance metrics.
   - **Credit Health Matrix**: Visual collection rate progress bars (100%), recovery DSO indicator, and overdue tracking.
   - **One-Click WhatsApp Reminders**: Direct integration to send friendly settlement reminders via WhatsApp.
   - **Seamless Role Switcher**: Quick toggle between Customer Storefront and Dukaan Partner portal.

3. **🤖 Chitigram Calling & Voice Bridge**:
   - WebRTC calling bridge between customer and shopkeeper with low-latency audio.

---

## 🎨 Design System: Obsidian Black & Fresh Leaf Green

Chiti Bazaar follows the **Chiti Technologies Unified Design System**:
- **Palette**:
  - Background Surface: Obsidian Black (`#070A07`)
  - Elevated Containers: Dark Slate (`#0B100B`, `#121812`)
  - Primary Brand & Glow: Fresh Leaf Green (`#10B981`, `#22C55E`, `#059669`)
  - Accents: Emerald glow, subtle golden amber pills, crisp white badges
- **Typography**:
  - Headings / Display: **Outfit** (`font-headline`, 700/800/900 black)
  - Body Text: **Inter** (`font-body`, 400/500/600)
  - Numeric & Financial: **Outfit / JetBrains Mono** for clear, bold pricing and ledger metrics
- **Visual Principles**:
  - Glassmorphism (`backdrop-blur-xl`, subtle `border-white/5` - `border-white/10`)
  - Micro-animations: pulsing delivery badges, smooth card hover lifts, animated quantity steppers
  - High visual density with clean negative space — zero raw empty voids

---

## 🏗️ Architecture & Tech Stack

```
chiti-bazaar/
├── frontend/                     # Next.js 14 App Router
│   ├── src/app/
│   │   ├── customer/             # Blinkit-grade Customer Storefront
│   │   │   ├── cart/             # Cart review & checkout
│   │   │   ├── orders/           # Live order tracking & history
│   │   │   └── shop/[id]/        # Individual Dukaan catalog
│   │   ├── vendor/               # Shopkeeper Cockpit
│   │   │   ├── udhaar/           # Digital Khata / Credit Ledger
│   │   │   ├── orders/           # Real-time incoming orders & status
│   │   │   └── products/         # Inventory management
│   │   ├── admin/                # Platform management
│   │   └── login/                # Phone OTP authentication
│   ├── src/components/           # Reusable UI & atomic design system
│   └── src/lib/                  # Guest cart, analytics, API client
├── backend/                      # Express.js REST + Socket.IO API
│   ├── src/routes/               # Shops, products, cart, orders, udhaar
│   ├── src/services/             # Radar, Shop Bot parser, Chitigram bridge
│   └── prisma/                   # SQLite / PostgreSQL schema & seeds
└── docs/                         # Architecture, design system & agent guides
```

---

## 🚀 Quick Start (Local Development)

### 1. Backend Service
```bash
cd backend
npm install
npm run dev
# Starts on http://localhost:5000
```

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev -- -p 3005
# Starts on http://localhost:3005
```

Open **`http://localhost:3005/customer`** in your browser to experience the 10-minute quick-commerce storefront.

---

## 🌐 Zero-Config Automated Deployment (Vercel)

- Repository: [`prabhakarmdes12-cmyk/chiti-bazaar`](https://github.com/prabhakarmdes12-cmyk/chiti-bazaar.git)
- Deployment on Vercel is **fully automated**:
  - Root configuration has been streamlined for native Next.js build detection.
  - Pushing to `main` or `production` triggers instant Vercel builds without any manual settings required.
  - Production build compiles **32/32 routes with 0 errors**.

---

## 🧪 Testing & Verification

```bash
# Backend unit & integration tests (55/55 passing)
cd backend && npm test

# Frontend typecheck & production build
cd frontend && npm run build
```
