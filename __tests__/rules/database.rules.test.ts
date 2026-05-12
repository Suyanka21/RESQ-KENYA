/**
 * ResQ Kenya — Realtime Database security-rules tests.
 *
 * Phase 3 (B-LOW-5) coverage:
 *   - default-deny at the root
 *   - activeRequests/{id}: read-only for the customer or assigned
 *     provider, no client writes
 *   - providerLocations/{providerId}: only the provider may write
 *     their own broadcast doc; reads are server-only
 *
 * Run via: `npm run test:rules`.
 *
 * Source:  https://firebase.google.com/docs/rules/unit-tests
 *          https://firebase.google.com/docs/database/security
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
    initializeTestEnvironment,
    assertSucceeds,
    assertFails,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { ref, set, get } from 'firebase/database';
// Import the canonical seed-node builder used by the production trigger.
// Seeding the rules tests with the same shape closes the gap audit-v2
// §N-HIGH-8 / §X-2 flagged: the previous tests inlined a customerId
// field that production code did not actually write, exercising a state
// that did not exist (test confidence was structurally inflated).
import { buildActiveRequestSeed } from '../../functions/src/services/triggers';

const PROJECT_ID = 'resq-kenya-rtdb-rules-test';

let env: RulesTestEnvironment;

beforeAll(async () => {
    env = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        database: {
            rules: readFileSync(resolve(__dirname, '../../database.rules.json'), 'utf8'),
            host: '127.0.0.1',
            port: 9000,
        },
    });
});

afterAll(async () => {
    if (env) await env.cleanup();
});

beforeEach(async () => {
    await env.clearDatabase();
});

const CUSTOMER = 'customer-1';
const PROVIDER = 'provider-1';
const OTHER = 'someone-else';

/**
 * Seeds the RTDB through the *production* trigger's seed-node builder
 * so the rules tests assert against the same shape that the live
 * `onRequestStatusChange` trigger writes.
 */
function seedActiveRequest(
    env: RulesTestEnvironment,
    requestId: string,
    overrides: Partial<Parameters<typeof buildActiveRequestSeed>[0]> = {}
): Promise<void> {
    return env.withSecurityRulesDisabled(async (ctx) => {
        const seed = buildActiveRequestSeed({
            requestId,
            userId: CUSTOMER,
            providerId: PROVIDER,
            status: 'accepted',
            ...overrides,
        });
        await set(ref(ctx.database(), `activeRequests/${requestId}`), seed);
    });
}

describe('activeRequests rules (seeded via production builder — audit-v2 §N-HIGH-8)', () => {
    it('customer can read their own active request', async () => {
        await seedActiveRequest(env, 'req-1');
        const ctx = env.authenticatedContext(CUSTOMER);
        await assertSucceeds(get(ref(ctx.database(), 'activeRequests/req-1')));
    });

    it('assigned provider can read the active request', async () => {
        await seedActiveRequest(env, 'req-2');
        const ctx = env.authenticatedContext(PROVIDER);
        await assertSucceeds(get(ref(ctx.database(), 'activeRequests/req-2')));
    });

    it('unrelated user cannot read the active request', async () => {
        await seedActiveRequest(env, 'req-3');
        const ctx = env.authenticatedContext(OTHER);
        await assertFails(get(ref(ctx.database(), 'activeRequests/req-3')));
    });

    it('audit-v2 §N-CRIT-2 regression: a seed without customerId denies the customer (rule predicate fails)', async () => {
        // Mirrors the broken pre-fix production state: trigger wrote no
        // customerId, so the rule's `customerId === auth.uid` check
        // failed and the customer's tracking listener was denied.
        await env.withSecurityRulesDisabled(async (ctx) => {
            await set(ref(ctx.database(), 'activeRequests/req-no-customer'), {
                requestId: 'req-no-customer',
                providerId: PROVIDER,
                status: 'accepted',
            });
        });
        const ctx = env.authenticatedContext(CUSTOMER);
        await assertFails(get(ref(ctx.database(), 'activeRequests/req-no-customer')));
    });

    it('client cannot write activeRequests directly', async () => {
        const ctx = env.authenticatedContext(PROVIDER);
        await assertFails(set(ref(ctx.database(), 'activeRequests/req-4'), {
            customerId: CUSTOMER,
            providerId: PROVIDER,
            providerLocation: { latitude: 0, longitude: 0 },
        }));
    });
});

describe('providerLocations rules (audit-v2 §N-HIGH-3 — locked to server-only)', () => {
    // Phase 4 (audit-v2 §N-HIGH-3): the legacy rule allowed an
    // authenticated user to write `providerLocations/{their-uid}`
    // directly from the client. RTDB rules cannot query Firestore
    // for `verificationStatus`, so an unverified provider could spoof
    // location updates. The recommended fix locks this branch
    // entirely; writes flow through the `setProviderAvailability` and
    // `updateProviderLocation` Cloud Functions which use the Admin
    // SDK and bypass these rules.

    it('provider cannot write to their own provider-location doc from the client', async () => {
        const ctx = env.authenticatedContext(PROVIDER);
        await assertFails(set(ref(ctx.database(), `providerLocations/${PROVIDER}`), {
            location: { latitude: -1.286, longitude: 36.817 },
            isOnline: true,
            lastSeen: Date.now(),
        }));
    });

    it('provider cannot impersonate another provider', async () => {
        const ctx = env.authenticatedContext(PROVIDER);
        await assertFails(set(ref(ctx.database(), `providerLocations/${OTHER}`), {
            location: { latitude: -1.286, longitude: 36.817 },
            isOnline: true,
            lastSeen: Date.now(),
        }));
    });

    it('provider cannot read another provider broadcast doc', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await set(ref(ctx.database(), `providerLocations/${OTHER}`), {
                location: { latitude: 0, longitude: 0 },
                isOnline: true,
                lastSeen: Date.now(),
            });
        });
        const ctx = env.authenticatedContext(PROVIDER);
        await assertFails(get(ref(ctx.database(), `providerLocations/${OTHER}`)));
    });

    it('provider cannot read their own provider-location doc either', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await set(ref(ctx.database(), `providerLocations/${PROVIDER}`), {
                location: { latitude: 0, longitude: 0 },
                isOnline: true,
                lastSeen: Date.now(),
            });
        });
        const ctx = env.authenticatedContext(PROVIDER);
        await assertFails(get(ref(ctx.database(), `providerLocations/${PROVIDER}`)));
    });
});

describe('default-deny', () => {
    it('writes to unknown root keys fail', async () => {
        const ctx = env.authenticatedContext(CUSTOMER);
        await assertFails(set(ref(ctx.database(), 'someOtherPath/x'), { a: 1 }));
    });
});
