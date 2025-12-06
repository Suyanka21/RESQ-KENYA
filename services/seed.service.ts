// ResQ Kenya - Database Seeding Script
// Run this to populate Firestore with sample providers and test data

import {
    collection,
    doc,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';
import * as geofire from 'geofire-common';
import { db } from '../config/firebase';
import { COLLECTIONS } from './firestore.service';

// Nairobi CBD coordinates
const NAIROBI_CBD = { lat: -1.2921, lng: 36.8219 };

// Sample Nairobi locations
const NAIROBI_LOCATIONS = [
    { name: 'Westlands', lat: -1.2673, lng: 36.8114 },
    { name: 'Karen', lat: -1.3184, lng: 36.7115 },
    { name: 'Kilimani', lat: -1.2875, lng: 36.7844 },
    { name: 'Kasarani', lat: -1.2223, lng: 36.8993 },
    { name: 'South B', lat: -1.3103, lng: 36.8441 },
    { name: 'Embakasi', lat: -1.3233, lng: 36.9118 },
    { name: 'Lavington', lat: -1.2747, lng: 36.7680 },
    { name: 'Ngong Road', lat: -1.2978, lng: 36.7639 },
    { name: 'Thika Road', lat: -1.2192, lng: 36.8884 },
    { name: 'Mombasa Road', lat: -1.3278, lng: 36.8517 },
];

// Sample provider data
const SAMPLE_PROVIDERS = [
    {
        displayName: 'John\'s Towing Services',
        phoneNumber: '+254700000001',
        serviceTypes: ['towing'],
        vehicle: { type: 'Tow Truck', licensePlate: 'KCA 123A', capacity: '3 tons' },
        rating: 4.8,
        totalServices: 156,
    },
    {
        displayName: 'Quick Fix Mechanics',
        phoneNumber: '+254700000002',
        serviceTypes: ['tire', 'battery', 'diagnostics'],
        vehicle: { type: 'Service Van', licensePlate: 'KCB 456B', capacity: 'N/A' },
        rating: 4.6,
        totalServices: 234,
    },
    {
        displayName: 'Fuel Express Kenya',
        phoneNumber: '+254700000003',
        serviceTypes: ['fuel'],
        vehicle: { type: 'Fuel Delivery Truck', licensePlate: 'KCC 789C', capacity: '500L' },
        rating: 4.7,
        totalServices: 89,
    },
    {
        displayName: 'Nairobi Auto Rescue',
        phoneNumber: '+254700000004',
        serviceTypes: ['towing', 'tire', 'battery'],
        vehicle: { type: 'Recovery Truck', licensePlate: 'KCD 012D', capacity: '5 tons' },
        rating: 4.9,
        totalServices: 312,
    },
    {
        displayName: 'Emergency Medical Kenya',
        phoneNumber: '+254700000005',
        serviceTypes: ['ambulance'],
        vehicle: { type: 'Ambulance', licensePlate: 'KCE 345E', capacity: '2 patients' },
        rating: 4.95,
        totalServices: 567,
    },
    {
        displayName: 'Road Angel Services',
        phoneNumber: '+254700000006',
        serviceTypes: ['tire', 'battery', 'fuel'],
        vehicle: { type: 'Service Van', licensePlate: 'KCF 678F', capacity: 'N/A' },
        rating: 4.5,
        totalServices: 178,
    },
    {
        displayName: 'Safari Tow Kenya',
        phoneNumber: '+254700000007',
        serviceTypes: ['towing', 'diagnostics'],
        vehicle: { type: 'Flatbed Tow Truck', licensePlate: 'KCG 901G', capacity: '4 tons' },
        rating: 4.7,
        totalServices: 145,
    },
    {
        displayName: 'City Ambulance Services',
        phoneNumber: '+254700000008',
        serviceTypes: ['ambulance'],
        vehicle: { type: 'Advanced Life Support Ambulance', licensePlate: 'KCH 234H', capacity: '1 patient' },
        rating: 4.85,
        totalServices: 423,
    },
];

/**
 * Seed sample providers to Firestore
 */
export async function seedProviders(): Promise<void> {
    console.log('🌱 Starting provider seeding...\n');

    for (let i = 0; i < SAMPLE_PROVIDERS.length; i++) {
        const provider = SAMPLE_PROVIDERS[i];
        const location = NAIROBI_LOCATIONS[i % NAIROBI_LOCATIONS.length];

        // Add slight randomization to location
        const lat = location.lat + (Math.random() - 0.5) * 0.02;
        const lng = location.lng + (Math.random() - 0.5) * 0.02;

        const providerId = `provider_${i + 1}`;
        const geohash = geofire.geohashForLocation([lat, lng]);

        const providerData = {
            id: providerId,
            ...provider,
            verificationStatus: 'verified',
            availability: {
                isOnline: Math.random() > 0.3, // 70% chance online
                currentLocation: { latitude: lat, longitude: lng },
                lastUpdated: serverTimestamp(),
            },
            geohash,
            earnings: {
                today: Math.floor(Math.random() * 5000),
                thisWeek: Math.floor(Math.random() * 25000),
                thisMonth: Math.floor(Math.random() * 80000),
                allTime: Math.floor(Math.random() * 500000) + 100000,
            },
            documents: {
                driverLicense: 'verified',
                vehicleRegistration: 'verified',
                insurance: 'verified',
            },
            createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, COLLECTIONS.PROVIDERS, providerId), providerData);

        console.log(`✅ Created provider: ${provider.displayName} (${location.name})`);
    }

    console.log('\n🎉 Provider seeding complete!');
}

