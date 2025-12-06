
# ResQ Mobile Application - Project IDX Setup Guide

## 📋 Project Overview

**Project Name:** ResQ  
**Type:** Emergency Roadside & Medical Assistance Platform  
**Target Market:** Kenya (Nairobi initial launch)  
**Platform:** iOS & Android (React Native with Expo)  
**Backend:** Google Firebase Suite

**Tagline:** "The Uber for road and medical rescue"

---

## 🎯 Project Objectives

Transform the current React web prototype into a production-ready mobile application that:

1. Connects motorists in distress with verified service providers in real-time
2. Handles 6 service categories: Towing, Tire Repair, Battery Jumpstart, Fuel Delivery, Vehicle Diagnostics, and Ambulance Dispatch
3. Provides real-time GPS tracking of service providers
4. Integrates M-Pesa payment processing (Safaricom Daraja API)
5. Manages a dual-app ecosystem (Customer App + Provider App)

---

## 🏗️ Current State Analysis

### **What Exists (Web Prototype)**

**Tech Stack:**

- React 18 with TypeScript
- Vite build system
- Tailwind CSS (custom "Voltage Premium" theme)
- Lucide React icons
- Single Page Application (SPA)

**Component Structure:**

```
/
├── index.html              # Entry point + Tailwind config
├── index.tsx               # React root
├── App.tsx                 # Main layout & state manager
├── metadata.json           # App metadata
│
└── components/
    ├── Navbar.tsx          # Navigation header
    ├── Hero.tsx            # Landing hero section
    ├── Features.tsx        # 6-service grid display
    ├── HowItWorks.tsx      # Process explanation
    ├── Membership.tsx      # Pricing tiers
    ├── Testimonials.tsx    # User reviews
    ├── DriverCTA.tsx       # Provider recruitment
    ├── DownloadCTA.tsx     # App store links
    ├── Footer.tsx          # Contact information
    ├── Button.tsx          # Reusable button component
    │
    └── Dashboard.tsx       # **CRITICAL** Main app simulation
```

### **Dashboard.tsx - Core Logic (Currently Simulated)**

**State Management:**

```typescript
// Order flow stages
stage: 'idle' | 'locating' | 'details' | 'payment' | 'tracking' | 'complete'

// View navigation
currentView: 'home' | 'orders' | 'wallet' | 'settings'

// Service selection
selectedService: 'towing' | 'tire' | 'battery' | 'fuel' | 'diagnostics' | 'ambulance'
```

**Simulated Features (Need Real Implementation):**

- Driver location tracking (CSS animation + useEffect timer)
- Push notifications (local array)
- M-Pesa payments (setTimeout simulation)
- Service provider matching (hardcoded data)
- Order history (local state only)

**Key Functions:**

- `handleServiceSelect()` - Service type selection
- `handleLocationConfirm()` - GPS confirmation
- `handleDetailsSubmit()` - Service details collection
- `handlePaymentSubmit()` - Payment processing trigger
- `triggerNotification()` - Alert system

---

## 🚀 Migration Roadmap

### **Phase 1: Project Initialization (Week 1)**

#### **Step 1.1: Setup React Native with Expo**

**Action Items:**

1. Initialize new Expo project with TypeScript template
2. Configure project structure to match current architecture
3. Setup custom Tailwind equivalent (NativeWind or custom theme)
4. Install required dependencies:
    
    ```bash
    npx create-expo-app resq-mobile --template expo-template-blank-typescriptcd resq-mobilenpx expo install react-native-mapsnpx expo install @react-navigation/native @react-navigation/stacknpx expo install expo-location expo-notifications
    ```
    

#### **Step 1.2: Firebase Project Setup**

**Firebase Console Configuration:**

1. Create new Firebase project: "ResQ-Production"
    
2. Enable the following services:
    
    - Authentication (Phone Number provider for Kenya +254)
    - Firestore Database
    - Realtime Database (for live tracking)
    - Cloud Functions (Node.js)
    - Cloud Storage (for photos/documents)
    - Firebase Cloud Messaging (push notifications)
3. Register iOS app bundle: `com.geometryltd.resq`
    
4. Register Android app bundle: `com.geometryltd.resq`
    
5. Download and add configuration files:
    
    - `GoogleService-Info.plist` (iOS)
    - `google-services.json` (Android)

**Firebase SDK Installation:**

```bash
npx expo install firebase
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/firestore
npm install @react-native-firebase/database
npm install @react-native-firebase/storage
npm install @react-native-firebase/messaging
```

#### **Step 1.3: Design System Migration**

**Current Design Tokens (Voltage Premium):**

