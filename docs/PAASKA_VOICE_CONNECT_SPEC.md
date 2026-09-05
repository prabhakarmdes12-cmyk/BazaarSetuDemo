# Paaska: Voice-First & Relationship-Driven Quick Commerce Architecture

> **Strategic Thesis:**  
> *Blinkit, Zepto, and Instamart built dark-store algorithmic vending machines for tech-workers in metro cities.  
> Paaska empowers the 12-million strong Indian kirana ecosystem by turning local trust, relationship credit (Udhaar), natural multilingual speech (Kashi Sahayak), and 1-tap calling (Chiti Connect) into an unassailable competitive advantage.*

---

## 1. The Strategic Moat: Why Voice & Calling Beat Dark Stores

### The Limits of the Metro Dark-Store Model
1. **High CAC, High Burn:** Dark stores require expensive commercial real estate, dedicated pickers, and high inventory holding costs.
2. **Cold, Transactional UX:** No personalization, zero flexibility. If an item is missing or slightly different, the algorithm cancels it or fails.
3. **Alienating Bharat:** In Tier-2, Tier-3, and peri-urban India, customers do not want to browse 2,500 catalog cards on a 6-inch phone. They shop by **Shopping List (Parchi)**, **Voice Notes**, and **Direct Phone Calls**.

### The Paaska Paradigm
| Dimension | Dark Stores (Blinkit / Zepto) | Paaska (Powered by Chiti Technologies) |
|---|---|---|
| **Inventory Source** | Impersonal Dark Store Warehouse | **Trusted Neighbourhood Dukaan** (e.g., Bighi Brothers Mart) |
| **Ordering Interface** | Search Bar + Infinite Catalog Grid | **Voice Parchi ("Paaska Sahayak") + 1-Tap Hotline** |
| **Merchant Communication** | Hidden behind support bot tickets | **Chiti Connect Encrypted Calling (Zero Phone Leak)** |
| **Customer Credit** | Third-party BNPL (Simpl / LazyPay) | **Digital Khata (Udhaar) Ledger** directly with merchant |
| **Attention Model** | Silent push notifications | **Verbal Audio Dispatch (Chiti Voice / Kashi)** |

---

## 2. System Architecture: The Three Core Pillars

```
                                  PAASKA OPERATING SYSTEM
       ┌────────────────────────────────────┼────────────────────────────────────┐
       │                                    │                                    │
       ▼                                    ▼                                    ▼
   PILLAR 1:                            PILLAR 2:                            PILLAR 3:
 PAASKA SAHAYAK                     CHITI CONNECT HOTLINE                VERBAL AUDIO DISPATCH
(Voice Parchi Engine)               (Encrypted In-App Calling)           (Merchant Earcon & Speech)
       │                                    │                                    │
 • Ambient Floating Mic               • 1-Tap [ 📞 Call Dukaan ]           • Text-to-Speech Order Readout
 • Multilingual Hindi/Hinglish        • WebRTC P2P Audio Channel           • "Ramesh ji ka 3-item order"
 • Master Catalog Entity Match        • Zero Mobile Number Exposure        • Hands-free Voice Accept
 • Interactive Review Sheet           • Live In-Call Co-Shopping HUD       • Bluetooth Speaker Broadcast
```

---

## 3. Pillar 1: Paaska Sahayak (Voice-to-Basket Engine)

### 3.1 Consumer Journey
1. **Ambient Access:** A leaf-green floating microphone button is available on the Home screen, Search bar, and Category pages.
2. **Natural Input:** Customer taps and speaks in Hindi or Hinglish:
   > *"Bhaiya, do packet Amul Taaza doodh, ek packet brown bread, aur 10 rupaye wali Maggi bhej dena."*
3. **Intent Parsing & Catalog Matching:**
   * Audio is captured via `MediaRecorder` (16kHz mono WebM/WAV).
   * Passed to `/api/shop-bot/voice-order`.
   * The NLP engine resolves entities against the 2,176-SKU master catalog using the identity keys `[categoryId, name, unit, slug]`.