/**
 * Seed sample user for testing
 */
export async function seedTestUser(): Promise<void> {
    console.log('🌱 Creating test user...\n');

    const testUserId = 'test_user_1';

    const userData = {
        id: testUserId,
        phoneNumber: '+254712345678',
        displayName: 'Test User',
        email: 'test@resq.ke',
        membership: 'basic',
        loyaltyPoints: 250,
        vehicles: [
            {
                make: 'Toyota',
                model: 'Corolla',
                year: 2018,
                licensePlate: 'KBZ 123X',
                fuelType: 'petrol',
                isPrimary: true,
            },
        ],
        emergencyContacts: [
            {
                name: 'Jane Doe',
                phone: '+254723456789',
                relationship: 'Spouse',
            },
        ],
        savedLocations: [
            {
                name: 'Home',
                address: 'Kilimani, Nairobi',
                coordinates: { latitude: -1.2875, longitude: 36.7844 },
            },
            {
                name: 'Work',
                address: 'Westlands, Nairobi',
                coordinates: { latitude: -1.2673, longitude: 36.8114 },
            },
        ],
        createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTIONS.USERS, testUserId), userData);

    console.log('✅ Created test user: Test User (+254712345678)\n');
}

/**
 * Seed sample completed requests for history
 */
export async function seedSampleRequests(): Promise<void> {
    console.log('🌱 Creating sample request history...\n');

    const services = ['towing', 'tire', 'battery', 'fuel', 'diagnostics'];
    const statuses = ['completed', 'completed', 'completed', 'cancelled'];

    for (let i = 0; i < 5; i++) {
        const requestId = `request_sample_${i + 1}`;
        const location = NAIROBI_LOCATIONS[i];
        const serviceType = services[i % services.length];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        const geohash = geofire.geohashForLocation([location.lat, location.lng]);

        const requestData = {
            id: requestId,
            userId: 'test_user_1',
            providerId: `provider_${(i % 4) + 1}`,
            serviceType,
            status,
            customerLocation: {
                coordinates: { latitude: location.lat, longitude: location.lng },
                address: `${location.name}, Nairobi`,
            },
            geohash,
            pricing: {
                baseServiceFee: 1500 + Math.floor(Math.random() * 2000),
                distanceFee: Math.floor(Math.random() * 500),
                additionalCharges: 0,
                platformFee: 150,
                tip: Math.random() > 0.7 ? Math.floor(Math.random() * 500) : 0,
                total: 0,
            },
            timeline: {
                requestedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000), // Past days
                acceptedAt: status !== 'cancelled' ? new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 + 180000) : null,
                arrivedAt: status === 'completed' ? new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 + 600000) : null,
                completedAt: status === 'completed' ? new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 + 1800000) : null,
            },
            payment: {
                method: 'mpesa',
                status: status === 'completed' ? 'completed' : 'failed',
            },
            rating: status === 'completed' && Math.random() > 0.3 ? {
                stars: 4 + Math.floor(Math.random() * 2),
                review: 'Great service!',
            } : null,
            createdAt: serverTimestamp(),
        };

        // Calculate total
        requestData.pricing.total =
            requestData.pricing.baseServiceFee +
            requestData.pricing.distanceFee +
            requestData.pricing.platformFee +
            requestData.pricing.tip;

        await setDoc(doc(db, COLLECTIONS.REQUESTS, requestId), requestData);

        console.log(`✅ Created request: ${serviceType} - ${status} (${location.name})`);
    }

    console.log('\n🎉 Sample requests created!');
}

/**
 * Run all seed functions
 */
export async function seedAll(): Promise<void> {
    console.log('🚀 Starting database seeding...\n');
    console.log('='.repeat(50) + '\n');

    try {
        await seedProviders();
        console.log('\n' + '-'.repeat(50) + '\n');

        await seedTestUser();
        console.log('-'.repeat(50) + '\n');

        await seedSampleRequests();
        console.log('\n' + '='.repeat(50));
        console.log('\n✅ All seeding complete!\n');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

// Export utility for running from console
if (typeof window !== 'undefined') {
    (window as any).seedDatabase = seedAll;
    (window as any).seedProviders = seedProviders;
    (window as any).seedTestUser = seedTestUser;
    console.log('🔧 Database seeding functions available:');
    console.log('   - seedDatabase() - Seed all data');
    console.log('   - seedProviders() - Seed providers only');
    console.log('   - seedTestUser() - Seed test user only');
}