```javascript
// Colors
colors: {
  charcoal: {
    900: '#0F0F0F',
    800: '#1A1A1A',
    700: '#252525',
    600: '#2E2E2E'
  },
  voltage: '#FFD60A',
  voltageBright: '#FFF455',
  voltageDeep: '#E6B800',
  emergency: '#FF3D3D',
  success: '#00E676',
  warning: '#FF9800',
  medical: '#DC143C'
}

// Typography
fontFamily: {
  sans: ['Inter', 'system-ui'],
  mono: ['JetBrains Mono', 'monospace']
}
```

**Action:** Convert to React Native StyleSheet or NativeWind configuration

---

### **Phase 2: Authentication System (Week 2)**

#### **Step 2.1: Phone Authentication Flow**

**Current:** Login button just toggles state in `App.tsx`

**Required Implementation:**

**A. Login Screen Component:**

```typescript
// screens/LoginScreen.tsx
interface LoginScreenProps {
  navigation: NavigationProp;
}

// Features:
// - Phone number input with Kenya country code (+254)
// - Format validation (9 digits after +254)
// - Firebase Auth phone number verification
// - OTP input screen
// - Auto-navigation to Dashboard on success
```

**B. Firebase Auth Integration:**

```typescript
// services/auth.service.ts

async function sendOTP(phoneNumber: string) {
  // Use Firebase Phone Auth
  // Send SMS OTP to Kenyan number
  // Return verification ID
}

async function verifyOTP(verificationId: string, code: string) {
  // Verify OTP code
  // Create user session
  // Store user token
  // Navigate to dashboard
}

async function getCurrentUser() {
  // Check if user is authenticated
  // Return user object or null
}

async function signOut() {
  // Clear user session
  // Navigate to login
}
```

**C. Firestore User Profile Creation:**

```typescript
// On first login, create user document:
users/{userId} = {
  phoneNumber: string,
  createdAt: timestamp,
  displayName: string | null,
  vehicles: array<VehicleObject>,
  emergencyContacts: array<ContactObject>,
  membership: 'basic' | 'plus',
  savedLocations: array<LocationObject>
}
```

---

### **Phase 3: Database Architecture (Week 3)**

#### **Step 3.1: Firestore Collections Schema**

**Collections Structure:**

**1. Users Collection:**

```typescript
users/{userId}
├── phoneNumber: string
├── displayName: string
├── email?: string
├── profilePhoto?: string
├── createdAt: timestamp
├── membership: 'basic' | 'plus'
├── loyaltyPoints: number
├── vehicles: [{
│   make: string,
│   model: string,
│   year: number,
│   licensePlate: string,
│   fuelType: 'petrol' | 'diesel' | 'electric',
│   isPrimary: boolean
│   }]
├── emergencyContacts: [{
│   name: string,
│   phone: string,
│   relationship: string
│   }]
├── savedLocations: [{
│   name: string,
│   address: string,
│   coordinates: GeoPoint
│   }]
└── paymentMethods: [{
    type: 'mpesa' | 'card',
    details: encrypted,
    isDefault: boolean
    }]
```

**2. Service Providers Collection:**

```typescript
providers/{providerId}
├── phoneNumber: string
├── displayName: string
├── serviceTypes: ['towing', 'tire', 'battery', 'fuel', 'diagnostics', 'ambulance']
├── rating: number (0-5)
├── totalServices: number
├── verificationStatus: 'pending' | 'verified' | 'suspended'
├── documents: {
│   driverLicense: string (Storage URL),
│   vehicleRegistration: string,
│   insurance: string,
│   certifications: array<string>
│   }
├── vehicle: {
│   type: string,
│   licensePlate: string,
│   capacity: string
│   }
├── availability: {
│   isOnline: boolean,
│   currentLocation: GeoPoint,
│   lastUpdated: timestamp
│   }
├── earnings: {
│   today: number,
│   thisWeek: number,
│   thisMonth: number,
│   allTime: number
│   }
└── metrics: {
    acceptanceRate: number,
    completionRate: number,
    averageResponseTime: number
    }
```

**3. Service Requests Collection:**

```typescript
requests/{requestId}
├── userId: string (ref)
├── providerId: string (ref) | null
├── serviceType: 'towing' | 'tire' | 'battery' | 'fuel' | 'diagnostics' | 'ambulance'
├── status: 'pending' | 'accepted' | 'enroute' | 'arrived' | 'inProgress' | 'completed' | 'cancelled'
├── customerLocation: {
│   coordinates: GeoPoint,
│   address: string,
│   landmark: string,
│   instructions: string
│   }
├── serviceDetails: {
│   // Dynamic based on serviceType
│   // Towing: destination, vehicleCondition
│   // Fuel: fuelType, quantity
│   // Ambulance: emergencyType, patientCount
│   }
├── pricing: {
│   baseServiceFee: number,
│   distanceFee: number,
│   additionalCharges: number,
│   platformFee: number,
│   tip: number,
│   total: number
│   }
├── timeline: {
│   requestedAt: timestamp,
│   acceptedAt: timestamp | null,
│   arrivedAt: timestamp | null,
│   completedAt: timestamp | null
│   }
├── payment: {
│   method: 'mpesa' | 'card',
│   status: 'pending' | 'processing' | 'completed' | 'failed',
│   transactionId: string,
│   mpesaReceiptNumber?: string
│   }
├── rating: {
│   stars: number (1-5),
│   review: string,
│   tags: array<string>
│   } | null
└── photos: array<string> (Storage URLs)
```