4. **Interactive Parchi Review Sheet (Bottom Sheet UI):**
   * Customer sees the synthesized digital parchi:
     * `[x2] Amul Taaza Toned Fresh Milk (500ml) — ₹56`
     * `[x1] Britannia Brown Bread (400g) — ₹50`
     * `[x1] Maggi 2-Minute Masala Noodles (70g) — ₹14`
   * Customer can tap `[+] / [-]` to adjust quantities, swap brands, or tap **`[ ⚡ Order in 10 Mins ]`** to place immediately.

### 3.2 Backend Endpoint Contract
```typescript
// POST /api/shop-bot/voice-order
// Content-Type: multipart/form-data
// Body: { audio: Blob, shopId: string, activePincode?: string }

interface VoiceOrderResponse {
  success: boolean;
  transcript: string; // "do packet amul taaza doodh, ek brown bread, 10 wali maggi"
  detectedLanguage: 'hi' | 'en' | 'hinglish';
  basket: {
    items: Array<{
      productId: string;
      productName: string;
      unit: string;
      price: number;
      quantity: number;
      matchConfidence: number; // 0.0 to 1.0
      image: string;
    }>;
    unmatchedItems: string[]; // e.g. ["special bakery biscuit"]
    subtotal: number;
    estimatedDeliveryMinutes: number;
  };
}
```

---

## 4. Pillar 2: Chiti Connect Dukaan Hotline (Encrypted Calling)

### 4.1 Architecture & Privacy Guarantees
* **DPDP Act 2023 & Local Privacy (`VOICE_INV_007`):** Neither customer nor vendor reveals their private mobile numbers.
* Audio streams peer-to-peer over **WebRTC** using secure DTLS/SRTP encryption.
* **Fallback:** If WebRTC handshake fails within 4 seconds, the app gracefully falls back to masked VoIP routing.

### 4.2 The Live In-Call Co-Shopping HUD
When a call is connected between Customer and Bighi Brothers Mart:
1. **Audio Waveform Visualizer (`ChitiConnectVisualizer.tsx`):**
   * Displays an obsidian & leaf-green dynamic 21-bar audio visualizer showing call health and voice activity.
2. **Merchant Heads-Up Display (HUD):**
   * Customer Profile: Name, Locality (Bank More), Order Frequency (6th order this month).
   * Active Khata Balance: `₹340 Pending Udhaar`.
   * Live Cart / Active Order: Merchant sees exactly what the customer has in their cart in real time.
3. **In-Call Item Addition:**
   * As the customer talks (*"Bhaiya, thoda dhaniya patta bhi daal dena"*), the merchant taps `+ Custom Item / Quick SKU` on their screen.
   * It instantly reflects on the customer's phone with live pricing.

---

## 5. Pillar 3: Verbal Audio Dispatch for Merchants (Chiti Voice)

### 5.1 The Attention Problem in Real Dukaans
In a busy Indian kirana store, shopkeepers cannot look at a mobile phone screen all day. They are handling counter customers, dispensing grains, and handling physical currency. **Visual push notifications fail.**

### 5.2 The Verbal Dispatch System
When an order is created (`BAZAAR.ORDER_CREATED`):
1. **Immediate Earcon:** A distinctive high-urgency Paaska chime rings through the vendor's phone or connected Bluetooth shop speaker.
2. **Natural Hindi Voice Synthesis (Kashi Persona):**
   > *"Bighi Brothers Mart! Bank More se Ramesh ji ka naya order aaya hai. Chaar item: Doodh, bread aur Maggi. Total ek sau bees rupaye. Kripya do minute mein pack karein!"*
3. **One-Tap / Voice Acknowledgment:**
   * Merchant can say: *"Accept!"* or tap the giant green **`[ ⚡ Accept & Pack ]`** button.

