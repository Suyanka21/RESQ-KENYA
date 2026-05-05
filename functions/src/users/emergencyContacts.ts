/**
 * ResQ Kenya - Emergency contacts subcollection callables (Phase 5).
 *
 * Skills: API-and-Interface-Design, Security-and-Hardening,
 * Source-Driven-Development.
 *
 * Subcollection layout:
 *   users/{uid}/emergency_contacts/{contactId}
 *     {
 *       name: string,
 *       phone: string (E.164),
 *       relationship?: string,
 *       order: number, // for display ordering
 *       createdAt, updatedAt: Timestamp,
 *     }
 *
 * The phone number is normalised to the +254... E.164 form on write so
 * downstream SMS senders don't need to re-parse user input.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { ok, err, CallResult } from '../shared/api';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

interface ContactInput {
    name: string;
    phone: string;
    relationship?: string;
    order?: number;
}

type ContactErrorCode =
    | 'unauthenticated'
    | 'invalid_input'
    | 'not_found'
    | 'internal'
    | 'limit_exceeded';

const MAX_CONTACTS = 5;

function normalisePhone(input: string): string | null {
    const digits = input.replace(/\D/g, '');
    let formatted = digits;
    if (digits.startsWith('0')) formatted = '254' + digits.slice(1);
    else if (!digits.startsWith('254')) formatted = '254' + digits;
    if (!/^254(7|1)\d{8}$/.test(formatted)) return null;
    return '+' + formatted;
}

/**
 * Validate a full contact payload (used by `addEmergencyContact`). Every
 * field is required and the phone is normalised to E.164.
 */
function validateContact(data: unknown): ContactInput | { errorCode: 'invalid_input'; message: string } {
    if (!data || typeof data !== 'object') {
        return { errorCode: 'invalid_input', message: 'Contact data is required' };
    }
    const c = data as Record<string, unknown>;
    if (typeof c.name !== 'string' || c.name.trim().length < 2) {
        return { errorCode: 'invalid_input', message: 'name must be at least 2 characters' };
    }
    if (typeof c.phone !== 'string') {
        return { errorCode: 'invalid_input', message: 'phone is required' };
    }
    const normalised = normalisePhone(c.phone);
    if (!normalised) return { errorCode: 'invalid_input', message: 'phone must be a valid Kenyan mobile number' };
    if (c.relationship !== undefined && typeof c.relationship !== 'string') {
        return { errorCode: 'invalid_input', message: 'relationship must be a string' };
    }
    if (c.order !== undefined && (typeof c.order !== 'number' || c.order < 0)) {
        return { errorCode: 'invalid_input', message: 'order must be a non-negative number' };
    }
    return {
        name: c.name.trim(),
        phone: normalised,
        relationship: c.relationship as string | undefined,
        order: c.order as number | undefined,
    };
}

/**
 * Validate a partial contact patch (used by `updateEmergencyContact`).
 * Only the fields the caller actually wants to change need to be present;
 * unknown / undefined fields are dropped. CodeRabbit PR #3, comment 13.
 */
function validateContactPatch(
    data: unknown
): Partial<ContactInput> | { errorCode: 'invalid_input'; message: string } {
    if (!data || typeof data !== 'object') {
        return { errorCode: 'invalid_input', message: 'Contact patch is required' };
    }
    const c = data as Record<string, unknown>;
    const patch: Partial<ContactInput> = {};
    if (c.name !== undefined) {
        if (typeof c.name !== 'string' || c.name.trim().length < 2) {
            return { errorCode: 'invalid_input', message: 'name must be at least 2 characters' };
        }
        patch.name = c.name.trim();
    }
    if (c.phone !== undefined) {
        if (typeof c.phone !== 'string') {
            return { errorCode: 'invalid_input', message: 'phone must be a string' };
        }
        const normalised = normalisePhone(c.phone);
        if (!normalised) return { errorCode: 'invalid_input', message: 'phone must be a valid Kenyan mobile number' };
        patch.phone = normalised;
    }
    if (c.relationship !== undefined) {
        if (typeof c.relationship !== 'string') {
            return { errorCode: 'invalid_input', message: 'relationship must be a string' };
        }
        patch.relationship = c.relationship;
    }
    if (c.order !== undefined) {
        if (typeof c.order !== 'number' || c.order < 0) {
            return { errorCode: 'invalid_input', message: 'order must be a non-negative number' };
        }
        patch.order = c.order;
    }
    if (Object.keys(patch).length === 0) {
        return { errorCode: 'invalid_input', message: 'no updatable fields supplied' };
    }
    return patch;
}