**4. Realtime Database (For Live Tracking):**

```typescript
// Firebase Realtime Database Structure
activeRequests/{requestId}
├── providerId: string
├── providerLocation: {
│   latitude: number,
│   longitude: number,
│   heading: number,
│   speed: number,
│   timestamp: number
│   }
├── customerLocation: {
│   latitude: number,
│   longitude: number
│   }
├── eta: number (seconds)
└── distance: number (meters)
```

#### **Step 3.2: Geospatial Queries (Provider Matching)**

**Problem:** Find nearest available providers within radius

**Solution:** Implement Geofire or GeoFirestore

**Installation:**

```bash
npm install geofire-common
```

**Implementation:**

```typescript
// services/matching.service.ts

async function findNearestProviders(
  serviceType: string,
  customerLocation: GeoPoint,
  radiusKm: number = 10
) {
  // 1. Calculate geohash bounds
  const bounds = geofire.geohashQueryBounds(
    [customerLocation.latitude, customerLocation.longitude],
    radiusKm * 1000
  );

  // 2. Query Firestore for providers
  const providers = [];
  for (const bound of bounds) {
    const query = firestore()
      .collection('providers')
      .where('serviceTypes', 'array-contains', serviceType)
      .where('availability.isOnline', '==', true)
      .orderBy('geohash')
      .startAt(bound[0])
      .endAt(bound[1]);

    const snapshot = await query.get();
    providers.push(...snapshot.docs);
  }

  // 3. Calculate actual distance and sort
  const providersWithDistance = providers.map(doc => {
    const data = doc.data();
    const distance = geofire.distanceBetween(
      [customerLocation.latitude, customerLocation.longitude],
      [data.availability.currentLocation.latitude, data.availability.currentLocation.longitude]
    );
    return { ...data, distance, id: doc.id };
  }).filter(p => p.distance <= radiusKm);

  // 4. Sort by distance and rating
  providersWithDistance.sort((a, b) => a.distance - b.distance);

  return providersWithDistance.slice(0, 5); // Return top 5
}
```

---

### **Phase 4: Real-Time Tracking (Week 4)**

#### **Step 4.1: Provider Location Broadcasting**

**Provider App - Background Location Tracking:**

```typescript
// services/location.service.ts (Provider App)

import * as Location from 'expo-location';
import { database } from './firebase.config';

let locationSubscription: Location.LocationSubscription | null = null;

async function startLocationBroadcast(requestId: string, providerId: string) {
  // Request permissions
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }

  // Start watching location
  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 3000, // Update every 3 seconds
      distanceInterval: 10, // Or every 10 meters
    },
    (location) => {
      // Update Realtime Database
      database()
        .ref(`activeRequests/${requestId}/providerLocation`)
        .set({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          heading: location.coords.heading,
          speed: location.coords.speed,
          timestamp: Date.now(),
        });
    }
  );
}

function stopLocationBroadcast() {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
}
```

#### **Step 4.2: Customer Real-Time Tracking**

**Customer App - Live Map Updates:**

```typescript
// components/TrackingMap.tsx

import React, { useEffect, useState } from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { database } from '../services/firebase.config';

interface TrackingMapProps {
  requestId: string;
  customerLocation: { latitude: number; longitude: number };
}

export const TrackingMap: React.FC<TrackingMapProps> = ({ 
  requestId, 
  customerLocation 
}) => {
  const [providerLocation, setProviderLocation] = useState(null);
  const [eta, setEta] = useState(0);

  useEffect(() => {
    // Subscribe to provider location updates
    const locationRef = database().ref(`activeRequests/${requestId}/providerLocation`);
    
    const unsubscribe = locationRef.on('value', (snapshot) => {
      const location = snapshot.val();
      if (location) {
        setProviderLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        
        // Calculate ETA (you can use Google Directions API)
        calculateETA(location, customerLocation);
      }
    });

    return () => locationRef.off('value', unsubscribe);
  }, [requestId]);

  const calculateETA = async (from, to) => {
    // Call Google Directions API or use distance/speed calculation
    // Update ETA state
  };

  return (
    <MapView
      style={{ flex: 1 }}
      region={{
        latitude: customerLocation.latitude,
        longitude: customerLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
    >
      {/* Customer marker */}
      <Marker coordinate={customerLocation} pinColor="#FFD60A" />
      
      {/* Provider marker */}
      {providerLocation && (
        <Marker coordinate={providerLocation} pinColor="#FF3D3D">
          {/* Custom provider icon */}
        </Marker>
      )}
      
      {/* Route polyline */}
      {providerLocation && (
        <Polyline
          coordinates={[providerLocation, customerLocation]}
          strokeColor="#FFD60A"
          strokeWidth={3}
          lineDashPattern={[10, 5]}
        />
      )}
    </MapView>
  );
};
```