---

## 6. Detailed Implementation Work Packages for External Agent

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT WORK PACKAGES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  PACKAGE 1: "Paaska Sahayak" Ambient Voice Input & Parchi Modal             │
│  PACKAGE 2: Chiti Connect WebRTC Hotline & Audio Visualizer                 │
│  PACKAGE 3: Voice-to-Catalog Resolution Engine in Backend                   │
│  PACKAGE 4: Merchant Audio Dispatch & Earcon Synthesizer                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Package 1: "Paaska Sahayak" Voice Input & Parchi Modal (Customer App)
* **Files to Create / Modify:**
  * `frontend/src/components/VoiceParchiModal.tsx` [NEW]
  * `frontend/src/hooks/useVoiceRecorder.ts` [NEW]
  * `frontend/src/components/SearchBar.tsx` [MODIFY — add microphone trigger button]
  * `frontend/src/app/customer/page.tsx` [MODIFY — mount floating Sahayak action button]
* **Deliverable:**
  * User taps mic button → Recording wave animation activates → User speaks → Audio sent to backend → Parchi bottom sheet slides up with detected items, quantities, prices, and one-tap "Add to Cart" / "Buy Now".

### Package 2: Chiti Connect WebRTC Hotline & Audio Visualizer
* **Files to Create / Modify:**
  * `frontend/src/components/ChitiConnectVisualizer.tsx` [NEW — ported from Cosmic Tantra with leaf-green tokens]
  * `frontend/src/components/DukaanHotlineModal.tsx` [NEW — live call interface with mute, speaker, end call]
  * `frontend/src/hooks/useChitiConnectCall.ts` [MODIFY — upgrade stub to full WebRTC audio session]
  * `frontend/src/components/BighiStorefront.tsx` [MODIFY — add [ 📞 Call Dukaan ] button in hero bar]
  * `frontend/src/app/customer/orders/[id]/page.tsx` [MODIFY — add [ 📞 Call Dukaan ] in tracking HUD]
* **Deliverable:**
  * Customer can tap "Call Dukaan" on shop or order page → Triggers encrypted WebRTC call to vendor device → Plays ringtone → When answered, renders dynamic waveform and call duration timer.

### Package 3: Voice-to-Catalog Resolution Engine (Backend)
* **Files to Create / Modify:**
  * `backend/src/routes/shopBot.ts` [MODIFY — add `POST /api/shop-bot/voice-order`]
  * `backend/src/lib/transcription.ts` [MODIFY — integrate Whisper / Web Speech API fallback]
  * `backend/src/lib/shopBotEngine.ts` [MODIFY — improve phonetic entity mapping for 2,176 SKUs]
* **Deliverable:**
  * Robust parsing of Hindi quantities (`"aadha kilo" = 0.5kg`, `"do packet" = 2`, `"das wali" = ₹10`) mapped to exact catalog SKUs.

### Package 4: Merchant Verbal Audio Dispatch (Vendor App)
* **Files to Create / Modify:**
  * `frontend/src/lib/audioDispatch.ts` [NEW — HTML5 Web Speech / Audio Synth helper]
  * `frontend/src/app/vendor/page.tsx` [MODIFY — play spoken Hindi announcement on new orders]
* **Deliverable:**
  * Vendor Action Inbox speaks incoming order details out loud when a new 10-minute order arrives.

---

## 7. Verification & Safety Gates

1. **Audio Permissions Graceful Handling:** If the user denies microphone permission, display a non-blocking toast and focus the text search bar.
2. **DPDP Compliance (`VOICE_INV_007`):** Raw customer voice recordings must NOT be stored permanently unless explicitly opted-in; voice audio is ephemeral and deleted after transcription.
3. **Build Gates:** `npx tsc --noEmit` must remain at 0 errors, and all `55/55` backend tests must continue to pass.
