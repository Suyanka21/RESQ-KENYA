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

describe('activeRequests rules', () => {
    it('customer can read their own active request', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await set(ref(ctx.database(), 'activeRequests/req-1'), {
                customerId: CUSTOMER,
                providerId: PROVIDER,
            });
        });
        const ctx = env.authenticatedContext(CUSTOMER);
        await assertSucceeds(get(ref(ctx.database(), 'activeRequests/req-1')));
    });

    it('assigned provider can read the active request', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await set(ref(ctx.database(), 'activeRequests/req-2'), {
                customerId: CUSTOMER,
                providerId: PROVIDER,
            });
        });
        const ctx = env.authenticatedContext(PROVIDER);
        await assertSucceeds(get(ref(ctx.database(), 'activeRequests/req-2')));
    });

    it('unrelated user cannot read the active request', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await set(ref(ctx.database(), 'activeRequests/req-3'), {
                customerId: CUSTOMER,
                providerId: PROVIDER,
            });
        });
        const ctx = env.authenticatedContext(OTHER);
        await assertFails(get(ref(ctx.database(), 'activeRequests/req-3')));
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

describe('providerLocations rules', () => {
    it('provider can write their own broadcast doc', async () => {
        const ctx = env.authenticatedContext(PROVIDER);
        await assertSucceeds(set(ref(ctx.database(), `providerLocations/${PROVIDER}`), {
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
});

describe('default-deny', () => {
    it('writes to unknown root keys fail', async () => {
        const ctx = env.authenticatedContext(CUSTOMER);
        await assertFails(set(ref(ctx.database(), 'someOtherPath/x'), { a: 1 }));
    });
});