---

### **Phase 5: M-Pesa Integration (Week 5)**

#### **Step 5.1: Safaricom Daraja API Setup**

**Prerequisites:**

1. Register on Safaricom Developer Portal (https://developer.safaricom.co.ke/)
2. Create app and obtain credentials:
    - Consumer Key
    - Consumer Secret
    - Lipa Na M-Pesa Online Shortcode
    - Passkey

**Environment Variables (.env):**

```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-firebase-function-url/mpesa-callback
```

#### **Step 5.2: Cloud Functions Implementation**

**Firebase Functions Setup:**

```bash
cd functions
npm install axios
npm install moment
```

**Function: Initiate STK Push**

```typescript
// functions/src/index.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import * as moment from 'moment';

admin.initializeApp();

// Get OAuth token
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  return response.data.access_token;
}

// STK Push function
export const initiatePayment = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { phoneNumber, amount, requestId } = data;

  // Generate timestamp and password
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  // Get access token
  const accessToken = await getAccessToken();

  // STK Push request
  try {
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: requestId,
        TransactionDesc: `ResQ Service Payment`,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Update request with checkout ID
    await admin.firestore()
      .collection('requests')
      .doc(requestId)
      .update({
        'payment.checkoutRequestID': response.data.CheckoutRequestID,
        'payment.status': 'processing',
      });

    return {
      success: true,
      checkoutRequestID: response.data.CheckoutRequestID,
    };
  } catch (error) {
    console.error('M-Pesa STK Push error:', error);
    throw new functions.https.HttpsError('internal', 'Payment initiation failed');
  }
});

// Callback handler
export const mpesaCallback = functions.https.onRequest(async (req, res) => {
  const { Body } = req.body;

  if (!Body || !Body.stkCallback) {
    return res.status(400).json({ error: 'Invalid callback data' });
  }

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;

  // Find the request
  const requestsSnapshot = await admin.firestore()
    .collection('requests')
    .where('payment.checkoutRequestID', '==', CheckoutRequestID)
    .limit(1)
    .get();

  if (requestsSnapshot.empty) {
    console.error('Request not found for CheckoutRequestID:', CheckoutRequestID);
    return res.status(404).json({ error: 'Request not found' });
  }

  const requestDoc = requestsSnapshot.docs[0];

  if (ResultCode === 0) {
    // Payment successful
    const metadata = CallbackMetadata.Item;
    const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
    const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;

    await requestDoc.ref.update({
      'payment.status': 'completed',
      'payment.mpesaReceiptNumber': mpesaReceiptNumber,
      'payment.completedAt': admin.firestore.FieldValue.serverTimestamp(),
      'payment.transactionDate': transactionDate,
    });

    // Send push notification to customer
    // ... notification logic

  } else {
    // Payment failed
    await requestDoc.ref.update({
      'payment.status': 'failed',
      'payment.errorMessage': ResultDesc,
    });
  }

  res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
});
```

#### **Step 5.3: Client-Side Payment Integration**

```typescript
// services/payment.service.ts

import { functions } from './firebase.config';

export async function processPayment(
  phoneNumber: string,
  amount: number,
  requestId: string
): Promise<{ success: boolean; checkoutRequestID?: string }> {
  try {
    const initiatePayment = functions().httpsCallable('initiatePayment');
    
    const result = await initiatePayment({
      phoneNumber: formatPhoneNumber(phoneNumber), // Ensure +254 format
      amount,
      requestId,
    });

    return result.data;
  } catch (error) {
    console.error('Payment initiation error:', error);
    throw error;
  }
}

function formatPhoneNumber(phone: string): string {
  // Convert 0712345678 to 254712345678
  if (phone.startsWith('0')) {
    return '254' + phone.slice(1);
  }
  if (phone.startsWith('+254')) {
    return phone.slice(1);
  }
  return phone;
}
```

---

### **Phase 6: Push Notifications (Week 6)**

#### **Step 6.1: Firebase Cloud Messaging Setup**

**Installation:**

```bash
npx expo install expo-notifications
npm install @react-native-firebase/messaging
```

**Configuration:**

**A. Request Permissions (App.tsx):**

```typescript
import * as Notifications from 'expo-notifications';

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status !== 'granted') {
    alert('Push notification permissions required');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // Save token to Firestore
  await firestore()
    .collection('users')
    .doc(auth().currentUser.uid)
    .update({
      fcmToken: token,
    });
}
```

**B. Notification Handler:**

```typescript
// services/notification.service.ts

import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Listen for notifications
export function setupNotificationListeners(navigation) {
  // Notification received while app is open
  Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // User tapped notification
  Notifications.addNotificationResponseReceivedListener(response => {
    const { requestId } = response.notification.request.content.data;
    
    if (requestId) {
      navigation.navigate('TrackingScreen', { requestId });
    }
  });
}
```

**C. Server-Side Notifications (Cloud Functions):**

```typescript
// functions/src/notifications.ts

import * as admin from 'firebase-admin';

export async function sendProviderNotification(
  providerId: string,
  title: string,
  body: string,
  data: any
) {
  // Get provider's FCM token
  const providerDoc = await admin.firestore()
    .collection('providers')
    .doc(providerId)
    .get();

  const fcmToken = providerDoc.data()?.fcmToken;

  if (!fcmToken) {
    console.error('Provider has no FCM token');
    return;
  }

  // Send notification
  await admin.messaging().send({
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'emergency_requests',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  });
}

// Trigger on new request
export const onRequestCreated = functions.firestore
  .document('requests/{requestId}')
  .onCreate(async (snapshot, context) => {
    const request = snapshot.data();
    
    // Find nearest providers
    // ... matching logic
    
    // Notify all nearby providers
    const notifications = nearbyProviders.map(provider =>
      sendProviderNotification(
        provider.id,
        'New Service Request',
        `${request.serviceType} request ${request.distance}km away`,
        {
          requestId: snapshot.id,
          serviceType: request.serviceType,
        }
      )
    );

    await Promise.all(notifications);
  });
```

---

### **Phase 7: Provider App Development (Week 7-8)**

#### **Step 7.1: Provider App Structure**

**Separate React Native Project or Unified Codebase?**

**Recommendation:** Unified codebase with role-based navigation

```typescript
// App.tsx (Unified approach)

const App = () => {
  const [userRole, setUserRole] = useState<'customer' | 'provider' | null>(null);

  useEffect(() => {
    // Check user role from Firestore
    const checkUserRole = async () => {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const providerDoc = await firestore().collection('providers').doc(user.uid).get();
        
        setUserRole(providerDoc.exists ? 'provider' : 'customer');
      }
    };
    
    checkUserRole();
  }, []);

  if (!userRole) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {userRole === 'customer' ? <CustomerNavigator /> : <ProviderNavigator />}
    </NavigationContainer>
  );
};
```

#### **Step 7.2: Key Provider Screens**

**A. Provider Dashboard:**

```typescript
// screens/provider/ProviderDashboard.tsx

// Features:
// - Online/Offline toggle (large, prominent)
// - Today's stats (earnings, services, rating)
// - Incoming request alerts
// - Heat map of high-demand areas
// - Quick navigation to active service
```

**B. Request Alert Screen:**

```typescript
// screens/provider/RequestAlert.tsx

// Features:
// - Service type and details
// - Customer location (distance from provider)
// - Estimated earnings
// - Customer rating
// - Accept/Decline buttons (20-second timer)
// - Auto-decline countdown
```

**C. Active Service Screen:**

```typescript
// screens/provider/ActiveService.tsx

// Features:
// - Customer contact (call/message)
// - Navigation to customer location
// - Service checklist
// - Photo upload
// - Arrival confirmation button
// - Service completion form
```

---

### **Phase 8: Testing & Quality Assurance (Week 9-10)**

#### **Step 8.1: Unit Testing**

**Setup Jest + React Native Testing Library:**

```bash
npm install --save-dev @testing-library/react-native jest
```

**Test Coverage Areas:**

- Authentication flows
- Service matching algorithm
- Payment processing
- Location tracking
- Notification handling

#### **Step 8.2: Integration Testing**

**Critical User Flows to Test:**

1. Complete service request (customer → provider → payment)
2. Real-time tracking accuracy
3. M-Pesa payment success/failure
4. Provider matching under load
5. Notification delivery

#### **Step 8.3: Beta Testing**

**Pilot Program:**

- 50 customer testers (Nairobi CBD)
- 20 provider testers (mixed service types)
- 2-week testing period
- Feedback collection via in-app surveys

---

## 🛠️ Development Environment Setup

### **Required Tools**

1. **Node.js** (v18 or later)
2. **Expo CLI:** `npm install -g expo-cli`
3. **Firebase CLI:** `npm install -g firebase-tools`
4. **EAS CLI** (for builds): `npm install -g eas-cli`
5. **Xcode** (macOS - for iOS development)
6. **Android Studio** (for Android development)

### **Development Accounts Required**

1. **Google Cloud Console Account**
    
    - Firebase project creation
    - Cloud Functions deployment
    - Maps API key
2. **Safaricom Developer Account**
    
    - Daraja API credentials
    - M-Pesa testing shortcode
3. **Apple Developer Account** ($99/year)
    
    - iOS app deployment
    - Push notification certificates
4. **Google Play Console Account** ($25 one-time)
    
    - Android app deployment

---

## 📊 Database Migration Strategy

### **From Current State to Production**

**Current:** All data is stored in component state (ephemeral)

**Target:** Persistent Firebase storage

**Migration Steps:**

1. **Map Current State to Firestore:**

```typescript
// Current Dashboard state → Firestore mapping

Dashboard State              →    Firestore Collection
─────────────────────────────────────────────────────────
stage: string                →    requests/{id}.status
selectedService: string      →    requests/{id}.serviceType
serviceDetails: object       →    requests/{id}.serviceDetails
notifications: array         →    users/{id}/notifications subcollection
orderHistory: array          →    requests collection (where userId = currentUser)
driverProgress: number       →    activeRequests/{id}/providerLocation (Realtime DB)
```

2. **Create Migration Scripts:**

```typescript
// scripts/migrate-mock-data.ts

// Purpose: Create sample data for testing
// - Generate 50 test users
// - Generate 20 test providers
// - Create 100 historical requests
// - Populate with realistic Kenyan locations
```

---

## 🎨 UI/UX Migration Checklist

### **Components to Convert**

**From Web (current) → Mobile (target):**

|Web Component|Mobile Equivalent|Library/Approach|
|---|---|---|
|`<div>`|`<View>`|React Native core|
|`<span>`, `<p>`|`<Text>`|React Native core|
|`<input>`|`<TextInput>`|React Native core|
|`<button>`|`<TouchableOpacity>`|React Native core|
|CSS hover|`onPress`|Touch handling|
|Tailwind classes|StyleSheet or NativeWind|Styling system|
|Google Maps embed|`<MapView>`|react-native-maps|
|Modal|`<Modal>`|React Native core|

### **Navigation Migration**

**Current:** Single page with conditional rendering

**Target:** React Navigation stack

```typescript
// navigation/CustomerStack.tsx

import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export const CustomerNavigator = () => (
  <Stack.Navigator 
    initialRouteName="Dashboard"
    screenOptions={{
      headerStyle: { backgroundColor: '#0F0F0F' },
      headerTintColor: '#FFD60A',
    }}
  >
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="ServiceSelect" component={ServiceSelectScreen} />
    <Stack.Screen name="LocationConfirm" component={LocationConfirmScreen} />
    <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
    <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
    <Stack.Screen name="TrackingScreen" component={TrackingScreen} />
    <Stack.Screen name="CompletionScreen" component={CompletionScreen} />
    <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
    <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
  </Stack.Navigator>
);
```

---

## 🔐 Security Implementation

### **Critical Security Measures**

1. **Firestore Security Rules:**

```javascript
// firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Providers can read their own profile
    match /providers/{providerId} {
      allow read: if request.auth != null && request.auth.uid == providerId;
      allow write: if false; // Only admin/cloud functions can write
    }
    
    // Service requests
    match /requests/{requestId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        resource.data.providerId == request.auth.uid
      );
      allow update: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        resource.data.providerId == request.auth.uid
      );
    }
  }
}
```

2. **Cloud Functions Security:**

```typescript
// Validate all requests
export const secureFunction = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }
  
  // Validate input
  if (!data.requestId || typeof data.requestId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid request ID'
    );
  }
  
  // Check authorization
  const requestDoc = await admin.firestore()
    .collection('requests')
    .doc(data.requestId)
    .get();
    
  if (requestDoc.data()?.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Not authorized to access this request'
    );
  }
  
  // Proceed with function logic
});
```

3. **API Key Protection:**

```typescript
// Never expose API keys in client code
// Use Firebase Remote Config or Cloud Functions

// Good: Server-side API calls
export const serverSideAPICall = functions.https.onCall(async (data, context) => {
  const apiKey = functions.config().external.api_key;
  // Use apiKey securely
});

// Bad: Client-side exposure
// const apiKey = "sk_live_abc123"; // NEVER DO THIS
```

---

## 📱 Mobile-Specific Considerations

### **Performance Optimization**

1. **Image Optimization:**

```typescript
// Use optimized image formats
import { Image } from 'react-native';
import FastImage from 'react-native-fast-image';

// For static images
<Image source={require('./assets/logo.png')} />

// For remote images (with caching)
<FastImage
  source={{ uri: profilePhotoURL, priority: FastImage.priority.high }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

2. **Lazy Loading:**

```typescript
// Load screens only when needed
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const OrderHistoryScreen = lazy(() => import('./screens/OrderHistoryScreen'));
```

3. **Memory Management:**

```typescript
// Proper cleanup in useEffect
useEffect(() => {
  const unsubscribe = firestore()
    .collection('requests')
    .where('userId', '==', userId)
    .onSnapshot(handleSnapshot);
  
  return () => unsubscribe(); // Clean up listener
}, [userId]);
```

### **Offline Support**

```typescript
// Enable Firestore offline persistence
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

// Check network status
import NetInfo from '@react-native-community/netinfo';

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (!state.isConnected) {
      showOfflineAlert();
    }
  });
  
  return () => unsubscribe();
}, []);
```

---

## 🚀 Deployment Strategy

### **Phase 1: Staging Environment**

**Setup Firebase Staging Project:**

```bash
firebase projects:create resq-staging
firebase use resq-staging
firebase deploy --only functions,firestore
```

**EAS Build Configuration:**

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

### **Phase 2: Beta Deployment**

**iOS TestFlight:**

```bash
eas build --platform ios --profile preview
eas submit --platform ios --latest
```

**Android Internal Testing:**

```bash
eas build --platform android --profile preview
eas submit --platform android --latest
```

### **Phase 3: Production Release**

**Pre-launch Checklist:**

- [ ] All security rules tested
- [ ] M-Pesa production credentials configured
- [ ] Push notifications working on both platforms
- [ ] Location tracking accurate within 10 meters
- [ ] Payment flow tested with real transactions
- [ ] App Store/Play Store listings prepared
- [ ] Privacy policy and terms of service published
- [ ] Customer support system ready
- [ ] Monitoring and analytics configured

**Production Build:**

```bash
# iOS
eas build --platform ios --profile production
eas submit --platform ios

