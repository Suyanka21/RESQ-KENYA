# Backend Impact Audit — Aligned with Frontend Changes

> **Companion document to** `docs/frontend_audit.md`.
> Scope: Firebase Cloud Functions (`functions/src/`), client services (`services/`),
> Firestore + Realtime Database schema, and Firestore security rules (`firestore.rules`).
> Goal: identify and fix backend gaps that will surface when the frontend audit
> changes land — before they break in production.

---

## 1. Overview

### 1.1 Current backend health vs new frontend direction

ResQ's backend today is a **mostly-functional Firebase stack** with Cloud Functions
for M‑Pesa STK push, service requests, provider location, medical dispatch, and
AI-assisted pricing/matching. It works for the current "simulation-heavy" React
Native prototype (`USE_DEMO_MODE = true` in `services/customer.service.ts:14`),
but the frontend audit pushes the product toward:

| Frontend direction (from `frontend_audit.md`)                               | Backend readiness |
| --------------------------------------------------------------------------- | ----------------- |
| A single, canonical service-booking flow (merging `[service].tsx` + `details.tsx`) | ⚠️ Partial — `createServiceRequest` exists but contract drifts between client shapes |
| Real (not simulated) live map + provider ETA                                 | ❌ Missing — RTDB `activeRequests` path is defined client-side only; no Cloud Function writes into it |
| Global SOS entry + canonical ambulance/emergency pipeline                    | ⚠️ Partial — `createEmergencyRequest` exists but is not wired from the customer tab bar; uses a different collection (`emergency_requests`) than `requests` |
| Digital wallet, service history, garage/vehicles, emergency contacts         | ⚠️ Partial — user doc has fields, but there is **no wallet/ledger**, **no vehicles sub-API**, **no emergency-contact SMS fan-out** |
| Accessible, localized (Swahili) UI + deterministic copy                      | ❌ Missing — backend-owned strings (FCM titles/bodies) are hardcoded English with emojis |
| Stronger primitives (Button/Input) + tests                                   | Out of scope (frontend-only) |

### 1.2 High-level summary of gaps

1. **API contract drift.** Three different `createServiceRequest` shapes co-exist
   (`services/firestore.service.ts:239`, `services/customer.service.ts:19`,
   `functions/src/services/requests.ts:21`). The frontend audit's push for a
   single canonical details screen will require a single canonical contract.
2. **Real-time is half-wired.** Frontend expects live provider position and ETA
   via `services/realtime.service.ts` (Realtime DB `activeRequests/{id}`), but no
   Cloud Function ever populates that node — only the client does. If a provider
   kills the app, the customer's ETA stops updating.
3. **Payments have dangling states.** `initiateStkPush` writes `payment_requests`
   keyed by `requestId`, but the STK Push call itself can fail after the document
   is written, leaving `pending` rows with no TTL and no retry. There is no idempotency
   key, no reconciliation job, no wallet ledger.
4. **Emergency pipeline is parallel, not unified.** Medical emergency requests
   live in `emergency_requests` (`functions/src/medical/dispatch.ts`), while
   regular service requests live in `requests`. The frontend audit's "global SOS
   entry" (`frontend_audit.md` Issue 26) cannot dispatch safely without a single
   authoritative collection or a clearly-versioned API surface.
5. **Security rules lag the feature set.** `firestore.rules` has no rules for
   `emergency_requests`, `medical_providers`, `hospitals`, `hospital_alerts`,
   `surge_zones`, `price_quotes`, `dispatch_predictions`, `dispatch_training_data`,
   or `notifications`. By default those collections will be **denied for clients**,
   which means the new UI screens that read them will silently fail.
6. **Copy and i18n are server-owned.** FCM notification bodies are hardcoded
   English ("Provider Found! 🎉", `functions/src/services/requests.ts:221`). The
   frontend audit's Swahili support (Issue 42) is impossible to deliver without
   moving copy server-side or accepting a locale argument.

The rest of this document is a detailed breakdown.

---

## 2. Frontend Changes Summary (translated into functional requirements)

Below, every meaningful change in `frontend_audit.md` is translated from UI/UX
language into a **backend functional requirement**. Cross-references to the
numbered frontend issues are preserved.

### 2.1 UI/UX changes → backend requirements

| FE Issue | UI/UX change                                                         | Backend functional requirement |
| -------- | -------------------------------------------------------------------- | ------------------------------ |
| #1       | Unify brand colour across theme + tailwind                           | None (FE only) |
| #10      | Merge `[service].tsx` duplicate flow into `details.tsx`              | **Single canonical booking contract** (`createServiceRequest`) with one typed input shape |
| #22      | Replace simulated dark map with real provider location               | Backend must **publish provider coordinates** into `activeRequests/{id}` during a live job, not rely on the client |
| #26      | Add a global SOS entry point                                          | Must expose a **single emergency endpoint** whose contract is independent of whether it is medical or mechanical |
| #29–33   | Accessibility (labels, focus, announcements)                         | FCM copy must be announce-safe (no emoji-only, no leading emoji) and must include a plain-text body |
| #34–36   | Performance (no blocking loops on dashboard)                         | Backend must provide a cheap "home summary" endpoint (nearby providers + active request) to avoid N client reads |
| #39      | Remove hardcoded mock data (history, wallet, notifications)          | Real endpoints for **history**, **wallet balance/ledger**, **notification feed** |
| #40–41   | Typed empty states, error states                                      | Backend must return **discriminated error shapes** (see §4 solution) |
| #42      | i18n (Swahili)                                                        | FCM + HTTP responses must accept `locale` and return localized strings, or return **opaque notification keys** that the client maps |
| #43–44   | Testing (only 2 FE test files)                                        | Backend needs emulator fixtures + contract tests for each Cloud Function |

