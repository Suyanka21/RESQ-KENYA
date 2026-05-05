/**
 * ResQ Kenya - Vehicles subcollection callables (Phase 5).
 *
 * Skills: API-and-Interface-Design (typed CallResult contract per
 * callable), Security-and-Hardening (server-authoritative writes; users
 * can only mutate vehicles under their own users/{uid}/vehicles/* path),
 * Source-Driven-Development (Firestore subcollection rules per
 * https://firebase.google.com/docs/firestore/security/rules-structure).
 *
 * Subcollection layout:
 *   users/{uid}/vehicles/{vehicleId}
 *     {
 *       plate: string,
 *       make: string,
 *       model: string,
 *       year?: number,
 *       color?: string,
 *       isPrimary: boolean,
 *       createdAt: Timestamp,
 *       updatedAt: Timestamp,
 *     }
 *
 * The "primary vehicle" invariant is enforced server-side: marking one
 * vehicle as primary clears the flag on the user's other vehicles in
 * the same transaction.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { ok, err, CallResult } from '../shared/api';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

interface VehicleInput {
    plate: string;
    make: string;
    model: string;
    year?: number;
    color?: string;
    isPrimary?: boolean;
}

type VehicleErrorCode =
    | 'unauthenticated'
    | 'invalid_input'
    | 'not_found'
    | 'internal';

function validateVehicleInput(data: unknown): VehicleInput | { errorCode: 'invalid_input'; message: string } {
    if (!data || typeof data !== 'object') {
        return { errorCode: 'invalid_input', message: 'Vehicle data is required' };
    }
    const v = data as Record<string, unknown>;
    if (typeof v.plate !== 'string' || v.plate.length < 3 || v.plate.length > 16) {
        return { errorCode: 'invalid_input', message: 'plate must be 3-16 characters' };
    }
    if (typeof v.make !== 'string' || !v.make) {
        return { errorCode: 'invalid_input', message: 'make is required' };
    }
    if (typeof v.model !== 'string' || !v.model) {
        return { errorCode: 'invalid_input', message: 'model is required' };
    }
    if (v.year !== undefined && (typeof v.year !== 'number' || v.year < 1980 || v.year > 2100)) {
        return { errorCode: 'invalid_input', message: 'year must be between 1980 and 2100' };
    }
    if (v.color !== undefined && typeof v.color !== 'string') {
        return { errorCode: 'invalid_input', message: 'color must be a string' };
    }
    if (v.isPrimary !== undefined && typeof v.isPrimary !== 'boolean') {
        return { errorCode: 'invalid_input', message: 'isPrimary must be boolean' };
    }
    return {
        plate: v.plate.toUpperCase().replace(/\s+/g, ''),
        make: v.make,
        model: v.model,
        year: v.year as number | undefined,
        color: v.color as string | undefined,
        isPrimary: v.isPrimary as boolean | undefined,
    };
}

export const addVehicle = functions.https.onCall(
    async (data: unknown, context): Promise<CallResult<{ vehicleId: string }, VehicleErrorCode>> => {
        if (!context.auth) return err('unauthenticated', 'Sign in required');
        const validated = validateVehicleInput(data);
        if ('errorCode' in validated) return err(validated.errorCode, validated.message);
        const uid = context.auth.uid;
        try {
            const vehiclesRef = db.collection('users').doc(uid).collection('vehicles');
            const newRef = vehiclesRef.doc();
            await db.runTransaction(async (tx) => {
                if (validated.isPrimary) {
                    const existingPrimary = await tx.get(vehiclesRef.where('isPrimary', '==', true));
                    existingPrimary.forEach((doc) => tx.update(doc.ref, { isPrimary: false }));
                }
                tx.set(newRef, {
                    ...validated,
                    isPrimary: validated.isPrimary ?? false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
            return ok({ vehicleId: newRef.id });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('addVehicle error:', message);
            return err('internal', 'Failed to add vehicle');
        }
    }
);

export const updateVehicle = functions.https.onCall(
    async (data: unknown, context): Promise<CallResult<{ vehicleId: string }, VehicleErrorCode>> => {
        if (!context.auth) return err('unauthenticated', 'Sign in required');
        if (!data || typeof data !== 'object' || typeof (data as { vehicleId?: unknown }).vehicleId !== 'string') {
            return err('invalid_input', 'vehicleId is required');
        }
        const { vehicleId, ...rest } = data as { vehicleId: string } & Record<string, unknown>;
        const validated = validateVehicleInput(rest);
        if ('errorCode' in validated) return err(validated.errorCode, validated.message);
        const uid = context.auth.uid;
        try {
            const vehicleRef = db.collection('users').doc(uid).collection('vehicles').doc(vehicleId);
            await db.runTransaction(async (tx) => {
                const snap = await tx.get(vehicleRef);
                if (!snap.exists) throw new Error('not_found');
                if (validated.isPrimary) {
                    const others = await tx.get(
                        db.collection('users').doc(uid).collection('vehicles').where('isPrimary', '==', true)
                    );
                    others.forEach((doc) => {
                        if (doc.id !== vehicleId) tx.update(doc.ref, { isPrimary: false });
                    });
                }
                tx.update(vehicleRef, {
                    ...validated,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
            return ok({ vehicleId });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (message === 'not_found') return err('not_found', 'Vehicle not found');
            console.error('updateVehicle error:', message);
            return err('internal', 'Failed to update vehicle');
        }
    }
);

export const deleteVehicle = functions.https.onCall(
    async (data: unknown, context): Promise<CallResult<{ vehicleId: string }, VehicleErrorCode>> => {
        if (!context.auth) return err('unauthenticated', 'Sign in required');
        if (!data || typeof data !== 'object' || typeof (data as { vehicleId?: unknown }).vehicleId !== 'string') {
            return err('invalid_input', 'vehicleId is required');
        }
        const { vehicleId } = data as { vehicleId: string };
        const uid = context.auth.uid;
        try {
            const vehicleRef = db.collection('users').doc(uid).collection('vehicles').doc(vehicleId);
            const snap = await vehicleRef.get();
            if (!snap.exists) return err('not_found', 'Vehicle not found');
            await vehicleRef.delete();
            return ok({ vehicleId });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('deleteVehicle error:', message);
            return err('internal', 'Failed to delete vehicle');
        }
    }
);
