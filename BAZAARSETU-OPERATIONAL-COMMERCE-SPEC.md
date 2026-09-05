# MISSION: BAZAARSETU OPERATIONAL COMMERCE BUILD
## Conversational Ordering + Merchant Negotiation + Chitigram + Chiti Console
*Document Version: 1.0.0-PROD | Status: Authoritative Architecture Specification*
*Published For: Autonomous Coding Agent & Engineering Team*

---

## 0. Current Verified Baseline — Preserve It

A forensic audit of BazaarSetu has established the verified foundation:
- **Backend**: Express + Prisma ORM (SQLite for local dev, PostgreSQL for pilot/prod). **51/51 Jest tests passing**.
- **Frontend**: Next.js 14 App Router, Tailwind CSS, `@chiti/ui`. **32/32 routes compiling cleanly**.
- **Verified Capabilities**: Customer PWA, vendor dashboard, admin UI, shop/product CRUD, single-shop cart, order creation, vendor order processing, persistent Socket.io chat, unread/typing tracking, product cards in chat, Udhaar Khata ledger (FIFO DSO aging), Razorpay checkout, RazorpayX payouts, WhatsApp `wa.me` fallback, and public token order tracking.

**CRITICAL INVARIANT**:
Existing marketplace, Udhaar, payments, and merchant tooling **must not regress**. All 51 backend tests and 32 frontend routes must continue to pass and compile.

---

## 1. Primary End-to-End Acceptance Journey

Everything in this milestone exists to make this **ONE canonical flow real**:

```
CUSTOMER
   ↓
Opens BazaarSetu & selects local Kirana store
   ↓
Opens Shop Bot / Conversation
   ↓
Types or speaks: "2 kg atta, 1 Surf packet aur ek accha hair oil chahiye"
   ↓
Shop Bot converts raw text into STRUCTURED COMMERCE STATE (BasketDraft)
   ↓
Customer sees proposed basket
   ↓
Customer edits: "Surf nahi Ariel kar do"
   ↓
Basket updates deterministically
   ↓
Customer confirms basket
   ↓
Merchant receives actionable request card on mobile
   ↓
Merchant marks hair oil unavailable & proposes substitute: "Parachute 500ml ₹210"
   ↓
Customer approves substitute in chat
   ↓
Merchant confirms final price & delivery fee
   ↓
Customer chooses: COD / Direct UPI / Udhaar Khata
   ↓
Order becomes operational (Commercial Order Truth created)
   ↓
Customer can MESSAGE or CALL shopkeeper via Chitigram
   ↓
Merchant moves: PREPARING → READY → OUT_FOR_DELIVERY / PICKUP → COMPLETED
   ↓
Full transaction/event history reaches Chiti Console via event bridge.
```

**Restart Invariant**: This scenario must survive server restarts without loss of state.

---

## 2. Phase A — Shop Bot / Structured Commerce Engine

The AI is a parser and assistant. **It is NOT the source of truth for price, inventory, order status, or payment.**

### 2.1 Backend Shop Bot Interface
Endpoint: `POST /api/shop-bot/parse`

```typescript
// Request
interface ParseRequest {
  customerId: string;
  shopId: string;
  conversationId: string;
  message: string;
  locale?: 'hi-IN' | 'en-IN' | 'hinglish';
}

// Response
interface ParseResponse {
  intent: 'ADD_ITEM' | 'REMOVE_ITEM' | 'CHANGE_QUANTITY' | 'CHANGE_BRAND' | 
          'ACCEPT_SUBSTITUTION' | 'REJECT_SUBSTITUTION' | 'CONFIRM_BASKET' | 
          'ASK_PRICE' | 'ASK_AVAILABILITY' | 'ASK_DELIVERY' | 'CANCEL_REQUEST';
  items: Array<{
    rawText: string;
    requestedName: string;
    quantity: number;
    unit: string; // kg, g, l, ml, packet, piece
    brandPreference?: string;
    matchedProductId?: string;
    matchConfidence: number; // 0.0 - 1.0
    catalogPrice?: number;
    availabilityStatus: 'AVAILABLE' | 'SUBSTITUTE_PROPOSED' | 'UNAVAILABLE' | 'NEEDS_MERCHANT_CHECK';
    requiresClarification: boolean;
  }>;
  unresolvedQuestions: string[];
  basketAction: string;
}
```

