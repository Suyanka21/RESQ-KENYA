/**
 * ResQ Kenya — Firestore security-rules tests.
 *
 * Phase 3 (Backend Stabilization) coverage:
 *   B-CRIT-2  payment_requests are server-only (no client write)
 *   B-CRIT-3  requests are server-only (no client create/update)
 *   B-CRIT-4  providers cannot mutate requests outside the callable
 *   B-HIGH-7  providers cannot self-promote verificationStatus or
 *             write earnings/escrow/geohash/availability
 *
 * Run via: `npm run test:rules` (which wraps
 *   `firebase emulators:exec --only firestore,database`).
 *
 * Source:  https://firebase.google.com/docs/rules/unit-tests
 *          https://firebase.google.com/docs/firestore/security/rules-conditions
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
    initializeTestEnvironment,
    assertSucceeds,
    assertFails,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { setDoc, doc, updateDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const PROJECT_ID = 'resq-kenya-rules-test';

let env: RulesTestEnvironment;

beforeAll(async () => {
    env = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
            host: '127.0.0.1',
            port: 8080,
        },
    });
});

afterAll(async () => {
    if (env) await env.cleanup();
});

beforeEach(async () => {
    await env.clearFirestore();
});

const CUSTOMER = 'customer-1';
const PROVIDER = 'provider-1';
const OTHER = 'someone-else';

/* ------------------------------------------------------------------ */
/*  payment_requests — B-CRIT-2                                        */
/* ------------------------------------------------------------------ */

describe('payment_requests rules (B-CRIT-2)', () => {
    it('client cannot pre-create a fake-paid row', async () => {
        const ctx = env.authenticatedContext(CUSTOMER);
        const ref = doc(ctx.firestore(), 'payment_requests/idem-fake-1234567');
        await assertFails(setDoc(ref, {
            userId: CUSTOMER,
            status: 'completed',
            amount: 1000,
        }));
    });

    it('client cannot create even with own userId + initiating', async () => {
        const ctx = env.authenticatedContext(CUSTOMER);
        const ref = doc(ctx.firestore(), 'payment_requests/idem-attempt-12345');
        await assertFails(setDoc(ref, {
            userId: CUSTOMER,
            status: 'initiating',
            amount: 1000,
        }));
    });

    it('client cannot update an existing row to completed', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'payment_requests/idem-existing-1234'), {
                userId: CUSTOMER,
                status: 'pending',
                amount: 1000,
            });
        });
        const ctx = env.authenticatedContext(CUSTOMER);
        await assertFails(updateDoc(
            doc(ctx.firestore(), 'payment_requests/idem-existing-1234'),
            { status: 'completed' }
        ));
    });

    it('owner CAN read their own payment_requests row', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'payment_requests/idem-read-12345'), {
                userId: CUSTOMER,
                status: 'completed',
                amount: 500,
            });
        });
        const ctx = env.authenticatedContext(CUSTOMER);
        await assertSucceeds(getDoc(doc(ctx.firestore(), 'payment_requests/idem-read-12345')));
    });

    it('non-owner cannot read someone else’s payment_requests row', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'payment_requests/idem-read-22222'), {
                userId: CUSTOMER,
                status: 'completed',
                amount: 500,
            });
        });
        const ctx = env.authenticatedContext(OTHER);
        await assertFails(getDoc(doc(ctx.firestore(), 'payment_requests/idem-read-22222')));
    });
});

/* ------------------------------------------------------------------ */
/*  requests — B-CRIT-3 / B-CRIT-4                                     */
/* ------------------------------------------------------------------ */

describe('requests rules (B-CRIT-3 / B-CRIT-4)', () => {
    it('client cannot create a request directly', async () => {
        const ctx = env.authenticatedContext(CUSTOMER);
        await assertFails(setDoc(doc(ctx.firestore(), 'requests/req-1'), {
            userId: CUSTOMER,
            status: 'pending',
            serviceType: 'towing',
        }));
    });

    it('client cannot self-assign a provider on create', async () => {
        const ctx = env.authenticatedContext(PROVIDER);
        await assertFails(setDoc(doc(ctx.firestore(), 'requests/req-self'), {
            userId: CUSTOMER,
            providerId: PROVIDER,
            status: 'accepted',
            serviceType: 'towing',
        }));
    });

    it('assigned provider cannot mutate pricing.total directly', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'requests/req-2'), {
                userId: CUSTOMER,
                providerId: PROVIDER,
                status: 'accepted',
                pricing: { total: 5000 },
            });
        });
        const ctx = env.authenticatedContext(PROVIDER);
        await assertFails(updateDoc(
            doc(ctx.firestore(), 'requests/req-2'),
            { 'pricing.total': 99999 }
        ));
    });

    it('customer cannot self-cancel directly (must go through callable)', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'requests/req-cancel'), {
                userId: CUSTOMER,
                status: 'pending',
            });
        });
        const ctx = env.authenticatedContext(CUSTOMER);
        await assertFails(updateDoc(
            doc(ctx.firestore(), 'requests/req-cancel'),
            { status: 'cancelled' }
        ));
    });

    it('customer CAN read their own request', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'requests/req-read'), {
                userId: CUSTOMER,
                status: 'pending',
            });
        });
        const ctx = env.authenticatedContext(CUSTOMER);
        await assertSucceeds(getDoc(doc(ctx.firestore(), 'requests/req-read')));
    });

    it('any authed provider CAN read pending requests (for matching)', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'requests/req-pending'), {
                userId: CUSTOMER,
                status: 'pending',
            });
        });
        const ctx = env.authenticatedContext(PROVIDER);
        await assertSucceeds(getDoc(doc(ctx.firestore(), 'requests/req-pending')));
    });

    it('non-assigned provider cannot read accepted request', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'requests/req-priv'), {
                userId: CUSTOMER,
                providerId: PROVIDER,
                status: 'accepted',
            });
        });
        const ctx = env.authenticatedContext(OTHER);
        await assertFails(getDoc(doc(ctx.firestore(), 'requests/req-priv')));
    });

    it('client cannot delete a request', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'requests/req-del'), {
                userId: CUSTOMER,
                status: 'pending',
            });
        });
        const ctx = env.authenticatedContext(CUSTOMER);
        await assertFails(deleteDoc(doc(ctx.firestore(), 'requests/req-del')));
    });
});

