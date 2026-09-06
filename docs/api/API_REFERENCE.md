# Paaska — API Reference Specification

**Version:** 2.0.0  
**Base URL:** `http://localhost:5000` (Dev) / `https://api.paaska.chiti.com` (Prod)  
**Authentication:** Bearer JWT Token or API Key via `Authorization: Bearer <token>`  
**Last Updated:** September 6, 2026

---

## 1. Store & Location Serviceability APIs

### `GET /api/shops`
Fetches registered shops annotated with real-time customer serviceability calculations.

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `lat` | Float | Optional | Customer latitude (e.g. `23.7957`) |
| `lng` | Float | Optional | Customer longitude (e.g. `86.4304`) |
| `pincode` | String | Optional | Customer 6-digit postal code (e.g. `"826001"`) |

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "bighi-brothers-mart",
      "name": "Bighi Brothers Mart",
      "slug": "bighi-brothers-mart",
      "address": "Bank More, Dhanbad · 826001",
      "lat": 23.7957,
      "lng": 86.4304,
      "distance": 0.2,
      "roadDistance": 0.26,
      "canDeliver": true,
      "isDeliverable": true,
      "canPickup": true,
      "drivingEtaMinutes": 10,
      "deliveryRadiusKm": 3.5,
      "deliveryFee": 15.0,
      "freeDeliveryAbove": 199.0,
      "minOrderAmount": 0.0
    }
  ]
}
```

### `PUT /api/shops/:id`
Updates merchant delivery configuration and store operational parameters.

**Request Body:**
```json
{
  "deliveryRadiusKm": 4.0,
  "serviceablePincodes": "826001, 826004",
  "deliveryFee": 15.0,
  "freeDeliveryAbove": 199.0,
  "minOrderAmount": 50.0
}
```

---

## 2. Paaska Sahayak (Conversational Voice Commerce) APIs

### `POST /api/shop-bot/voice-order`
Accepts raw multipart voice audio, transcribes intent, and resolves entities into a priced basket.

**Request Headers:** `Content-Type: multipart/form-data`  
**Form Fields:**
- `audio`: Binary audio file (`audio/webm` or `audio/mp4`).
- `shopId`: Merchant UUID (e.g. `bighi-brothers-mart`).
- `hint`: (Optional) Client-side interim transcript string.

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "transcript": "bhaiya do packet doodh aur aadha kilo chini",
    "detectedLanguage": "hi-IN",
    "confidence": 0.94,
    "basket": [
      {
        "productId": "prod-dairy-001",
        "productName": "Amul Taaza Toned Milk",
        "quantity": 2,
        "unit": "500 ml pouch",
        "price": 27.0,
        "image": "/catalog/items/dairy/amul-taaza-500ml.jpg"
      },
      {
        "productId": "prod-staple-014",
        "productName": "Madhur Pure Sugar",
        "quantity": 1,
        "unit": "1 kg pack",
        "price": 48.0,
        "image": "/catalog/items/staples/madhur-sugar-1kg.jpg"
      }
    ],
    "totalAmount": 102.0,
    "estimatedDeliveryMinutes": 10,
    "unmatchedItems": []
  }
}
```

---

## 3. Chiti Connect Calling & Telemetry APIs

### `POST /api/chitigram/call-record`
Records an anonymized audit log for an in-app merchant voice session.

**Request Body:**
```json
{
  "shopId": "bighi-brothers-mart",
  "durationSeconds": 45,
  "status": "COMPLETED",
  "callType": "WEBRTC_P2P"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "callId": "call-rec-98124",
    "loggedAt": "2026-09-06T05:30:00.000Z"
  }
}
```

---

## 4. Order Lifecycle & Counter Pickup APIs

### `POST /api/orders`
Submits a new order for instant delivery or counter pickup.

**Request Body:**
```json
{
  "shopId": "bighi-brothers-mart",
  "orderType": "PICKUP",
  "items": [
    {
      "productId": "prod-dairy-001",
      "quantity": 2,
      "price": 27.0
    }
  ],
  "paymentMethod": "COD",
  "customerLocation": "23.7957,86.4304"
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "orderId": "ord-849201",
    "status": "PENDING",
    "orderType": "PICKUP",
    "pickupOtp": "4819",
    "pickupExpiresAt": "2026-09-06T17:30:00.000Z",
    "deliveryFee": 0.0,
    "totalAmount": 54.0
  }
}
```

### `POST /api/orders/:id/verify-pickup-otp`
Merchant counter verification for handing over packed goods.

**Request Body:**
```json
{
  "otp": "4819"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "orderId": "ord-849201",
    "status": "COMPLETED",
    "verifiedAt": "2026-09-06T06:15:00.000Z"
  }
}
```

---

## 5. Real-Time WebSocket Events

Connected clients authenticate to `ws://localhost:5000` using their session JWT.

| Event Name | Direction | Payload Schema | Description |
|---|---|---|---|
| `order:created` | Server $\rightarrow$ Merchant | `{ orderId, customerName, itemCount, totalAmount, locality, orderType }` | Triggers Audio Dispatch earcon and spoken Hinglish notification. |
| `order:status_change` | Server $\rightarrow$ Shopper | `{ orderId, newStatus, estimatedDeliveryMinutes }` | Live order tracking status updates. |
| `call:incoming` | Server $\rightarrow$ Merchant | `{ callerSessionId, shopId }` | Inbound Chiti Connect voice call signal. |
| `call:terminate` | Bi-directional | `{ callId, reason }` | Hang-up signaling terminating active audio sessions. |
