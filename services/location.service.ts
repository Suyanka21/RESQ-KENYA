// ResQ Kenya - Location Service
// Handles device location tracking using expo-location

import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { GeoLocation } from '../types';

// Nairobi default coordinates (CBD)
export const NAIROBI_DEFAULT: GeoLocation = {
    latitude: -1.2921,
    longitude: 36.8219,
    heading: 0,
    speed: 0,
};

// Location tracking options
const TRACKING_OPTIONS: Location.LocationOptions = {
    accuracy: Location.Accuracy.High,
    timeInterval: 5000, // Update every 5 seconds
    distanceInterval: 10, // Update every 10 meters
};

const BACKGROUND_TRACKING_OPTIONS: Location.LocationTaskOptions = {
    accuracy: Location.Accuracy.High,
    timeInterval: 10000,
    distanceInterval: 20,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
        notificationTitle: 'ResQ Location',
        notificationBody: 'Tracking your location for service delivery',
        notificationColor: '#FFD60A',
    },
};

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            console.warn('Foreground location permission denied');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error requesting location permission:', error);
        return false;
    }
}

/**
 * Request background location permission (for providers)
 */
export async function requestBackgroundLocationPermission(): Promise<boolean> {
    try {
        // First ensure foreground permission is granted
        const foregroundGranted = await requestLocationPermission();
        if (!foregroundGranted) return false;

        const { status } = await Location.requestBackgroundPermissionsAsync();

        if (status !== 'granted') {
            console.warn('Background location permission denied');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error requesting background location permission:', error);
        return false;
    }
}

/**
 * Get current device location
 */
export async function getCurrentLocation(): Promise<GeoLocation> {
    try {
        const hasPermission = await requestLocationPermission();

        if (!hasPermission) {
            console.warn('No location permission, returning default');
            return NAIROBI_DEFAULT;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading || 0,
            speed: location.coords.speed || 0,
            timestamp: location.timestamp,
        };
    } catch (error) {
        console.error('Error getting current location:', error);
        return NAIROBI_DEFAULT;
    }
}

/**
 * Start watching location updates
 */
export async function startLocationUpdates(
    onLocationUpdate: (location: GeoLocation) => void
): Promise<Location.LocationSubscription | null> {
    try {
        const hasPermission = await requestLocationPermission();

        if (!hasPermission) {
            console.warn('No location permission');
            return null;
        }

        const subscription = await Location.watchPositionAsync(
            TRACKING_OPTIONS,
            (location) => {
                onLocationUpdate({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    heading: location.coords.heading || 0,
                    speed: location.coords.speed || 0,
                    timestamp: location.timestamp,
                });
            }
        );

        return subscription;
    } catch (error) {
        console.error('Error starting location updates:', error);
        return null;
    }
}

/**
 * Stop location updates
 */
export function stopLocationUpdates(subscription: Location.LocationSubscription): void {
    subscription.remove();
}

/**
 * Geocode address to coordinates
 */
export async function geocodeAddress(address: string): Promise<GeoLocation | null> {
    try {
        const results = await Location.geocodeAsync(address);

        if (results.length > 0) {
            return {
                latitude: results[0].latitude,
                longitude: results[0].longitude,
            };
        }

        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
    latitude: number,
    longitude: number
): Promise<string> {
    try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });

        if (results.length > 0) {
            const { street, city, district, subregion } = results[0];
            const parts = [street, district || subregion, city].filter(Boolean);
            return parts.join(', ') || 'Unknown location';
        }

        return 'Unknown location';
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return 'Unknown location';
    }
}

/**
 * Check if location services are enabled
 */
export async function isLocationEnabled(): Promise<boolean> {
    try {
        return await Location.hasServicesEnabledAsync();
    } catch (error) {
        console.error('Error checking location services:', error);
        return false;
    }
}

/**
 * Calculate bearing between two points
 */
export function calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    const bearing = Math.atan2(y, x);
    return (toDeg(bearing) + 360) % 360;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

function toDeg(rad: number): number {
    return rad * (180 / Math.PI);
}