# Android
eas build --platform android --profile production
eas submit --platform android
```

---

## 📈 Monitoring & Analytics

### **Firebase Analytics Events**

```typescript
// analytics/events.ts

import analytics from '@react-native-firebase/analytics';

// Track service requests
export async function logServiceRequest(serviceType: string) {
  await analytics().logEvent('service_request', {
    service_type: serviceType,
    timestamp: Date.now(),
  });
}

// Track payment completion
export async function logPaymentComplete(amount: number, method: string) {
  await analytics().logEvent('purchase', {
    value: amount,
    currency: 'KES',
    payment_method: method,
  });
}

// Track provider matching
export async function logProviderMatched(distance: number, responseTime: number) {
  await analytics().logEvent('provider_matched', {
    distance_km: distance,
    response_time_seconds: responseTime,
  });
}
```

### **Performance Monitoring**

```typescript
// Setup Firebase Performance
import perf from '@react-native-firebase/perf';

// Monitor critical operations
async function matchProvider(serviceType: string, location: GeoPoint) {
  const trace = await perf().startTrace('provider_matching');
  
  try {
    const providers = await findNearestProviders(serviceType, location);
    trace.putMetric('providers_found', providers.length);
    return providers;
  } finally {
    await trace.stop();
  }
}
```

### **Crashlytics**

```typescript
import crashlytics from '@react-native-firebase/crashlytics';

