// ResQ Kenya - Push Notifications Service
// Handles FCM registration, permissions, and notification handling

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from './firestore.service';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Notification types for ResQ
export type NotificationType =
    | 'request_accepted'
    | 'provider_enroute'
    | 'provider_arrived'
    | 'service_completed'
    | 'payment_received'
    | 'new_request'        // For providers
    | 'request_cancelled'
    | 'promo'
    | 'general';

export interface ResQNotification {
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
        console.warn('Notifications require a physical device');
        return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
        return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

/**
 * Get the Expo push token for this device
 */
export async function getExpoPushToken(): Promise<string | null> {
    try {
        if (!Device.isDevice) {
            console.warn('Push tokens require a physical device');
            return null;
        }

        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            console.warn('Notification permissions not granted');
            return null;
        }

        // Get Expo push token
        const { data: token } = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        });

        console.log('Expo Push Token:', token);
        return token;
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }
}

/**
 * Register device for push notifications and save token to Firestore
 */
export async function registerForPushNotifications(
    userId: string,
    isProvider: boolean = false
): Promise<void> {
    try {
        const token = await getExpoPushToken();

        if (!token) {
            console.warn('No push token available');
            return;
        }

        // Save token to user/provider profile
        const collection = isProvider ? COLLECTIONS.PROVIDERS : COLLECTIONS.USERS;
        const docRef = doc(db, collection, userId);

        await updateDoc(docRef, {
            fcmToken: token,
            notificationsEnabled: true,
            tokenUpdatedAt: new Date(),
        });

        console.log('Push token saved to Firestore');
    } catch (error) {
        console.error('Error registering for notifications:', error);
    }
}

/**
 * Configure notification channels for Android
 */
export async function setupNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
        // High priority channel for service updates
        await Notifications.setNotificationChannelAsync('service-updates', {
            name: 'Service Updates',
            description: 'Updates about your service requests',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FFD60A',
            sound: 'default',
        });

        // Emergency channel
        await Notifications.setNotificationChannelAsync('emergency', {
            name: 'Emergency Alerts',
            description: 'Critical emergency notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 250, 500],
            lightColor: '#FF3D3D',
            sound: 'default',
        });

        // Provider channel (for new requests)
        await Notifications.setNotificationChannelAsync('new-requests', {
            name: 'New Service Requests',
            description: 'Notifications for new service requests',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FFD60A',
            sound: 'default',
        });

        // Promotional channel
        await Notifications.setNotificationChannelAsync('promotions', {
            name: 'Promotions & Updates',
            description: 'Special offers and app updates',
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: 'default',
        });
    }
}

/**
 * Schedule a local notification (for testing or local alerts)
 */
export async function scheduleLocalNotification(
    notification: ResQNotification,
    delaySeconds: number = 0
): Promise<string> {
    const channelId = getChannelForType(notification.type);

    return await Notifications.scheduleNotificationAsync({
        content: {
            title: notification.title,
            body: notification.body,
            data: {
                type: notification.type,
                ...notification.data
            },
            sound: 'default',
            ...(Platform.OS === 'android' && { channelId }),
        },
        trigger: delaySeconds > 0
            ? { seconds: delaySeconds, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL }
            : null,
    });
}

/**
 * Get notification channel for type
 */
function getChannelForType(type: NotificationType): string {
    switch (type) {
        case 'new_request':
            return 'new-requests';
        case 'promo':
            return 'promotions';
        case 'request_accepted':
        case 'provider_enroute':
        case 'provider_arrived':
        case 'service_completed':
        case 'payment_received':
        case 'request_cancelled':
            return 'service-updates';
        default:
            return 'default';
    }
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Remove notification listener
 */
export function removeNotificationListener(subscription: Notifications.Subscription): void {
    subscription.remove();
}

/**
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
    await setBadgeCount(0);
}

// Demo notifications for testing
export const DEMO_NOTIFICATIONS: Record<NotificationType, ResQNotification> = {
    request_accepted: {
        type: 'request_accepted',
        title: '🚗 Provider Found!',
        body: "John's Towing Services has accepted your request",
    },
    provider_enroute: {
        type: 'provider_enroute',
        title: '🚛 Provider En Route',
        body: 'Your service provider is on the way. ETA: 12 mins',
    },
    provider_arrived: {
        type: 'provider_arrived',
        title: '📍 Provider Arrived',
        body: 'Your service provider has arrived at your location',
    },
    service_completed: {
        type: 'service_completed',
        title: '✅ Service Completed',
        body: 'Your service has been completed. Rate your experience!',
    },
    payment_received: {
        type: 'payment_received',
        title: '💰 Payment Received',
        body: 'We received your payment of KES 2,500. Thank you!',
    },
    new_request: {
        type: 'new_request',
        title: '🔔 New Request Nearby!',
        body: 'Towing service needed in Westlands. 2.5km away.',
    },
    request_cancelled: {
        type: 'request_cancelled',
        title: '❌ Request Cancelled',
        body: 'Your service request has been cancelled',
    },
    promo: {
        type: 'promo',
        title: '🎉 Special Offer!',
        body: 'Get 20% off your next service with code RESQ20',
    },
    general: {
        type: 'general',
        title: 'ResQ Update',
        body: 'You have a new message',
    },
};