export const addEmergencyContact = functions.https.onCall(
    async (data: unknown, context): Promise<CallResult<{ contactId: string }, ContactErrorCode>> => {
        if (!context.auth) return err('unauthenticated', 'Sign in required');
        const validated = validateContact(data);
        if ('errorCode' in validated) return err(validated.errorCode, validated.message);
        const uid = context.auth.uid;
        try {
            const colRef = db.collection('users').doc(uid).collection('emergency_contacts');
            const newRef = colRef.doc();
            // Atomic count-and-create. CodeRabbit PR #3, comment 12: a
            // count() outside a transaction lets two concurrent calls
            // both observe count===4 and each write a 5th doc. Inside a
            // transaction Firestore serializes the count read against
            // the create, so MAX_CONTACTS is enforced exactly.
            const result = await db.runTransaction(async (tx): Promise<
                { kind: 'ok'; order: number } | { kind: 'limit' }
            > => {
                const countSnap = await tx.get(colRef.count());
                const current = countSnap.data().count;
                if (current >= MAX_CONTACTS) {
                    return { kind: 'limit' };
                }
                tx.set(newRef, {
                    ...validated,
                    order: validated.order ?? current,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                return { kind: 'ok', order: current };
            });
            if (result.kind === 'limit') {
                return err('limit_exceeded', `You can store at most ${MAX_CONTACTS} emergency contacts`);
            }
            return ok({ contactId: newRef.id });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('addEmergencyContact error:', message);
            return err('internal', 'Failed to add contact');
        }
    }
);

export const updateEmergencyContact = functions.https.onCall(
    async (data: unknown, context): Promise<CallResult<{ contactId: string }, ContactErrorCode>> => {
        if (!context.auth) return err('unauthenticated', 'Sign in required');
        if (!data || typeof data !== 'object' || typeof (data as { contactId?: unknown }).contactId !== 'string') {
            return err('invalid_input', 'contactId is required');
        }
        const { contactId, ...rest } = data as { contactId: string } & Record<string, unknown>;
        // Partial updates: validate only the fields the caller actually
        // sent. CodeRabbit PR #3, comment 13.
        const validated = validateContactPatch(rest);
        if ('errorCode' in validated) return err(validated.errorCode, validated.message);
        const uid = context.auth.uid;
        try {
            const ref = db.collection('users').doc(uid).collection('emergency_contacts').doc(contactId);
            const snap = await ref.get();
            if (!snap.exists) return err('not_found', 'Contact not found');
            await ref.update({
                ...validated,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return ok({ contactId });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('updateEmergencyContact error:', message);
            return err('internal', 'Failed to update contact');
        }
    }
);

export const deleteEmergencyContact = functions.https.onCall(
    async (data: unknown, context): Promise<CallResult<{ contactId: string }, ContactErrorCode>> => {
        if (!context.auth) return err('unauthenticated', 'Sign in required');
        if (!data || typeof data !== 'object' || typeof (data as { contactId?: unknown }).contactId !== 'string') {
            return err('invalid_input', 'contactId is required');
        }
        const { contactId } = data as { contactId: string };
        const uid = context.auth.uid;
        try {
            const ref = db.collection('users').doc(uid).collection('emergency_contacts').doc(contactId);
            const snap = await ref.get();
            if (!snap.exists) return err('not_found', 'Contact not found');
            await ref.delete();
            return ok({ contactId });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('deleteEmergencyContact error:', message);
            return err('internal', 'Failed to delete contact');
        }
    }
);