// Log errors
try {
  await processPayment();
} catch (error) {
  crashlytics().recordError(error);
  throw error;
}

// Add custom logs
crashlytics().log('User initiated service request');
```

---

## 🎯 Success Metrics (KPIs)

### **Technical Metrics**

- **App Performance:**
    
    - App launch time: < 2 seconds
    - Screen transition: < 300ms
    - Location accuracy: ± 10 meters
    - Provider matching time: < 5 seconds
- **Reliability:**
    
    - App crash rate: < 0.1%
    - API success rate: > 99.5%
    - Payment success rate: > 98%
    - Push notification delivery: > 95%

### **Business Metrics**

- **Customer Metrics:**
    
    - Daily Active Users (DAU)
    - Service request completion rate
    - Average time to provider match
    - Customer retention rate (30-day)
- **Provider Metrics:**
    
    - Provider acceptance rate
    - Average response time
    - Services completed per provider per day
    - Provider retention rate
- **Financial Metrics:**
    
    - Gross Merchandise Value (GMV)
    - Take rate (platform fee %)
    - Customer Acquisition Cost (CAC)
    - Lifetime Value (LTV)

---

## 🔄 Continuous Integration/Deployment

### **GitHub Actions Workflow**

```yaml
# .github/workflows/build.yml

name: Build and Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build-android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform android --profile preview --non-interactive

  build-ios:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform ios --profile preview --non-interactive
