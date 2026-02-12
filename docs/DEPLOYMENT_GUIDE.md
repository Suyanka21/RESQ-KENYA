# ResQ Kenya - Deployment Guide

> Complete guide for deploying ResQ to production on Firebase.

## Prerequisites

1. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Account** with a project created:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project named `resq-kenya-prod`

3. **M-Pesa Sandbox Credentials** from Safaricom Developer Portal:
   - Consumer Key
   - Consumer Secret
   - Passkey
   - Shortcode

---

## Step 1: Firebase Project Setup

### 1.1 Login to Firebase
```bash
firebase login
```

### 1.2 Initialize Project (if not done)
```bash
# Select your project
firebase use resq-kenya-prod

# Or set it manually
firebase use --add
```

### 1.3 Update .firebaserc
Edit `.firebaserc` with your actual project ID:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

---

## Step 2: Configure Environment Variables

### 2.1 Set M-Pesa Configuration
```bash
# Set M-Pesa sandbox credentials
firebase functions:config:set mpesa.consumer_key="YOUR_CONSUMER_KEY"
firebase functions:config:set mpesa.consumer_secret="YOUR_CONSUMER_SECRET"
firebase functions:config:set mpesa.passkey="YOUR_PASSKEY"
firebase functions:config:set mpesa.shortcode="174379"
firebase functions:config:set mpesa.callback_url="https://YOUR_PROJECT.cloudfunctions.net/mpesaCallback"
firebase functions:config:set mpesa.environment="sandbox"

# Verify configuration
firebase functions:config:get
```

### 2.2 Update Client Environment (.env.local)
Ensure your `.env.local` has all required variables:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

---

## Step 3: Deploy Cloud Functions

### 3.1 Build Functions
```bash
cd functions
npm install
npm run build
cd ..
```

### 3.2 Deploy Functions Only
```bash
firebase deploy --only functions
```

### 3.3 Deploy Specific Functions
```bash
# Deploy only M-Pesa functions
firebase deploy --only functions:initiateStkPush,functions:queryStkStatus,functions:mpesaCallback

# Deploy service functions
firebase deploy --only functions:createServiceRequest,functions:acceptServiceRequest,functions:updateRequestStatus

# Deploy provider functions
firebase deploy --only functions:updateProviderLocation,functions:setProviderAvailability,functions:autoOfflineCheck
```

---

## Step 4: Deploy Security Rules

### 4.1 Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 4.2 Deploy Storage Rules
```bash
firebase deploy --only storage
```

### 4.3 Deploy Everything
```bash
firebase deploy
```

---

## Step 5: Verify Deployment

### 5.1 Check Functions in Console
1. Go to Firebase Console → Functions
2. Verify all 9 functions are deployed:
   - `initiateStkPush`
   - `queryStkStatus`
   - `mpesaCallback`
   - `createServiceRequest`
   - `acceptServiceRequest`
   - `updateRequestStatus`
   - `updateProviderLocation`
   - `setProviderAvailability`
   - `autoOfflineCheck`

### 5.2 Test M-Pesa Callback URL
```bash
# Get your callback URL
firebase functions:shell
# Then test mpesaCallback with sample data
```

### 5.3 View Function Logs
```bash
firebase functions:log
```

---

## Step 6: M-Pesa Sandbox Testing

### 6.1 Test STK Push
Use these Safaricom sandbox test credentials:
- **Test Phone Number**: 254708374149
- **Test PIN**: Any 4 digits (1234)

### 6.2 Update Callback URL
After deployment, update your M-Pesa callback URL in Safaricom Developer Portal:
```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/mpesaCallback
```

---

## Step 7: Enable Firebase Services

### 7.1 Enable Authentication
1. Firebase Console → Authentication → Sign-in method
2. Enable **Phone** authentication
3. Add test phone numbers for development

### 7.2 Enable Firestore
1. Firebase Console → Firestore Database
2. Create database in **production mode**
3. Select region (preferably `us-central1` for function co-location)

### 7.3 Enable Realtime Database
1. Firebase Console → Realtime Database
2. Create database
3. Set rules for provider locations

---

## Step 8: Build Mobile App

### 8.1 Development Build (Expo Go)
```bash
npx expo start
```

### 8.2 Production Build (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for Android
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile preview
```

---

## Troubleshooting

### Functions Deployment Fails
```bash
# Check for build errors
cd functions && npm run build

# Check logs
firebase functions:log --only initiateStkPush
```

### M-Pesa Callback Not Working
1. Verify callback URL is HTTPS
2. Check function logs for errors
3. Ensure Safaricom has whitelisted your domain

### Authentication Issues
1. Enable phone auth in Firebase Console
2. Add SHA-1 fingerprint for Android
3. Check bundle ID for iOS

---

## Quick Deploy Commands

```bash
# Full deployment
npm run deploy

# Functions only
npm run deploy:functions

# Rules only
npm run deploy:rules
```

Add these to your `package.json`:
```json
{
  "scripts": {
    "deploy": "firebase deploy",
    "deploy:functions": "firebase deploy --only functions",
    "deploy:rules": "firebase deploy --only firestore:rules,storage"
  }
}
```

---

## Production Checklist

- [ ] Firebase project created
- [ ] Firebase CLI installed and logged in
- [ ] M-Pesa sandbox credentials configured
- [ ] Cloud Functions deployed
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Phone authentication enabled
- [ ] Test phone numbers added
- [ ] Callback URL registered with Safaricom
- [ ] App builds successfully
- [ ] End-to-end test completed

---

## Next Steps

1. **Beta Testing**: See [BETA_TESTING.md](./BETA_TESTING.md)
2. **M-Pesa Production**: Apply for production credentials
3. **App Store Submission**: Prepare for Google Play and App Store