/* ------------------------------------------------------------------ */
/*  providers — B-HIGH-7                                               */
/* ------------------------------------------------------------------ */

describe('providers rules (B-HIGH-7)', () => {
    it('cannot self-create with verificationStatus="verified"', async () => {
        const ctx = env.authenticatedContext(PROVIDER);
        await assertFails(setDoc(doc(ctx.firestore(), `providers/${PROVIDER}`), {
            displayName: 'Foo',
            verificationStatus: 'verified',
        }));
    });

    it('CAN self-create with verificationStatus="pending"', async () => {
        const ctx = env.authenticatedContext(PROVIDER);
        await assertSucceeds(setDoc(doc(ctx.firestore(), `providers/${PROVIDER}`), {
            displayName: 'Foo',
            verificationStatus: 'pending',
        }));
    });

    it('cannot self-promote to verificationStatus="verified"', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), `providers/${PROVIDER}`), {
                displayName: 'Foo',
                verificationStatus: 'pending',
            });
        });
        const ctx = env.authenticatedContext(PROVIDER);
        await assertFails(updateDoc(
            doc(ctx.firestore(), `providers/${PROVIDER}`),
            { verificationStatus: 'verified' }
        ));
    });

    it('cannot inflate own earnings', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), `providers/${PROVIDER}`), {
                displayName: 'Foo',
                verificationStatus: 'pending',
                earnings: { allTime: 0 },
            });
        });
        const ctx = env.authenticatedContext(PROVIDER);
        await assertFails(updateDoc(
            doc(ctx.firestore(), `providers/${PROVIDER}`),
            { 'earnings.allTime': 999999 }
        ));
    });

    it('cannot flip availability.isOnline directly', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), `providers/${PROVIDER}`), {
                displayName: 'Foo',
                verificationStatus: 'pending',
                availability: { isOnline: false },
            });
        });
        const ctx = env.authenticatedContext(PROVIDER);
        await assertFails(updateDoc(
            doc(ctx.firestore(), `providers/${PROVIDER}`),
            { 'availability.isOnline': true }
        ));
    });

    it('CAN update presentation fields (displayName, fcmToken)', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), `providers/${PROVIDER}`), {
                displayName: 'Foo',
                verificationStatus: 'pending',
            });
        });
        const ctx = env.authenticatedContext(PROVIDER);
        await assertSucceeds(updateDoc(
            doc(ctx.firestore(), `providers/${PROVIDER}`),
            { displayName: 'Bar', fcmToken: 'tok-123' }
        ));
    });

    it('cannot impersonate another provider', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), `providers/${PROVIDER}`), {
                displayName: 'Foo',
                verificationStatus: 'pending',
            });
        });
        const ctx = env.authenticatedContext(OTHER);
        await assertFails(updateDoc(
            doc(ctx.firestore(), `providers/${PROVIDER}`),
            { displayName: 'hacked' }
        ));
    });
});

/* ------------------------------------------------------------------ */
/*  default-deny                                                       */
/* ------------------------------------------------------------------ */

describe('default-deny safety net', () => {
    it('unknown collection writes are denied', async () => {
        const ctx = env.authenticatedContext(CUSTOMER);
        await assertFails(setDoc(doc(ctx.firestore(), 'random_collection/x'), { a: 1 }));
    });

    it('unauthenticated users cannot read users/{uid}', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), `users/${CUSTOMER}`), { displayName: 'Foo' });
        });
        const ctx = env.unauthenticatedContext();
        await assertFails(getDoc(doc(ctx.firestore(), `users/${CUSTOMER}`)));
    });
});