```

---

## 📚 Documentation Requirements

### **Developer Documentation**

1. **Setup Guide** (`docs/SETUP.md`)
2. **Architecture Overview** (`docs/ARCHITECTURE.md`)
3. **API Documentation** (`docs/API.md`)
4. **Firebase Structure** (`docs/DATABASE.md`)
5. **Contributing Guidelines** (`docs/CONTRIBUTING.md`)

### **User Documentation**

1. **Customer App User Guide**
2. **Provider App User Guide**
3. **FAQ**
4. **Troubleshooting Guide**

---

## 🎓 Learning Resources

### **Required Knowledge Areas**

1. **React Native:**
    
    - [Official Docs](https://reactnative.dev/docs/getting-started)
    - [Expo Documentation](https://docs.expo.dev/)
2. **Firebase:**
    
    - [Firebase for React Native](https://rnfirebase.io/)
    - [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
    - [Cloud Functions Guide](https://firebase.google.com/docs/functions)
3. **Google Maps:**
    
    - [React Native Maps](https://github.com/react-native-maps/react-native-maps)
    - [Google Maps SDK](https://developers.google.com/maps)
4. **M-Pesa Integration:**
    
    - [Daraja API Documentation](https://developer.safaricom.co.ke/docs)

---

## 🚨 Critical Blockers & Risks

### **Technical Risks**

1. **Real-time Location Accuracy:**
    
    - **Risk:** GPS inaccuracy in urban canyons
    - **Mitigation:** Implement Google's Fused Location Provider, use WiFi triangulation
2. **M-Pesa API Reliability:**
    
    - **Risk:** Daraja API downtime or rate limiting
    - **Mitigation:** Implement retry logic, queue failed payments, provide manual verification option
3. **Provider Matching Algorithm:**
    
    - **Risk:** No providers available in area
    - **Mitigation:** Gradual radius expansion (5km → 10km → 15km), show estimated wait time
4. **Battery Drain (Provider App):**
    
    - **Risk:** Continuous GPS tracking drains battery
    - **Mitigation:** Optimize location update frequency, use significant location changes, provide low-power mode

### **Business Risks**

1. **Provider Onboarding:**
    
    - **Risk:** Insufficient providers at launch
    - **Mitigation:** Pre-launch provider recruitment, competitive incentives, partnerships with existing towing companies
2. **Regulatory Compliance:**
    
    - **Risk:** Licensing requirements for emergency services
    - **Mitigation:** Legal consultation, obtain necessary permits, insurance coverage
3. **Competition:**
    
    - **Risk:** Existing players or new entrants
    - **Mitigation:** Focus on superior UX, comprehensive service offering, strong brand

---

## ✅ Final Checklist for IDX Migration

### **Before Starting Development:**

- [ ] Firebase project created (staging + production)
- [ ] Safaricom Daraja developer account obtained
- [ ] Google Maps API key generated
- [ ] Apple Developer account active
- [ ] Google Play Console account active
- [ ] All API credentials stored securely
- [ ] Team access permissions configured
- [ ] Version control repository initialized

### **During Development:**

- [ ] Authentication flow implemented and tested
- [ ] Database schema finalized and deployed
- [ ] Provider matching algorithm working
- [ ] Real-time tracking accurate
- [ ] M-Pesa integration tested (sandbox)
- [ ] Push notifications delivering reliably
- [ ] UI matches design system (Voltage Premium)
- [ ] Both customer and provider apps functional
- [ ] Security rules properly configured
- [ ] Performance monitoring active

### **Before Launch:**

- [ ] Beta testing completed
- [ ] All critical bugs resolved
- [ ] M-Pesa production credentials configured
- [ ] App Store/Play Store submissions approved
- [ ] Customer support channels ready
- [ ] Marketing materials prepared
- [ ] Terms of service and privacy policy published
- [ ] Analytics and monitoring configured
- [ ] Backup and disaster recovery plan in place

---

## 🎯 Summary for IDX

**Project:** ResQ - Emergency Roadside & Medical Assistance  
**Current State:** React web prototype with simulated logic  
**Target State:** Production React Native app with Firebase backend  
**Timeline:** 10-12 weeks  
**Key Technologies:** React Native, Expo, Firebase Suite, M-Pesa/Daraja API

**Primary Focus Areas:**

1. Authentication (Phone/OTP)
2. Real-time location tracking
3. Provider matching algorithm
4. M-Pesa payment integration
5. Dual-app ecosystem (customer + provider)

**Critical Success Factors:**

- Sub-5-second provider matching
- 98%+ payment success rate
- Real-time tracking accuracy within 10m
- 24/7 uptime and reliability

---

**This document provides complete context for Antigravity to begin development. All architectural decisions, technical requirements, and implementation details are documented above.** 🚀