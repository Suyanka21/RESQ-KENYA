# M-Pesa Integration Setup

## Overview
ResQ Kenya uses M-Pesa Lipa Na M-Pesa (STK Push) for payments. This requires:
1. Safaricom Daraja API credentials
2. Firebase Cloud Functions for server-side API calls
3. A callback URL for payment confirmations

## Prerequisites

1. **Safaricom Daraja Account**
   - Register at https://developer.safaricom.co.ke
   - Create an app and get Consumer Key & Secret
   - Get your Shortcode, Passkey, and configure callback URL

2. **Firebase Project**
   - Firebase project with Blaze (pay-as-you-go) plan for Cloud Functions
   - Firebase CLI installed: `npm install -g firebase-tools`

## Setup Steps

### 1. Set Firebase Environment Variables

```bash
firebase functions:config:set mpesa.consumer_key="YOUR_CONSUMER_KEY"
firebase functions:config:set mpesa.consumer_secret="YOUR_CONSUMER_SECRET"
firebase functions:config:set mpesa.shortcode="YOUR_SHORTCODE"
firebase functions:config:set mpesa.passkey="YOUR_PASSKEY"
firebase functions:config:set mpesa.callback_url="https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/mpesaCallback"
firebase functions:config:set mpesa.environment="sandbox"  # or "production"
```

### 2. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 3. Sandbox Testing

For sandbox testing, use these Safaricom test credentials:
- Shortcode: 174379
- Passkey: (provided in Daraja sandbox)
- Test Phone: Use any Kenyan number format

### 4. Update .env.local (Client-side)

The mobile app needs the Firebase Functions URL. Add to `.env.local`:

```env
EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION=us-central1
```

## M-Pesa Flow

1. **Customer initiates payment** (mobile app)
2. **App calls `initiateStkPush`** Cloud Function
3. **Cloud Function calls Safaricom API**
4. **Customer receives STK Push** on phone
5. **Customer enters PIN**
6. **Safaricom calls `mpesaCallback`** webhook
7. **Cloud Function updates Firestore**
8. **App receives real-time update** via Firestore listener

## Firestore Collections

### `payment_requests` Collection
```javascript
{
  userId: "user_123",
  requestId: "request_456",
  amount: 2500,
  phoneNumber: "254712345678",
  checkoutRequestID: "ws_CO_...",
  merchantRequestID: "...",
  status: "pending" | "completed" | "failed",
  mpesaReceiptNumber: "QKH123ABC", // on success
  createdAt: Timestamp,
  completedAt: Timestamp
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Insufficient balance |
| 1032 | Request cancelled by user |
| 1037 | Timeout |

## Testing Locally

For local development, use the demo payment function which simulates M-Pesa:

```typescript
import { initiatePaymentDemo } from '@/services/payment.service';
```

This bypasses real M-Pesa API calls and simulates success/failure.