### 2.2 New or modified user flows

1. **Unified booking flow** (FE Issue #10). One screen, one request:
   *select service → confirm location → confirm price quote → submit*. Backend
   impact: must accept a **pre-quoted price** (`quoteId`) and validate it server-side
   against `price_quotes` (already written by `getPriceQuote` at
   `functions/src/ai/pricing.ts:233`), then freeze that price on the `requests`
   doc.
2. **Global SOS** (FE Issue #26). One-tap emergency. Backend impact: a single
   `createEmergencyRequest` that either routes to `requests` (mechanical) or
   `emergency_requests` (medical) based on `emergencyType`, behind one callable.
3. **Real-time tracking** (FE Issue #22). Frontend subscribes to RTDB
   `activeRequests/{id}`. Backend impact: provider's `updateProviderLocation`
   must also write through to RTDB when the provider has an active request; a
   Firestore trigger on `requests` must seed and tear down the RTDB node.
4. **Service history** (FE Issue #39). Real `getRequestHistory`. Backend impact:
   the existing `customer.service.ts` function exists but **still returns mock
   data in demo mode**; that needs a real fallback plus pagination cursor.
5. **Wallet / service cost** (FE Issue #39). Frontend shows balance and tx list.
   Backend impact: **no wallet collection exists**. Needs `wallets/{userId}`,
   `wallet_transactions/{id}`, and top-up/debit Cloud Functions.
6. **Vehicles (garage)** (FE Issue #39). Today `addVehicle` rewrites the whole
   vehicles array inside `users/{id}` (`services/firestore.service.ts:77`).
   Backend impact: move to a subcollection `users/{id}/vehicles/{vehicleId}` to
   avoid read-modify-write races when multiple tabs/devices edit.
7. **Emergency contacts** (FE Issue #39). Same pattern — move from embedded
   array to subcollection, and add a Cloud Function that fans out SMS when an
   SOS is fired.

### 2.3 Component restructuring and removals

- **Removed:** duplicate `[service].tsx` booking screen. Backend impact: any
  Cloud Function assuming the `[service].tsx` request payload shape (there is
  none today, but tests must be written for the single survivor).
- **Removed:** simulated dark map. Backend impact: the demo-mode path in
  `customer.service.ts:84` that fakes provider stages must be **gated behind a
  feature flag**, not `USE_DEMO_MODE = true` hardcoded.
- **Added:** SOS entry, wallet tab, garage tab, emergency-contacts tab.
  Backend impact: new collections + rules (see §3.2).

### 2.4 New vs removed features (net delta)

| Added                                          | Removed                  |
| ---------------------------------------------- | ------------------------ |
| Global SOS entry                               | Duplicate booking screen |
| Real live-map tracking                         | Simulated map            |
| Wallet + ledger                                | Inline hardcoded history |
| Swahili copy                                   | Emoji-only FCM titles    |
| Pre-quoted pricing (`quoteId` freeze)          | Client-side price calc   |

---

## 3. Backend Impact Analysis

### 3.1 API mismatches

#### 3.1.1 Three overlapping `createServiceRequest` implementations

- `functions/src/services/requests.ts:21` — Cloud Function, server-authoritative.
- `services/firestore.service.ts:239` — client-side direct Firestore write.
- `services/customer.service.ts:19` — wrapper that **defaults to demo mode**.

The frontend audit's consolidation to a single `details.tsx` will route every
booking through one call site. With three server shapes, the chance of silent
field drift is very high (e.g. `serviceDetails` is optional in the CF, required
by some screens).

#### 3.1.2 Over-fetching on history and nearby requests

`services/provider.service.ts:135` subscribes to *all* pending requests, then
filters in memory by `serviceType`. With more providers, this cost scales
linearly per provider. No `where('serviceType', 'in', ...)` clause is applied.

#### 3.1.3 Under-fetching on "home"

The customer dashboard needs: current active request, online provider count by
service type, and wallet balance. Today the client makes **three separate
Firestore reads** and one RTDB subscription. There is no `getHomeSummary`
callable.

#### 3.1.4 Missing endpoints required by new UI

| Missing endpoint                         | Needed by FE screen                                  |
| ---------------------------------------- | ---------------------------------------------------- |
| `getWalletBalance` / `getWalletLedger`   | Wallet tab (FE #39)                                  |
| `topUpWallet` / `debitWallet`            | Wallet tab + payment fallback                        |
| `listVehicles` / `addVehicle` / `removeVehicle` (callable) | Garage tab                              |
| `listEmergencyContacts` / `notifyEmergencyContacts` | Emergency contacts tab, SOS flow          |
| `cancelServiceRequest` (callable, not just status mutation) | Cancel button during tracking   |
| `getHomeSummary`                         | Dashboard                                            |
| `getNotificationFeed`                    | Notifications tab                                    |
| `rateProvider` (callable; today it's a direct Firestore write) | Post-completion rating screen |

#### 3.1.5 Inconsistent response shapes

- `initiateStkPush` returns `{ success: true, checkoutRequestID, merchantRequestID }`.
- `createServiceRequest` returns `{ success: true, requestId }`.
- `findOptimalProvider` returns `{ success, data: prediction }` or `{ success:false, error, data:null }`.
- `recordDispatchOutcome` returns `{ success: true }` only.

Per `api-and-interface-design` §"Consistent Error Semantics", we want **one**
response envelope across every callable.

### 3.2 Data model gaps

#### 3.2.1 Schema drift between collections

| Frontend reads from                                      | Backend writes to                        | Drift |
| -------------------------------------------------------- | ---------------------------------------- | ----- |
| `requests/{id}` (mechanical + medical subscribe here)    | `emergency_requests/{id}` for medical    | Two collections, two schemas, one UI |
| `users/{id}.vehicles[]`                                  | Inline array via read-modify-write       | Races, 1MB doc ceiling |
| `requests/{id}.providerLocation` *and* RTDB `activeRequests/{id}/providerLocation` | Only CF updates Firestore; RTDB is client-only | Map shows stale data if client lags |
| `providers/{id}.earnings.{today,thisWeek,thisMonth,allTime}` | M-Pesa callback increments all 4        | "today/thisWeek/thisMonth" never reset — cumulative forever (`functions/src/mpesa/callback.ts:160`) |

#### 3.2.2 Missing fields

- `requests/{id}` has no `quoteId` linking the booking to the server's
  `price_quotes` record, so we cannot validate that the user was charged the
  quoted amount. (Today the price is whatever the client sends in `pricing`.)
- `users/{id}` has no `locale` field, so FCM cannot localize.
- `users/{id}` has no `walletBalance`/`walletVersion`.
- `providers/{id}` has no `offDutyUntil` (used by dashboard for "back at 5pm").
- `requests/{id}` has no `cancellationReason` or `cancelledBy`.

#### 3.2.3 Missing collections

- `wallets/{userId}` and `wallet_transactions/{txId}`.
- `user_notifications/{notifId}` (inbox for the notifications tab).
- `sos_events/{eventId}` — audit trail for SOS presses.
- `users/{id}/vehicles/{vehicleId}` (subcollection).
- `users/{id}/emergency_contacts/{contactId}` (subcollection).

#### 3.2.4 Missing Firestore rules for existing collections

`firestore.rules` covers users, providers, requests, payment_requests,
corporate_accounts, vehicles — but **not** `emergency_requests`,
`medical_providers`, `hospitals`, `hospital_alerts`, `surge_zones`,
`price_quotes`, `dispatch_predictions`, `dispatch_training_data`,
`medical_audit_logs`, `notifications`. The default-deny means any client code
added by the frontend audit that reads these will get `permission-denied`.

### 3.3 Service logic issues

#### 3.3.1 Race conditions

- `addVehicle`, `addEmergencyContact`, `addSavedLocation` all **read-then-write**
  the user doc (`services/firestore.service.ts:77–114`). Two devices editing in
  parallel will clobber each other's writes.
- `acceptServiceRequest` correctly uses a transaction
  (`functions/src/services/requests.ts:180`), but `updateRequestStatus` does
  not — a provider can set `status: 'completed'` on a cancelled request.

#### 3.3.2 Real-time handling is one-sided

- Customer expects live provider position via `subscribeToProviderLocation`
  (`services/realtime.service.ts:81`, reading RTDB `activeRequests/{id}`).
- No Cloud Function writes into RTDB. The provider client is expected to, via
  `startRequestTracking` / `updateProviderLocationRT`. If the provider's app
  backgrounds or crashes, the RTDB node goes stale silently.
- There is no `onDisconnect()` handler to flip a provider's "live" status when
  they lose connectivity.

#### 3.3.3 M-Pesa wallet + STK inconsistencies

- `initiateStkPush` writes `payment_requests/{requestId}` then makes the
  upstream HTTP call to Safaricom (`functions/src/mpesa/stkPush.ts:145`). If the
  HTTP call times out, the write is orphaned.
- No idempotency key: retrying the mobile app's call creates duplicate payment
  docs.
- Callback handler (`functions/src/mpesa/callback.ts`) **does not check**
  whether the payment was already reconciled — a replayed callback will
  increment provider earnings a second time (line 162–167).
- No wallet. All payments are "one STK push per request". The frontend audit's
  wallet tab has no backend counterpart.

#### 3.3.4 Provider earnings never reset

The M-Pesa callback increments `earnings.today`, `earnings.thisWeek`,
`earnings.thisMonth`, `earnings.allTime` with no scheduled reset
(`functions/src/mpesa/callback.ts:162`). After a month the "today" field is
meaningless.

#### 3.3.5 Random ETA

`functions/src/services/requests.ts:306` returns a random 8–20 min ETA. The
frontend's "Provider Found" notification displays this as truth.

#### 3.3.6 Demo mode hardcoded client-side

`services/customer.service.ts:14` has `USE_DEMO_MODE = true`. Any frontend
feature the audit adds will appear to work in demo but fail in production —
which is how regressions sneak in.

### 3.4 State & sync problems

#### 3.4.1 Frontend expects real-time; backend is request-based

- Notifications tab (FE #39): there is no server-maintained notification feed.
  FCM sends a push but nothing is persisted where the client can read it back
  on cold-start. The medical dispatch path *does* write to
  `notifications/{id}` (`functions/src/medical/dispatch.ts:251`), but the
  mechanical flow does not.
- Wallet balance: no real-time subscription point exists.

#### 3.4.2 Request lifecycle inconsistency

Statuses appear as `'pending' | 'accepted' | 'enroute' | 'arrived' | 'inProgress' | 'completed' | 'cancelled'`
in `functions/src/services/requests.ts:254`, but the client-side
`customer.service.ts:86` simulates `'pending' | 'accepted' | 'enroute' | 'arrived' | 'inProgress' | 'completed'`
(no `cancelled` in the simulation). Any FE audit change that adds a cancel
button will not line up with the simulated state machine.

#### 3.4.3 Surge zones race with price quotes

`getPriceQuote` reads `surge_zones/{zone}` and writes a `price_quotes/{id}` with
a 10-minute TTL (`functions/src/ai/pricing.ts:233`). `scheduledSurgeUpdate`
updates `surge_zones` every 5 min. If a user holds a quote past 5 min and the
surge changes, there is no mechanism to invalidate the quote — and nothing on
the booking path that checks `used` or `validUntil`.

### 3.5 Security and reliability risks

#### 3.5.1 Payment handling gaps

- No HMAC or source-IP check on the M-Pesa callback. Anyone who guesses the URL
  can POST a "success" payload and trigger provider earnings increments. Mitigation
  requires verifying the Safaricom callback IP or signing the callback via our
  own token in `AccountReference`.
- No idempotency on `initiateStkPush` (see §3.3.3).

#### 3.5.2 Race conditions in dispatch

- `notifyNearbyProviders` (`functions/src/services/requests.ts:84`) fans out to
  *all* providers within 15 km simultaneously. Whoever taps first wins via the
  `acceptServiceRequest` transaction. That is correct for a race, but there is
  no timeout — if no one accepts, the request sits `pending` forever with no
  background retry or widen-radius escalation.
- `assignMedicalProvider` (`functions/src/medical/dispatch.ts:196`) is **not** a
  transaction. Two dispatchers (or a dispatcher + an auto-assign) can accept the
  same emergency request and each sets the provider, with the second overwriting
  the first.

#### 3.5.3 Missing validation

- `createServiceRequest` does not validate that `pricing` matches a known
  `price_quotes/{id}`. A malicious client can submit `{ pricing: { total: 1 } }`.
- `updateRequestStatus` does not check that `context.auth.uid` matches
  `providerId` on the request — any authenticated user can move any request to
  any status.
- `setProviderAvailability` trusts the client's lat/lng without sanity-checking
  (e.g. within Kenya bounds).
- Phone-number formatting in `initiateStkPush` accepts any string and force-pads
  to `254` (`functions/src/mpesa/stkPush.ts:103`). An empty string becomes
  `254`, which Safaricom will bill.

#### 3.5.4 No rate limiting

Nothing prevents a user from spamming `createServiceRequest` or `initiateStkPush`,
each of which consumes paid Safaricom quota.

#### 3.5.5 Admin-only endpoints lack admin claims

`updateZoneSurge` checks `context.auth?.token?.admin` but there is no function
that *sets* the admin custom claim. Either this endpoint is unreachable, or
admin is silently `false` everywhere.

---

## 4. Detailed Fixes & Implementation Plan

Each fix below follows the pattern: **Problem → Why it breaks the system →
Proposed solution → Concrete implementation changes**. Solutions are shaped by
the attached `api-and-interface-design` skill (contract-first, one-version,
addition over modification, predictable naming, validate at boundaries) and by
the `Idea` skill (explore multiple framings, converge on the highest-leverage
option).

---

### Fix 1 — Collapse `createServiceRequest` to a single, versioned callable

**Problem.** Three shapes for the same operation (see §3.1.1). A unified
frontend flow will pick one and silently drift from the others.

**Why it breaks.** Hyrum's Law: the currently-unused shapes still exist and
will be called by some legacy screen. Any change to one leaks.

**Solution.** Keep `functions/src/services/requests.ts:createServiceRequest` as
the **only** write path. Delete (or gate behind admin) `firestore.service.ts:createServiceRequest`
and `customer.service.ts:createServiceRequest` demo branch. Define one input
TypeScript interface and share it between client and function via a
`packages/shared-types` (or an `export type CreateServiceRequestInput` in
`types/`).

**Implementation.**
1. Add `types/api.ts` exporting:
   ```ts
   export interface CreateServiceRequestInput {
       serviceType: ServiceType;
       customerLocation: { coordinates: GeoLocation; address: string; landmark?: string; instructions?: string };
       serviceDetails?: Record<string, unknown>;
       quoteId: string;           // required – must match price_quotes
       idempotencyKey: string;    // client UUID, dedup
   }
   export type CreateServiceRequestOutput =
       | { ok: true; requestId: string }
       | { ok: false; errorCode: 'invalid_quote' | 'quote_expired' | 'duplicate' | 'internal'; message: string };
   ```
2. Rewrite `functions/src/services/requests.ts:createServiceRequest` to:
   - Look up `price_quotes/{quoteId}`; reject if `used || Date.now() > validUntil.toMillis()`.
   - Upsert `requests/{requestId}` keyed by `hash(idempotencyKey + uid)` for dedup.
   - Mark the quote `used: true` in the same transaction.
3. Replace `services/firestore.service.ts:createServiceRequest` with a
   deprecation shim that throws in dev.
4. Remove `USE_DEMO_MODE` in `services/customer.service.ts`; gate demo behind
   `EXPO_PUBLIC_DEMO_MODE` env.

---

### Fix 2 — Wire real-time provider location through Cloud Functions

**Problem.** `updateProviderLocation` only writes Firestore; the customer-facing
map reads RTDB `activeRequests/{id}` which is maintained only by the provider
client (§3.3.2).

**Why it breaks.** Backgrounded providers → stale map → customer loses trust.
Any FE audit change that makes the map more prominent (Issue #22) makes the
failure more visible.

**Solution.** Make the Cloud Function the **single source of truth** for
real-time provider position during an active request. Mirror Firestore → RTDB.

**Implementation.**
1. In `functions/src/providers/location.ts:updateProviderLocation`, after
   updating Firestore, if `currentRequestId` is set, call:
   ```ts
   await admin.database().ref(`activeRequests/${currentRequestId}`).update({
       providerLocation: { latitude, longitude, heading, timestamp: Date.now() },
       lastUpdate: admin.database.ServerValue.TIMESTAMP,
   });
   ```
2. Add a Firestore `onUpdate` trigger on `requests/{id}`:
   - When status transitions `pending → accepted`: initialise the RTDB node.
   - When status transitions to `completed | cancelled`: `ref.remove()`.
3. Use `ref.onDisconnect().update({ providerStale: true })` when the provider
   client connects, so the customer can show "waiting for provider" if the
   provider drops.
4. Keep `services/realtime.service.ts` client API surface unchanged
   (Hyrum-safe).

---

### Fix 3 — Unify emergency + mechanical requests behind one callable

**Problem.** Two collections (`requests`, `emergency_requests`), two schemas,
two lifecycles (§3.2.1). The frontend audit's global SOS button (Issue #26)
must work without the app knowing which collection to subscribe to.

**Solution.** Introduce `createRequest` (generic) that dispatches internally by
`serviceType`. Write to one collection (`requests`) with
`emergencyPayload?: { triageLevel, patientCondition, ... }` as an optional
nested field. Keep the medical subcollection only for audit (HIPAA-style
compliance).

**Implementation.**
1. Add `functions/src/services/createRequest.ts`:
   ```ts
   export const createRequest = functions.https.onCall(async (data, ctx) => {
       assertAuth(ctx);
       if (data.serviceType === 'ambulance') {
           return handleEmergency(data, ctx);  // internal – writes to requests + medical_audit_logs
       }
       return handleMechanical(data, ctx);
   });
   ```
2. Migrate `emergency_requests/{id}` → `requests/{id}` with
   `emergencyPayload` field. Keep the audit subcollection
   `requests/{id}/medical_audit/{entryId}` (avoids cross-collection joins).
3. Update `firestore.rules` to gate `emergencyPayload` read on either
   `isOwner(userId)` or a provider with medical credentials.

---

### Fix 4 — Wallet + ledger

**Problem.** No wallet data model, but the new wallet tab depends on it (§3.2.3).

**Solution.** Introduce `wallets/{userId}` (balance + version for optimistic
lock) and `wallet_transactions/{id}` (append-only ledger). Cloud Functions are
the only writers.

**Implementation.**
1. New schema:
   ```ts
   // wallets/{userId}
   { balanceKes: number; version: number; updatedAt: Timestamp }
   // wallet_transactions/{id}
   { userId; type: 'topup'|'debit'|'refund'|'adjustment'; amountKes; requestId?; mpesaReceipt?; createdAt }
   ```
2. Cloud Functions:
   - `topUpWallet(amountKes)` → initiates STK push with `accountReference =
     wallet:${uid}`, then the callback credits the wallet in a transaction and
     appends a `wallet_transactions` row.
   - `debitWallet(requestId, amountKes)` → internal, called by
     `acceptServiceRequest` when the customer elects wallet-pay.
   - `getWalletLedger(cursor?, limit=20)` → paginated read.
3. Security rule: client-read-only on `wallets/{userId}` if `isOwner(userId)`;
   no client writes at all.

---

### Fix 5 — Idempotent, replay-safe M-Pesa

**Problem.** Orphaned payment rows, duplicate earnings increments, unverified
callback origin (§3.3.3, §3.5.1).

**Solution.**
1. Write `payment_requests/{idempotencyKey}` **before** the HTTP call, with
   `status: 'initiating'`. On HTTP success, update to `pending`; on HTTP
   failure, update to `failed`. A daily cron cleans up rows older than 1 h in
   `'initiating'`.
2. Callback must atomically transition `pending → completed` inside a
   Firestore transaction. If already `completed`, return 200 with
   `ResultDesc: 'already reconciled'` and do **not** increment earnings.
3. Verify callback IP is in Safaricom's published CIDR range (hardcode list,
   refresh quarterly) **or** embed a short-lived HMAC in `CallbackURL` path
   (`/mpesaCallback/:token`).
4. Reset daily/weekly/monthly earnings via `functions.pubsub.schedule('every day 00:00')`.

**Implementation sketch for the idempotency wrapper:**

```ts
export const initiateStkPush = functions.https.onCall(async (data, ctx) => {
    assertAuth(ctx);
    const { idempotencyKey, requestId, amount, phoneNumber } = validateInput(data);
    const docRef = db.collection('payment_requests').doc(idempotencyKey);
    await db.runTransaction(async tx => {
        const existing = await tx.get(docRef);
        if (existing.exists) throw new functions.https.HttpsError('already-exists', 'duplicate');
        tx.set(docRef, { status: 'initiating', requestId, amount, userId: ctx.auth!.uid, createdAt: FieldValue.serverTimestamp() });
    });
    // HTTP call...
});
```

---

### Fix 6 — Server-authored rating + status mutation (authorization)

**Problem.** `updateRequestStatus` lets any authenticated user move any
request to any status (§3.5.3).

**Solution.** Inside `updateRequestStatus`, load the request and assert
`context.auth.uid === request.providerId`. Also check allowed transitions via
a state-machine table.

**Implementation.**
```ts
const VALID_TRANSITIONS: Record<Status, Status[]> = {
    pending: ['accepted', 'cancelled'],
    accepted: ['enroute', 'cancelled'],
    enroute: ['arrived', 'cancelled'],
    arrived: ['inProgress', 'cancelled'],
    inProgress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};
```
Reject the call with `failed-precondition` if the transition is not allowed.
For ratings, expose `rateProvider(requestId, rating)` as a callable that checks
`request.userId === ctx.auth.uid && request.status === 'completed'` before
writing.

---

### Fix 7 — Price-quote freeze on booking

**Problem.** Frontend can submit arbitrary `pricing` fields; server never
validates (§3.5.3, §3.4.3).

**Solution.** Require `quoteId` on `createServiceRequest`. Reject if
`validUntil < now` or `used`. Atomically mark the quote `used: true` and copy
its `breakdown` onto the `requests/{id}` doc as the authoritative price.

**Implementation.** See `Fix 1` implementation step 2.

---

### Fix 8 — Firestore rules coverage for new collections

**Problem.** No rules for `emergency_requests`, `medical_providers`,
`hospitals`, `surge_zones`, `price_quotes`, `dispatch_predictions`,
`dispatch_training_data`, `notifications`, `wallets`, `wallet_transactions`
(§3.2.4).

**Solution.** Add explicit matches. Default-deny is correct *security* but
silent breakage is a *product* problem.

**Implementation (sketch, to append to `firestore.rules`):**

```
match /notifications/{notifId} {
    allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
    allow write: if false; // Cloud Functions only
}
match /wallets/{userId} {
    allow read: if isAuthenticated() && isOwner(userId);
    allow write: if false;
}
match /wallet_transactions/{txId} {
    allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
    allow write: if false;
}
match /price_quotes/{quoteId} {
    allow read: if false;    // clients never read – they get the quote via callable return
    allow write: if false;
}
match /surge_zones/{zoneId} {
    allow read: if isAuthenticated();  // read-only for the demand map
    allow write: if false;
}
match /emergency_requests/{id} {
    allow read: if isAuthenticated()
        && (resource.data.userId == request.auth.uid || request.auth.uid == resource.data.providerId);
    allow write: if false;
}
match /medical_providers/{id} {
    allow read: if isAuthenticated();
    allow write: if false;
}
match /hospitals/{id} { allow read: if isAuthenticated(); allow write: if false; }
match /dispatch_predictions/{id} { allow read, write: if false; }
match /dispatch_training_data/{id} { allow read, write: if false; }
```

---

### Fix 9 — Vehicles and emergency contacts as subcollections

**Problem.** Read-modify-write races (§3.3.1) and 1 MB doc ceiling for users
with many vehicles/contacts.

**Solution.** Move to subcollections with callable endpoints.

**Implementation.**
- `users/{uid}/vehicles/{vehicleId}` with `addVehicleCF`, `removeVehicleCF`,
  `setPrimaryVehicleCF` (transaction that clears `isPrimary` on siblings).
- `users/{uid}/emergency_contacts/{contactId}` with `addContactCF` that
  also tests that the phone number is a valid Kenya format.

---

### Fix 10 — Notification feed + localized copy

**Problem.** No persistent notification store for the FCM messages sent on the
mechanical flow; FCM titles/bodies are hardcoded English with emojis
(§3.4.1, §2.1 FE #42).

**Solution.**
1. Every FCM send goes through `sendNotification(userId, kind, data)` that:
   - Writes a `notifications/{id}` row (`userId`, `kind`, `data`, `read: false`).
   - Reads `users/{uid}.locale` (default `en`).
   - Renders copy from a server-side table keyed by `(kind, locale)`.
2. Frontend `NotificationsScreen` subscribes to
   `notifications where userId == uid order by createdAt desc limit 50`.

**Implementation.** New helper `functions/src/shared/notify.ts` with a typed
`NotificationKind` union, used everywhere `admin.messaging().send(...)` is
called today.

---

### Fix 11 — Dispatch escalation and emergency transaction

**Problem.** A pending request with no accepting provider sits forever;
`assignMedicalProvider` is non-transactional (§3.5.2).

**Solution.**
1. Add a `functions.pubsub.schedule('every 1 minutes')` that finds `requests`
   with `status == 'pending'` older than 60 s, widens radius by 5 km, and
   re-notifies. After 5 min, sets `status: 'unserved'` and notifies the
   customer.
2. Wrap `assignMedicalProvider` in `db.runTransaction` following the same
   pattern as `acceptServiceRequest`.

---

### Fix 12 — Request cancellation and admin claims

**Problem.** No first-class `cancelServiceRequest`; `updateZoneSurge` expects
an `admin` claim that no code ever sets (§3.5.5).

**Solution.**
1. Add `cancelServiceRequest(requestId, reason)` callable that checks
   `uid == userId` and status is in `{pending, accepted, enroute}`; refunds
   wallet if debited; flips RTDB node to remove.
2. Add a one-time admin-claim setter: `grantAdmin(uid)` callable that is itself
   protected by a hardcoded allowlist of seed-admin UIDs in environment config.

---

### Fix 13 — Consistent response envelope across all callables

**Problem.** Divergent envelopes (§3.1.5).

**Solution.** Adopt the discriminated-union pattern from
`api-and-interface-design`:

```ts
export type CallResult<T, E extends string = string> =
    | { ok: true; data: T }
    | { ok: false; errorCode: E; message: string };
```

Retrofit every callable (`initiateStkPush`, `createServiceRequest`,
`acceptServiceRequest`, `updateRequestStatus`, `findOptimalProvider`,
`getPriceQuote`, `updateProviderLocation`, `setProviderAvailability`,
`createEmergencyRequest`, `assignMedicalProvider`, `notifyNearbyHospitals`,
…). Keep the old `{ success, … }` shape for one release behind a `v1` namespace
if shipping backwards-compatibly (Addition Over Modification).

---

## 5. Frontend ↔ Backend Mapping (critical)

The rows below map every frontend audit change that has backend impact to the
concrete backend work and the risk if that work does not ship.

| # | Frontend change (from `frontend_audit.md`)                             | Backend change required                                                         | Risk if not updated |
| - | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------- |
| 1 | Unify brand colour / typography (Issues #1–#4)                         | None                                                                            | None |
| 2 | Merge duplicate booking screens into `details.tsx` (Issue #10)         | Fix 1 + Fix 7 (one canonical `createServiceRequest` with `quoteId`)             | Silent price/field drift; client-server desync; overcharging |
| 3 | Replace simulated dark map with real map (Issue #22)                   | Fix 2 (Cloud Function writes RTDB; disconnect handling)                         | Map freezes when provider app backgrounds; customer thinks provider stopped |
| 4 | Global SOS entry (Issue #26)                                           | Fix 3 (unified `createRequest`) + Fix 11 (transactional assignment) + Fix 10 (localized alerts) | SOS may write to wrong collection; no audit; double-assignment possible |
| 5 | Accessibility (Issues #29–#33)                                         | Fix 10 (FCM copy without emoji-only, typed kinds, localized bodies)             | Screen readers announce garbage; FE can't ship a11y-compliant a11yLabels |
| 6 | Performance — no blocking loops (Issues #34–#36)                      | Add `getHomeSummary` callable (§3.1.3)                                         | Dashboard does N reads, regressing TTI for every new widget |
| 7 | Remove hardcoded mock data — history (Issue #39)                      | Remove `USE_DEMO_MODE` in `customer.service.ts`; paginate real history          | Real users see fake data in production; history never persists |
| 8 | Wallet tab (Issue #39)                                                 | Fix 4 (wallet schema + top-up/debit CF) + Fix 5 (idempotent M-Pesa)             | Wallet tab shows nothing; top-up silently fails |
| 9 | Garage / vehicles tab (Issue #39)                                      | Fix 9 (subcollection + callables)                                               | Concurrent edits clobber; users lose saved vehicles |
| 10 | Emergency contacts tab (Issue #39)                                     | Fix 9 + SMS fan-out on SOS                                                      | Contacts silently truncated; SOS doesn't notify family |
| 11 | Empty / error states typed (Issues #40–#41)                           | Fix 13 (consistent `CallResult<T>` envelope)                                    | FE falls back to "Something went wrong" everywhere |
| 12 | Swahili i18n (Issue #42)                                               | Fix 10 (locale-aware copy) + `users.locale` field                               | Half the UI is Swahili but push notifications are English |
| 13 | Typed testing (Issues #43–#44)                                         | Add emulator fixtures + contract tests in `functions/test/`                     | Cloud Functions break under FE changes; regressions only caught in staging |
| 14 | Any reference to `payment_requests` (payment UX)                      | Fix 5 (idempotency + replay-safe callback)                                      | Duplicate charges on retry; unverified callback origin |
| 15 | Any reference to provider ETA in FE copy                              | Replace random ETA (`functions/src/services/requests.ts:306`) with real distance / speed estimate | FE displays "12 mins" then provider arrives in 40; trust collapses |
| 16 | Notification tab (Issue #39)                                           | Fix 10 (persist every FCM into `notifications/{id}`)                            | Tab is empty on cold-start; users think pushes were lost |
| 17 | Cancel button during tracking                                          | Fix 12 (`cancelServiceRequest` callable + refund)                               | No way to cancel without moving status manually; no refund path |
| 18 | Provider earnings widget                                               | Scheduled reset of `earnings.today/week/month`                                  | "Today" numbers grow forever; widget loses meaning |
| 19 | Dynamic surge badge on booking                                         | Honor `price_quotes.validUntil` on `createServiceRequest`; invalidate on zone update | User books at stale surge → server silently reprices or mismatches |
| 20 | AI-matched provider confidence badge                                   | Standardize `findOptimalProvider` response envelope (Fix 13)                    | FE can't distinguish "no providers" from "service error" |
| 21 | Admin surfaces (if any in FE audit)                                    | Fix 12 admin-claim setter                                                       | Admin endpoints unreachable |
| 22 | Medical dispatch / hospital pre-alert UI                               | Add rules for `hospital_alerts`, `medical_providers` (Fix 8)                    | FE reads return `permission-denied` |

---

## 6. Priority Actions

Ranked by impact (production-critical first) and effort (lower number = higher priority).

### P0 — Ship before the frontend audit lands

1. **Fix 5 — Idempotent, replay-safe M-Pesa.** Stops duplicate charges and
   double earnings. Without this, any payment-related FE change is dangerous.
2. **Fix 6 — Authorize `updateRequestStatus`.** Current state lets any user
   move any request. Any UI button wired to this is a privilege escalation.
3. **Fix 8 — Firestore rules for new/uncovered collections.** Otherwise new FE
   screens silently get `permission-denied`.
4. **Fix 13 — Consistent response envelope.** Cheap to ship (type-only) and
   unblocks all FE error-state work.

### P1 — Ship alongside the frontend audit

5. **Fix 1 — Single `createServiceRequest` with `quoteId`** (+ Fix 7 price freeze).
   Mandatory to de-risk the unified `details.tsx` screen.
6. **Fix 2 — Cloud-Function-authored RTDB for tracking.** Without this, the
   real map is a cosmetic upgrade over the simulation.
7. **Fix 10 — Notification feed + localized copy.** Needed for Swahili + a11y
   FE work and the new Notifications tab.
8. **Fix 12 — `cancelServiceRequest` callable.** Needed for the new cancel UX.

### P2 — Ship shortly after

9. **Fix 3 — Unified emergency request collection.** Required for the global
   SOS entry to be safe, but can ship one release later if the SOS button
   routes only to `emergency_requests` initially.
10. **Fix 4 — Wallet + ledger.** Wallet tab is visible but empty is acceptable
    for one release; funds must not actually move until Fix 5 is also in.
11. **Fix 9 — Vehicles / emergency contacts subcollections.** FE can ship with
    the current embedded arrays, but race risk grows with user count.
12. **Fix 11 — Dispatch escalation + transactional medical assignment.**
    Not blocking for FE; a reliability upgrade.

### P3 — Ongoing / hygiene

13. Scheduled reset of provider earnings.
14. Real ETA calculation (replace random fallback).
15. Remove `USE_DEMO_MODE` hardcode; expose as env flag.
16. `getHomeSummary` callable for dashboard.
17. Admin custom-claim provisioning.
18. Rate limiting via Firebase App Check + per-UID counters.
19. Emulator-based contract test suite in `functions/test/`.

---

## Appendix A — Backend surfaces inventory (at time of audit)

**Cloud Functions entry points** (`functions/src/index.ts`):

- M-Pesa: `initiateStkPush`, `queryStkStatus`, `mpesaCallback`
- Service requests: `createServiceRequest`, `acceptServiceRequest`, `updateRequestStatus`
- Providers: `updateProviderLocation`, `setProviderAvailability`, `autoOfflineCheck`
- Medical providers: `registerMedicalProvider`, `verifyMedicalCertification`, `updateMedicalProviderStatus`, `checkCertificationExpiry`
- Medical dispatch: `createEmergencyRequest`, `findNearestMedicalProviders`, `assignMedicalProvider`, `notifyNearbyHospitals`
- Hospitals: `registerHospital`, `findNearestHospitals`, `sendHospitalPreAlert`, `updateHospitalCapacity`, `cleanupStalePreAlerts`
- AI dispatch: `findOptimalProvider`, `recordDispatchOutcome`, `getDispatchMetrics`
- Pricing: `getPriceQuote`, `updateZoneSurge`, `getDemandZones`, `scheduledSurgeUpdate`

**Client services** (`services/`): `auth`, `firestore`, `realtime`, `location`,
`payment`, `transaction`, `notification`, `customer`, `provider`, `error`,
`seed`, plus analytics/ML helpers (`ab-testing`, `ai-dispatch`, `churn-prediction`,
`demand-forecast`, `ml-training`, `medical-compliance`, `corporate`,
`surge-pricing`).

**Firestore collections** in active use: `users`, `providers`, `requests`,
`payment_requests`, `corporate_accounts`, `vehicles`, `emergency_requests`,
`medical_providers`, `hospitals`, `hospital_alerts`, `medical_audit_logs`,
`dispatch_predictions`, `dispatch_training_data`, `surge_zones`, `price_quotes`,
`price_events`, `notifications`. Provider stats live under
`providers/{id}/stats/current`.

**Realtime DB paths**: `activeRequests/{requestId}`, `providerLocations/{providerId}`.

---

## Appendix B — Mapping from `api-and-interface-design` principles to fixes

| Principle                            | Applied in         |
| ------------------------------------ | ------------------ |
| Contract First                       | Fix 1, 3, 4, 13    |
| One-Version Rule                     | Fix 1, 3           |
| Consistent Error Semantics           | Fix 13             |
| Validate at Boundaries               | Fix 6, 7, 9        |
| Prefer Addition Over Modification    | Fix 3, 4, 13       |
| Predictable Naming (camelCase, etc.) | Fix 1, 4, 10, 13   |
| Discriminated Unions                 | Fix 13, 10 (`NotificationKind`) |
| Idempotency                          | Fix 5              |

---

*End of audit. Recommended next step: triage P0 items into a backend sprint and
open tracking issues linked to the corresponding FE audit numbers.*