### 2.2 Multilingual Parser Rules
Must handle Hindi, English, and Hinglish:
- `"2 kilo atta chahiye"` → Add 2 kg Atta
- `"Surf nahi Ariel kar do"` → Remove Surf, Add Ariel (1 packet)
- `"oil hata do"` → Remove oil
- `"atta 5kg kar do"` → Update Atta quantity to 5 kg
- `"jo sasta accha hai wo de do"` → Brand preference: `economical_quality`
- `"same list bhej do bas dal 2 kilo kar do"` → Clone prior list, update Dal to 2 kg

**Context Preservation**: Maintain structured draft state; do not force users to repeat the full list.

---

## 3. Data Architecture & Schema Extensions

Add the following models to `backend/prisma/schema.prisma` without dropping existing tables:

```prisma
// Conversational Basket Drafts
model ConversationDraft {
  id              String             @id @default(uuid())
  chatId          String
  customerId      String
  shopId          String
  rawMessage      String
  status          String             @default("DRAFT") 
  // DRAFT, CUSTOMER_CONFIRMED, SENT_TO_MERCHANT, MERCHANT_REVIEW, 
  // CHANGES_PROPOSED, FINAL_QUOTE, CONVERTED, EXPIRED, CANCELLED
  quotedSubtotal  Float?
  deliveryFee     Float?             @default(0)
  finalTotal      Float?
  clientActionId  String?            @unique
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  chat            Chat               @relation(fields: [chatId], references: [id])
  items           DraftItem[]
  adjustments     DraftAdjustment[]
}

model DraftItem {
  id                    String            @id @default(uuid())
  draftId               String
  rawText               String
  requestedName         String
  quantity              Float
  unit                  String            // kg, g, l, ml, packet, piece
  brandPreference       String?
  matchedProductId      String?
  matchConfidence       Float             @default(0.0)
  catalogPrice          Float?
  quotedPrice           Float?
  availabilityStatus    String            @default("NEEDS_MERCHANT_CHECK") 
  // AVAILABLE, SUBSTITUTE_PROPOSED, UNAVAILABLE, NEEDS_MERCHANT_CHECK
  sourceMessageId       String?
  createdAt             DateTime          @default(now())

  draft                 ConversationDraft @relation(fields: [draftId], references: [id], onDelete: Cascade)
}

model DraftAdjustment {
  id                    String            @id @default(uuid())
  draftId               String
  itemId                String?
  type                  String            // PRICE_CHANGE, QUANTITY_CHANGE, SUBSTITUTION, UNAVAILABLE, CUSTOM_ITEM
  originalText          String?
  proposedName          String?
  proposedQuantity      Float?
  proposedPrice         Float?
  status                String            @default("PROPOSED") 
  // PROPOSED, CUSTOMER_ACCEPTED, CUSTOMER_DECLINED, SUPERSEDED
  reason                String?
  createdAt             DateTime          @default(now())

  draft                 ConversationDraft @relation(fields: [draftId], references: [id], onDelete: Cascade)
}

// Chiti Console Outbound Telemetry Event Log
model OperationalEventLog {
  id              String       @id @default(uuid())
  eventId         String       @unique
  eventType       String       // e.g. BAZAAR.ORDER_REQUESTED
  version         String       @default("1.0.0")
  shopId          String?
  customerId      String?
  conversationId  String?
  orderId         String?
  payload         String       // JSON string
  delivered       Boolean      @default(false)
  attempts        Int          @default(0)
  occurredAt      DateTime     @default(now())
}
```

---

## 4. Catalogue Invariant: Catalogue Must Not Be Mandatory

