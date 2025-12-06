// ResQ Kenya - Type Definitions

import type { ServiceType } from '../theme/voltage-premium';

// User Types
export interface User {
    id: string;
    phoneNumber: string;
    displayName?: string;
    email?: string;
    profilePhoto?: string;
    createdAt: Date;
    membership: 'basic' | 'plus';
    loyaltyPoints: number;
    vehicles: Vehicle[];
    emergencyContacts: EmergencyContact[];
    savedLocations: SavedLocation[];
    fcmToken?: string;
}

export interface Vehicle {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    fuelType: 'petrol' | 'diesel' | 'electric';
    isPrimary: boolean;
}

export interface EmergencyContact {
    name: string;
    phone: string;
    relationship: string;
}

export interface SavedLocation {
    name: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
}

// Provider Types
export interface Provider {
    id: string;
    phoneNumber: string;
    displayName: string;
    serviceTypes: ServiceType[];
    rating: number;
    totalServices: number;
    verificationStatus: 'pending' | 'verified' | 'suspended';
    vehicle: {
        type: string;
        licensePlate: string;
        capacity?: string;
    };
    availability: {
        isOnline: boolean;
        currentLocation?: {
            latitude: number;
            longitude: number;
        };
        lastUpdated?: Date;
    };
    earnings: {
        today: number;
        thisWeek: number;
        thisMonth: number;
        allTime: number;
    };
    fcmToken?: string;
}

// Service Request Types
export type RequestStatus =
    | 'pending'
    | 'accepted'
    | 'enroute'
    | 'arrived'
    | 'inProgress'
    | 'completed'
    | 'cancelled';

export interface ServiceRequest {
    id: string;
    userId: string;
    providerId?: string;
    serviceType: ServiceType;
    status: RequestStatus;
    customerLocation: {
        coordinates: {
            latitude: number;
            longitude: number;
        };
        address: string;
        landmark?: string;
        instructions?: string;
    };
    serviceDetails: Record<string, any>;
    pricing: {
        baseServiceFee: number;
        distanceFee: number;
        additionalCharges: number;
        platformFee: number;
        tip: number;
        total: number;
    };
    timeline: {
        requestedAt: Date;
        acceptedAt?: Date;
        arrivedAt?: Date;
        completedAt?: Date;
    };
    payment: {
        method: 'mpesa' | 'card';
        status: 'pending' | 'processing' | 'completed' | 'failed';
        transactionId?: string;
        mpesaReceiptNumber?: string;
        checkoutRequestID?: string;
    };
    rating?: {
        stars: number;
        review?: string;
        tags?: string[];
    };
    photos?: string[];
}

// Location Types
export interface GeoLocation {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    timestamp?: number;
}

// Auth Context Types
export interface AuthState {
    user: User | null;
    provider: Provider | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    userRole: 'customer' | 'provider' | null;
}