Support all three merchant modes:
1. **FULL_CATALOGUE**: Known SKU + price + inventory.
2. **LIGHT_CATALOGUE**: Categories and core items partially known.
3. **CONVERSATIONAL**: Shopkeeper manually verifies availability and quotes price.

**Zero Hallucination Rule**:
For unmatched items, never fabricate a price or brand. Create `UNMATCHED_REQUEST_ITEM` with `availabilityStatus = "NEEDS_MERCHANT_CHECK"` and send it to the merchant for a manual quote.

---

## 5. Shopkeeper Mobile Request Card

Provide a minimal, touch-friendly mobile interface for the dukandar:

```
┌──────────────────────────────────────────────┐
│ NEW ORDER REQUEST #BS-20418                  │
│ Customer: Rahul | Delivery: Home Delivery    │
├──────────────────────────────────────────────┤
│ ITEMS:                                       │
│  [✓] Atta - 2 kg                      ₹90    │
│  [✓] Ariel - 1 packet                 ₹130   │
│  [?] Hair Oil - 1 ("accha wala")             │
│      -> [Select Product] [Enter Price]       │
├──────────────────────────────────────────────┤
│ Actions per item:                            │
│  [AVAILABLE]  [SUBSTITUTE]  [UNAVAILABLE]    │
│  [EDIT QTY]   [EDIT PRICE]                   │
├──────────────────────────────────────────────┤
│ Total: ₹428 | Delivery: ₹20                  │
│ [CONFIRM & SEND QUOTE]  [MESSAGE]  [CALL]    │
└──────────────────────────────────────────────┘
```

---

## 6. Chitigram Protocol Integration

BazaarSetu's chat bridges into canonical Chitigram message types:

| Bazaar Canonical Type | Description | Payload Data |
|---|---|---|
| `BAZAAR.BASKET_PROPOSAL` | Proposed shopping list | `{ draftId, items: [...], totalEstimate }` |
| `BAZAAR.SUBSTITUTION` | Merchant replacement offer | `{ draftId, adjustmentId, original, replacement, priceDiff }` |
| `BAZAAR.FINAL_QUOTE` | Binding merchant bill | `{ draftId, subtotal, deliveryFee, finalTotal }` |
| `BAZAAR.ORDER_CARD` | Commercial order tracking | `{ orderId, status, items: [...], totalAmount }` |
| `BAZAAR.PAYMENT_REQUEST` | Payment options | `{ orderId, amount, upiLink, allowUdhar, allowCod }` |
| `BAZAAR.UDHAAR_RECEIPT` | Khata booking confirmation | `{ ledgerId, creditAmount, previousBalance, newBalance }` |
| `CHITIGRAM.CALL_RECORD` | VoIP call event log | `{ callId, duration, status, startedAt, endedAt }` |

**Participants**: Model `CUSTOMER`, `SHOP_BOT`, `MERCHANT`, and `CHITI_OPERATOR` in the same conversation thread. Context must never be fragmented into multiple chats.

**Voice / Chiti-Connect**: Reuse Chiti-Connect WebRTC calling. Add a prominent `CALL SHOP` button in the chat header.

---

## 7. Payment Truth & Udhaar Integration

- **Payment Methods Supported**:
  - `COD` (Cash on Delivery)
  - `DIRECT_UPI` (Merchant UPI QR)
  - `UDHAAR` (Native BazaarSetu Khata)
  - `RAZORPAY` (Where configured)
- **Payment Verification**:
  - Opening a UPI intent link does NOT equal payment success.
  - Only merchant receipt confirmation or server webhook marks status as `PAID`.
- **Udhaar In Chat**:
  - Merchant sends `BAZAAR.PAYMENT_REQUEST` with Udhaar enabled.
  - Customer accepts: `"Add ₹428 to Khata?"`.
  - Backend applies debit to `UdharLedger` using existing DSO algorithms and returns `BAZAAR.UDHAAR_RECEIPT`.

---

## 8. Chiti Console Operational Event Bridge

BazaarSetu emits signed, versioned, idempotent operational events to Chiti Console:

### 8.1 Event Envelope
```json
{
  "eventId": "evt_bazaar_9812401",
  "eventType": "BAZAAR.ORDER_REQUESTED",
  "version": "1.0.0",
  "shopId": "shop_gupta_01",
  "customerId": "usr_rahul_02",
  "conversationId": "chat_89124",
  "orderId": "ord_20418",
  "occurredAt": "2026-09-05T05:30:00.000Z",
  "payload": {
    "itemsCount": 3,
    "estimatedAmount": 428,
    "paymentMethod": "COD"
  }
}
```

### 8.2 SLA & Escalation Rules
- **T + 2 min**: If merchant has not viewed request → send in-app reminder + `wa.me` fallback link.
- **T + 3 min**: If unacknowledged → trigger `BAZAAR.MERCHANT_RESPONSE_DELAYED` to Chiti Console.
- Operator can: `CALL SHOP`, `MESSAGE SHOP`, `RECOMMEND ALTERNATE SHOP`, or `ASSIST MERCHANT`.

---

## 9. Failure Modes & Resilience Rules

| Failure Condition | Expected System Behavior |
|---|---|
| **LLM Service Down / Slow** | Fallback to deterministic regex/dictionary parser; mark ambiguous items as `NEEDS_MERCHANT_CHECK`. Never drop request. |
| **Invalid JSON from LLM** | Zod validation fails closed; raw text preserved in `rawText`, forwarded to merchant as manual request card. |
| **Chiti Console Down** | Queue events in `OperationalEventLog` with exponential retry. Commerce operations proceed uninterrupted. |
| **Merchant Offline / Closed** | Display merchant presence badge (`CLOSED` / `AWAY`) to customer before order submission. |
| **Duplicate Submit / Click** | Enforce `clientActionId` idempotency. Repeated clicks return the existing draft/order without duplication. |
| **App Server Restart** | All draft states, adjustments, orders, and chat action cards remain intact in PostgreSQL / SQLite. |

---

## 10. Automated Acceptance Test Specification (`pilot.conversational.e2e.ts`)

The implementation is verified when the following 22-step automated sequence executes cleanly:
1. Register Customer (Rahul) and Merchant (Gupta Ji).
2. Customer sends: `"2kg atta, 1 Surf packet aur ek accha hair oil"`.
3. Verify `ConversationDraft` created with 3 items: Atta (matched), Surf (matched), Hair Oil (`NEEDS_MERCHANT_CHECK`).
4. Customer sends: `"Surf nahi Ariel kar do"`.
5. Verify draft updates: Surf removed, Ariel added.
6. Customer confirms draft.
7. Merchant retrieves request card via `GET /api/basket/draft/:chatId`.
8. Merchant submits adjustment: Hair Oil unavailable → substitute Parachute 500ml ₹210.
9. Customer approves substitution.
10. Merchant submits final quote (Subtotal ₹408 + Delivery ₹20 = ₹428).
11. Customer selects COD checkout.
12. Verify commercial `Order` created in `pending` / `accepted` status.
13. Simulate Chitigram call record event in conversation thread.
14. Merchant transitions order: `preparing` → `ready` → `completed`.
15. Verify `OperationalEventLog` contains all sequential events.
16. Simulate server restart: reload Prisma models and verify full state restoration.

---

## 11. Developer Execution Checklist

```bash
# 1. Verify baseline
cd D:\Projects\BazaarSetu\backend
npm test
cd D:\Projects\BazaarSetu\frontend
npm run build

# 2. Apply Schema
cd D:\Projects\BazaarSetu\backend
npx prisma generate
npx prisma db push

# 3. Run New Pilot Test Suite
npm test -- src/__tests__/pilot.conversational.e2e.ts

# 4. Final Full Regression
npm test
cd D:\Projects\BazaarSetu\frontend
npm run build
```
