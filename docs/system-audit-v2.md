# RESQ Kenya — System Audit v2

**Audit method**: trustless-system-auditor v2 (9-layer / 8-phase)
**Audited HEAD**: `1e23f6c` (post-merge of PR #7, which addressed all v1 critical findings)
**Predecessor**: `docs/system-audit.md` (v1, doc-only PR #5)
**Auditor stance**: every code path is wrong until proven otherwise under real Kenyan-user, real-network, real-money conditions. Findings are labelled **CONFIRMED / PROBABLE / POSSIBLE**. Safety overrides escalate anything that touches payments, auth, dispatch, or personal safety to Critical regardless of probability.

---

## Phase 0 — Context Intake

| Question | Answer |
| --- | --- |
| **Real user** | Kenyan motorist or pedestrian in distress (flat tyre, breakdown, accident, medical emergency). Phones ranging from low-end Android (Tecno/Infinix on 3G) to mid-range iPhones, often with single-bar signal. Some are panicked, some are tired, some are at night in unfamiliar locations. |
| **Most critical action this app must never fail at** | A customer in distress submits a request, gets a real provider dispatched, can see the provider en route, pays only for what they got, and reaches the provider if something goes wrong. Every other feature is supporting infrastructure. |
| **External dependencies** | Firebase Auth (phone OTP via reCAPTCHA), Firestore, Realtime Database, Cloud Messaging (FCM), Cloud Functions runtime, Safaricom M-Pesa Daraja API (sandbox in dev, production at launch), Expo Location, device telephony (`tel:` URLs). |
| **Has a real user — not the builder — completed the core action end-to-end?** | **No.** Test reports in this repo only reach the customer Home dashboard. The full request → dispatch → tracking → payment loop has never been exercised by a non-developer with a real Safaricom STK push. |
| **Builder assumptions** | The Phase 3 backend hardening fixed all v1 critical findings; the rules tests confirm rule intent; the customer frontend will eventually be rewritten and so its current bugs are deferred; demo mode is OFF by default; the M-Pesa sandbox callback URL is reachable. |
| **Skills applied during build** (per code comments) | API-and-Interface-Design (CallResult envelope, contract validators), Security-and-Hardening (rules tightening, HMAC, transactional invariants), TDD (helper-level pure tests), Source-Driven-Development (RTDB Admin SDK update path). **Skills not applied or only partially applied**: Frontend-UI-Engineering (customer flows still don't talk to backend), Code-Review-and-Quality (rules tests pass against fields the production trigger never writes), Incremental-Implementation (frontend was deferred wholesale rather than sliced). |

**Phase 0 verdict**: enough context to proceed, but the most important gap is that **no real user has completed the core flow**. Treat every "fixed" backend invariant as theoretical until a Kenyan customer initiates a real M-Pesa charge against a real provider on a real phone.

---

## Verification of v1 Critical Findings

The v1 audit (`docs/system-audit.md`) flagged 4 frontend criticals and 6 backend criticals. PR #7 was authored by a different agent to address them. Spot-checking each at the line level:

### Backend criticals — **ALL FIXED at code level**

| v1 Finding | Status | Evidence |
| --- | --- | --- |
| **B-CRIT-1** payment client drops `idempotencyKey` | **Fixed** | `services/payment.service.ts:71-91` now generates/forwards key; `__tests__/services/payment.service.contract.test.ts` covers all four wire combinations. |
| **B-CRIT-2** clients can squat `payment_requests` keys | **Fixed** | `firestore.rules:151-156` — `allow create, update, delete: if false`. |
| **B-CRIT-3** clients can create `requests` with arbitrary status/providerId | **Fixed** | `firestore.rules:127-139` — all writes blocked; only callables write. |
| **B-CRIT-4** assigned providers can mutate any field on `requests` | **Fixed** | Same rule block. `updateRequestStatus` (`functions/src/services/requests.ts:521-613`) restricts the field set. |
| **B-CRIT-5** `acceptServiceRequest` doesn't verify provider | **Fixed** | `requests.ts:378-476` enforces 5 invariants (verified, online, service-type match, idle, request still pending) atomically in a transaction. |
| **B-CRIT-6** `mpesaCallback` doesn't reconcile amount | **Fixed** | `functions/src/mpesa/callback.ts:165-182` rejects callbacks where `received - expected > 0.5 KES`. |

### Frontend criticals — **STILL UNRESOLVED**

| v1 Finding | Status | Evidence |
| --- | --- | --- |
| **F-CRIT-1** Service-request flow never calls backend | **Still broken** | No file in `app/` or `components/request` imports `createServiceRequest` from `services/customer.service.ts`. Verified: `grep -r "createServiceRequest" app/ components/request → 0 hits`. |
| **F-CRIT-2** Tracking screens auto-advance on timer | **Still broken** | `app/(customer)/request/tracking/searching.tsx:109-117` still uses 9-second `setTimeout`, no subscription to `requests/{id}` or `activeRequests/{id}`. |
| **F-CRIT-3** OTP login non-functional in production | **Still broken** | `app/(auth)/login.tsx` still navigates without calling `sendOTP`. `app/(auth)/verify-otp.tsx:86-92` still hardcodes `if (fullOtp === '123456') router.replace('/(customer)')` with no `__DEV__` guard. |
| **F-CRIT-4** PaymentModal hardcodes 5-second fake success | **Partially patched** | `components/ui/PaymentModal.tsx:108-123` now does call the real `initiatePayment` (so the backend STK is initiated), but **immediately after** does `setTimeout(() => setStatus('success'), 5000)` regardless of whether the user actually entered the M-Pesa PIN. The UI claims success even when the customer cancelled or the STK timed out. |

**Implication**: the backend is now correct in isolation, but the customer app does not yet exercise the corrected paths. If the frontend is rebuilt by another agent, this audit's frontend findings will be the consolidated checklist for that rebuild.

---

## NEW FINDINGS — Critical Blockers Introduced or Missed by PR #7

These are findings the v1 audit did not surface or that PR #7 inadvertently created.

### N-CRIT-1 — Provider is permanently locked out after first completed job
**Confidence: CONFIRMED (safety override → Critical: blocks the dispatch system)**
**Location**: `functions/src/services/requests.ts:464-475` (set), `requests.ts:521-572` (status updates), `functions/src/providers/location.ts:154-156` (only clear path)
**Failure scenario**:
1. Provider accepts a job → `acceptServiceRequest` writes `availability.currentRequestId = requestId` (line 474).
2. Provider completes the job → customer or provider calls `updateRequestStatus(status='completed' | 'cancelled')`.
3. `updateRequestStatus` updates **only** the request doc. It never clears `provider.availability.currentRequestId`.
4. Provider tries to accept the next request → invariant (4) at `requests.ts:451-460` rejects with `failed-precondition: Provider already has an active request` because `currentRequestId` still references the old, completed request.
5. The only existing clear path is `setProviderAvailability(isOnline=false)` at `location.ts:154-156`. That requires the provider to manually go offline, then back online, between every single job.
**User impact**: Every provider stops accepting jobs after their first completed run. The dispatch pool drains within hours of go-live.
**Recommended fix**: in `updateRequestStatus`, when transitioning to `completed | cancelled`, additionally `transaction.update(providerRef, { 'availability.currentRequestId': admin.firestore.FieldValue.delete() })` inside the same transaction. Same fix needed in `functions/src/medical/dispatch.ts:243-248` for the medical pool. Add a regression test that drives a full accept → complete → accept-again cycle.

### N-CRIT-2 — Customer cannot read RTDB `activeRequests/{id}`; rule field never written
**Confidence: CONFIRMED**
**Location**: `database.rules.json:6-10` (rule expects `customerId`), `functions/src/services/triggers.ts:76-97` (seed node), `__tests__/rules/database.rules.test.ts:55-63` (test masks the bug)
**Failure scenario**:
1. RTDB read rule for `activeRequests/$requestId` is `auth != null && (data.child('customerId').val() === auth.uid || data.child('providerId').val() === auth.uid)`.
2. The Firestore-→-RTDB seed trigger (`onRequestStatusChange`) writes a node containing `requestId, providerId, status, customerLocation, providerStale, updatedAt`. **It never writes `customerId`.** A `grep -r "customerId" functions/src` returns zero matches.
3. When a customer tries to subscribe via `subscribeToProviderLocation`, the RTDB SDK denies the `onValue` listener; the customer's tracking screen never receives an update.
4. The unit test at `__tests__/rules/database.rules.test.ts:55-63` calls `withSecurityRulesDisabled` to manually `set('activeRequests/req-1', { customerId: CUSTOMER, … })` before testing the rule, so the rule appears to work. **The test exercises a state production never produces.**
**User impact**: Real-time provider tracking is dead from the customer side. Even if the frontend were re-wired today (the still-broken F-CRIT-2), the RTDB read would silently fail.
**Recommended fix**: have `onRequestStatusChange` and `acceptServiceRequest` write `customerId: <userId>` into the RTDB seed node; add an integration test that drives the real Firestore→RTDB trigger and asserts a customer can read the resulting node without `withSecurityRulesDisabled`.

### N-CRIT-3 — Medical-compliance service is hardcoded to demo mode
**Confidence: CONFIRMED (safety override → Critical: medical PII / audit logs)**
**Location**: `services/medical-compliance.service.ts:21`
**Failure scenario**:
1. `services/medical-compliance.service.ts` opens with `const USE_DEMO_MODE = true;` — **hardcoded, no env override**.
2. Every public function (`registerMedicalProvider`, `logMedicalAccess`, `getMedicalAuditLogs`, `generateIncidentReport`) short-circuits into a `console.log` + `simulateDelay` with no Cloud Function call.
3. In production, EMT credential registrations are not persisted, audit log writes for medical PII access are silently dropped, and incident reports are never generated.
4. Unlike `customer.service.ts` and `payment.service.ts`, which moved to env-driven default-OFF demo mode after CodeRabbit pointed it out on PR #3, this file was missed. The CodeRabbit fix list and the Phase 3 audit didn't catch it.
**User impact**: The medical/ambulance flow has no compliance trail, no provider verification, no incident record. This is a regulatory and safety blocker for any real medical-emergency flow.
**Recommended fix**: replicate the `customer.service.ts:39-45` pattern (default-OFF env-gated `USE_DEMO_MODE`); implement the corresponding Cloud Function callables (`registerMedicalProviderV2`, `logMedicalAccessV2`, `getMedicalAuditLogsV2`, `generateIncidentReportV2`) and route real flows through them; add Firestore rules for `medical_providers`, `medical_audit_logs`, and `incident_reports` collections. Until then, hide every medical-emergency entry point in the UI.

### N-CRIT-4 — `medical/dispatch.ts:assignProvider` is non-atomic and lacks the v2 invariant gate
**Confidence: CONFIRMED**
**Location**: `functions/src/medical/dispatch.ts:200-267`
**Failure scenario**:
1. Function authenticates the caller, then writes `requests/{id}` (line 235-241) and `medical_providers/{id}` (line 244-248) as **two sequential, non-transactional updates**. A crash, timeout, or concurrent assignment between the two writes leaves the request `status='accepted'` but the provider still `isAvailable=true`.
2. The function does **not** apply any of the 5 invariants from `acceptServiceRequest` (`requests.ts:415-461`): no verification gate, no idle gate, no service-type match, no online check. A medical provider who is suspended, off-shift, or already dispatched can still be assigned.
3. Errors in either step are caught at `dispatch.ts:264-267` and re-thrown as opaque `internal` — failure reasons are lost.
4. The `currentRequestId` field is set on accept but, like `requests.ts`, never cleared on completion → same lockout pathology as N-CRIT-1.
**User impact**: An ambulance can be dispatched to a request that's already taken, or assigned to a provider who is suspended, off-shift, or already on another emergency. State is also vulnerable to partial-write inconsistency.
**Recommended fix**: rewrite `assignProvider` as a single Firestore transaction with the same 5-invariant gate as `acceptServiceRequest`; add a release path in the medical equivalent of `updateRequestStatus`; surface specific `HttpsError` codes for each invariant.

### N-CRIT-5 — `PaymentModal` UI fakes success regardless of M-Pesa outcome
**Confidence: CONFIRMED (safety override → Critical: financial transaction)**
**Location**: `components/ui/PaymentModal.tsx:108-132`
**Failure scenario**:
1. User taps "Pay" → `initiatePayment(...)` is called and (now) reaches the backend with a valid idempotency key.
2. Backend returns `{ success: true, checkoutRequestID }` once the **STK push has been pushed to Safaricom**, NOT once the customer has paid.
3. PaymentModal then unconditionally schedules `setTimeout(() => setStatus('success'), 5000); setTimeout(() => onSuccess(checkoutRequestID), 6500)`.
4. The customer may cancel the STK prompt, time out, fail PIN entry, or have insufficient balance. The UI claims success after 5 seconds either way. The customer believes they paid; the backend `mpesaCallback` later marks the payment `failed`.
5. The on-success callback typically advances the request lifecycle, so the customer is moved into "service complete" without having paid.
**User impact**: The customer thinks they paid; the provider has the request marked completed; the payment row is `failed` in Firestore. Trust collapses on the very first failed STK.
**Recommended fix**: subscribe to `payment_requests/{idempotencyKey}` (using the read rule the backend already grants the customer) and only flip to `success` when `status === 'completed'`. On `failed`, surface the M-Pesa response description. Set a 90-second hard timeout (Safaricom STK validity) to flip to `failed` if no callback arrives.

---

## NEW FINDINGS — High Severity

### N-HIGH-1 — `services/firestore.service.ts` legacy shims write to deprecated paths
**Confidence: CONFIRMED**
**Location**: `services/firestore.service.ts:77-114` (vehicles, contacts, locations) and `services/firestore.service.ts:148-161` (deprecated provider-location shim already throwing).
**Failure scenario**: `addVehicle`, `addEmergencyContact`, `addSavedLocation` still mutate the **top-level array** on `users/{uid}` (e.g. `users/{uid}.vehicles[]`) instead of the new `users/{uid}/vehicles/{vehicleId}` subcollection introduced in Phase 5. Firestore rules at `firestore.rules:39` allow the user to update their own user doc with no field allow-list, so the writes succeed silently. The new vehicles UI reads from the subcollection and shows nothing.
**User impact**: Adding a vehicle from any UI that still uses `firestore.service.ts` creates phantom data the app doesn't display. The MAX_CONTACTS=5 invariant is bypassable through this path.
**Recommended fix**: same treatment as `updateProviderLocation` (`firestore.service.ts:149-161`) — throw a deprecation error pointing callers at the canonical callables (`addVehicle`, `addEmergencyContact`, `addSavedLocation` from `services/profile.service.ts` etc.). Tighten `firestore.rules` `users/{userId}` `allow update` with an `affectedKeysAreSubsetOf([...])` clause that excludes `vehicles`, `emergencyContacts`, `savedLocations`.

### N-HIGH-2 — `users/{userId}` rule has no field allow-list
**Confidence: CONFIRMED**
**Location**: `firestore.rules:36-40`
**Failure scenario**: `allow update: if isAuthenticated() && isOwner(userId);` permits the owner to overwrite **any field** on their user doc. This is the rule that lets N-HIGH-1 succeed silently. It also means a malicious user could write `role: 'admin'`, `wallet.balance: 999999`, `referralCredits: 999999`, etc. — there is no other code path forbidding it. The blast radius depends on what other backend code blindly trusts user-doc fields.
**User impact**: Privilege escalation surface, balance forgery surface, future feature flags forgeable by any logged-in user.
**Recommended fix**: same `affectedKeysAreSubsetOf([...])` pattern already applied to `providers/{providerId}` at `firestore.rules:101-112`. Allow only profile-presentation fields (`displayName`, `phone`, `email`, `fcmToken`, `pushTokens`, `preferredLanguage`, `updatedAt`).

### N-HIGH-3 — RTDB `providerLocations/$providerId` write surface has no verification gate
**Confidence: CONFIRMED**
**Location**: `database.rules.json:13-23`
**Failure scenario**: An authenticated user can write `providerLocations/{their-uid}/location` and `providerLocations/{their-uid}/isOnline` directly from the client. RTDB rules cannot easily query Firestore to check `verificationStatus`, so an unverified provider can spoof location updates. Currently no production code reads from this path, but Hyrum's Law says any feature added later that reads `providerLocations/*` will inherit this attack surface.
**User impact**: latent security debt; forgeable provider locations the moment any reader subscribes.
**Recommended fix**: drop the `providerLocations` branch from the RTDB rules entirely (server-only writes via Cloud Functions, like `activeRequests`); or add a server-side validator that copies verified provider locations into a separate write-only-by-server tree.

### N-HIGH-4 — `estimateETA` returns `Math.random()`
**Confidence: CONFIRMED**
**Location**: `functions/src/services/requests.ts:618-621`
**Failure scenario**: `estimateETA()` returns `Math.floor(Math.random() * 12) + 8` — a uniformly-distributed 8-20 minute integer with **zero correlation to the actual provider distance, time of day, or traffic**. Any caller that exposes ETA to the user will display fake numbers.
**User impact**: A customer waiting on a flat tyre at night will be told "ETA 14 minutes" while the provider is in fact 40 km away. Trust collapses on the first observed mismatch.
**Recommended fix**: derive ETA from the geohash distance already computed in `notifyNearbyProviders` (`requests.ts:281-283`) plus a configurable km-per-minute rate. Persist it in `requests/{id}.eta` so the customer subscription can render it. Source-driven: see Google Maps Distance Matrix API or `geofire-common.distanceBetween`.

### N-HIGH-5 — `SidebarDrawer` hardcodes user identity and wallet balance
**Confidence: CONFIRMED**
**Location**: `components/dashboard/SidebarDrawer.tsx:17, 88, 91`
**Failure scenario**: The sidebar renders `JM` avatar, `John Mwangi` name, `4.74 Safety Rating`, and `KES 2,450` wallet balance as **hardcoded strings**. Every customer sees John Mwangi.
**User impact**: A real customer who taps the menu sees someone else's name and balance. They will assume the app is broken or that they've been signed into the wrong account, and stop trusting the wallet feature.
**Recommended fix**: read `useAuth().user.displayName`, derive initials, and subscribe to `wallets/{uid}.balance` (which the rule at `firestore.rules:66-68` already permits the owner to read). Until wired, hide the sidebar.

### N-HIGH-6 — `cleanupStaleInitiatingPayments` cap quietly truncates recovery
**Confidence: PROBABLE**
**Location**: `functions/src/mpesa/stkPush.ts:355-373`
**Failure scenario**: The daily cron only marks the **first 500** stale `initiating` rows as `failed`. If a Safaricom outage stalls more than 500 payments overnight, the surplus stay in `initiating` forever and continue to short-circuit fresh idempotency keys with `duplicate: true, status: 'initiating'`. There is no pagination loop equivalent to the one at `triggers.ts:107-117` for `resetDailyEarnings`.
**User impact**: After any sustained Safaricom incident, customers retry payments and the backend silently returns "in progress" for an idempotency key that will never resolve.
**Recommended fix**: paginate with a stable cursor (createdAt < cutoff) until the page is empty; cap at e.g. 50 pages per run with a metric.

### N-HIGH-7 — `dispatch` failure path is observable but recovery worker is missing
**Confidence: PROBABLE**
**Location**: `functions/src/services/requests.ts:340-358`; no scheduled worker found
**Failure scenario**: `notifyNearbyProviders` carefully writes `dispatch.status='failed'`, `dispatch.retryCount`, `dispatch.lastError` so a future scheduled worker can retry. Searching the codebase finds no such worker — the comments in `requests.ts:233-239` describe one but it is not implemented. So a request that lands in `dispatch.status='failed'` is permanently stuck — visible only in Firestore.
**User impact**: Any FCM, geohash, or quota error during dispatch produces a request the customer will see as "still searching" forever, with no provider notification, no retry, no surfaced error.
**Recommended fix**: add a `pubsub.schedule('every 1 minutes')` worker that scans `requests where dispatch.status in ['failed', 'pending'] and dispatch.retryCount < 3` and re-runs `notifyNearbyProviders`. After max retries, transition the request to a terminal `failed` status with a customer notification.

### N-HIGH-8 — Rules tests pass against state the system never produces
**Confidence: CONFIRMED (this is a test-skepticism finding, not a code finding)**
**Location**: `__tests__/rules/database.rules.test.ts:55-91`
**Failure scenario**: All four `activeRequests` test cases use `env.withSecurityRulesDisabled` to seed nodes containing `customerId`. The production trigger never writes that field (see N-CRIT-2). The test suite is therefore green while the production behaviour is broken. This is a textbook example of the trustless v2 "test skepticism" anti-pattern: tests confirming intent rather than behaviour.
**User impact**: false confidence. Reviewers see 38 rules tests pass and conclude tracking works.
**Recommended fix**: replace the seeding step with **the actual production code path** — write a test fixture Firestore doc that triggers `onRequestStatusChange`, wait for the RTDB node to appear, then assert the rule. This requires a Firestore-emulator + Functions-emulator harness. If that's too heavy, at minimum assert the **shape** of the seed node in `triggers.ts` against the rule's `data.child('customerId')` requirement.

### N-HIGH-9 — Cloud Functions code has zero test coverage
**Confidence: CONFIRMED**
**Location**: `functions/src/**/*.ts`
**Failure scenario**: Running `find functions -name '*.test.ts'` returns only `node_modules` matches. The 5 invariants in `acceptServiceRequest`, the HMAC verification in `mpesaCallback`, the amount reconciliation in B-CRIT-6, the dispatch state machine, and the medical-provider assignment are all completely untested at the actual function level. Pure-helper tests in `__tests__/shared/idempotency-mirror.test.ts` and `functions/src/shared/*` exist but exercise only the helpers, not the callable surface.
**User impact**: Every backend-critical change ships untested. A future regression that re-introduces (say) the missing verification gate will not be caught by CI.
**Recommended fix**: stand up `firebase-functions-test` + Firestore emulator + RTDB emulator harness; add invariant tests for `acceptServiceRequest` (one test per invariant, plus the happy-path), `updateRequestStatus` (every transition), `mpesaCallback` (HMAC mismatch, amount mismatch, duplicate callback, success path), and the dispatch state machine.

### N-HIGH-10 — All-environments demo-mode flip is a process-global mutable
**Confidence: PROBABLE**
**Location**: `services/customer.service.ts:39-45`, `services/customer.service.ts:394-400`
**Failure scenario**: `setDemoMode(enabled)` mutates a module-level `let` from anywhere in the JS bundle. A future code path (or a test that forgot to restore) could leave demo mode ON for a real production session. Combined with the **default-OFF** posture (correct), the only gate against silent bypass is "no caller turned it on by mistake." There is no telemetry that records the runtime flag.
**User impact**: a single bad call-site permanently silences the entire customer backend integration for a session.
**Recommended fix**: drop `setDemoMode` (or move it behind an `if (__DEV__)` guard); read the flag at construction time and freeze; emit a console warning at boot when demo mode is on; surface a debug banner.

---

## NEW FINDINGS — Medium Severity

### N-MED-1 — `subscribeToProviderLocation` reads `data.providerLocation` that is null until first location push
**Confidence: PROBABLE**
**Location**: `services/realtime.service.ts:81-108`
**Failure**: When `acceptServiceRequest` fires, the seed node has `providerLocation: null` until the provider's next location push. If the customer subscribes in this gap, `data.providerLocation` is null and the consumer dereferences `data.providerLocation.latitude` → app crash on a real customer's phone the moment dispatch lands.
**Fix**: tolerate null in the consumer; render a "locating provider…" placeholder.

### N-MED-2 — `getCallbackHmacSecret` derives from `consumerSecret + passkey` if `callback_secret` is unset
**Confidence: PROBABLE**
**Location**: `functions/src/mpesa/stkPush.ts:75-95`
**Failure**: The fallback HMAC key is `${consumerSecret}|${passkey}`. Both ride in the M-Pesa request body to Safaricom. If a Safaricom log or a Daraja sandbox dump leaked, the HMAC secret is leaked too. The fail-closed posture is correct (better than empty string), but the derivation reuses material that is sent over the wire, defeating the purpose of having a separate signing key.
**Fix**: deploy with `mpesa.callback_secret` set to a fresh random value at every environment; remove the derivation fallback for production (keep emulator path).

### N-MED-3 — `notifyNearbyProviders` swallows `radiusKm` not configurable per service
**Confidence: PROBABLE**
**Location**: `requests.ts:241-246`
**Failure**: `radiusKm: number = 15` is a hardcoded default. A medical request needs a wider net than a fuel-delivery request. There is no per-service-type override.
**Fix**: source the radius from `theme/voltage-premium.ts.SERVICE_CATALOG` or a Firestore config doc; pass it explicitly.

### N-MED-4 — `verifyOTP` flow leaves `confirmationResult` null on hot reload
**Confidence: PROBABLE**
**Location**: `services/auth.service.ts:62-66` and the missing `sendOTP` call site (F-CRIT-3)
**Failure**: Even after F-CRIT-3 is fixed, `sendOTP` stores `confirmationResult` in a module variable. Hot reload, navigation away and back, or app backgrounding past the OS process kill clears it. The OTP screen will then throw "No OTP request pending" with no recovery.
**Fix**: persist the verification ID in secure storage; render a "send a fresh code" button when the confirmation result is missing; provide a clean error message to the user.

### N-MED-5 — `requests/{id}.geohash` query is not indexed in `firestore.indexes.json`
**Confidence: POSSIBLE**
**Location**: `requests.ts:266-269` (the `serviceTypes`-array-contains + geohash range query)
**Failure**: The composite query needs a Firestore composite index. Spot-check: `firestore.indexes.json` was not opened in this audit (skip-listed by trustless v2 layer 3 because no concrete failure trace surfaced). On first dispatch in a clean project, the call will return `9 FAILED_PRECONDITION` with a deep link to create the index.
**Fix**: verify `firestore.indexes.json` includes the composite (`providers (serviceTypes array-contains, availability.isOnline ASC, verificationStatus ASC, geohash ASC)`); if not, add it and re-deploy.

### N-MED-6 — `tracking-lifecycle.test.ts` is a 401-line constants file masquerading as a test
**Confidence: CONFIRMED (test-skepticism)**
**Location**: `__tests__/screens/tracking-lifecycle.test.ts:1-401`
**Failure**: The file mirrors constants from the screen modules (`LOADING_MESSAGES`, `IN_PROGRESS_STEPS`, `EN_ROUTE_STEPS`, etc.) and asserts on those locally-defined copies. It does not import the screens or exercise the actual transitions. F-CRIT-2 (timer-based auto-advance) is invisible to this test.
**Fix**: import the screens with `@testing-library/react-native`, render with mock router, advance timers, assert that a backend subscription is required to transition.

### N-MED-7 — `EmergencySOS` callback is a `console.log` only
**Confidence: CONFIRMED**
**Location**: `app/(customer)/_layout.tsx:31-36`, `components/EmergencySOS.tsx:110-115`
**Failure**: The SOS modal's countdown completes and calls `onEmergencyTrigger(type)`. The handler at `_layout.tsx:31-36` is `console.log('[SOS] triggered:', type)` and then opens the dialler via `Linking.openURL` (the modal's quick-call buttons). There is no server-side call to log the SOS, no notification to emergency contacts, no GPS pin sent anywhere, no escalation.
**User impact**: the SOS button is a glorified speed-dial. A user expecting their emergency contact to be alerted will be wrong.
**Fix**: server callable `triggerEmergencySOS({ type, location })` that (a) writes a `sos_events/{id}` doc with the user's last GPS, (b) sends FCM to listed emergency contacts (if any), (c) optionally creates a `requests/{id}` of type `ambulance` if `type==='medical'`. Until then, the SOS button must display a "this is a quick-dial only — your contacts will not be alerted" disclaimer.

### N-MED-8 — `fcmToken` is read from `users/{uid}.fcmToken` but no callable enforces token write
**Confidence: PROBABLE**
**Location**: `requests.ts:577-578`, `users/{uid}` rule at `firestore.rules:36-40`
**Failure**: Status-update notifications are pulled from `users/{uid}.fcmToken`. Because `users/{uid}` allow_update has no field allow-list (N-HIGH-2), an attacker can write a victim's UID-shaped token to their own doc... actually, they can only write their **own** user doc, so the worst case is: a user clears their own token and never gets notifications. But also: there is no canonical write path that FCM tokens are scoped to one device. A logout-from-device-A leaves device-A's token on the user doc until device-B logs in.
**Fix**: a small `setFcmToken` callable that owns this field; clear the field on `signOut()`.

### N-MED-9 — Dispatch radius widening is not persisted on retry
**Confidence: POSSIBLE**
**Location**: `requests.ts:241-358`
**Failure**: The 15 km radius is fixed for the first attempt and would be fixed for retries (when the missing N-HIGH-7 worker exists). Real-world dispatch widens the radius on each retry (e.g. 15 → 25 → 50 km) before declaring no-providers.
**Fix**: store `dispatch.radiusKm` and bump it on each retry until a configurable max.

### N-MED-10 — `request.payment.status` and `payment_requests.status` can disagree
**Confidence: PROBABLE**
**Location**: `mpesa/stkPush.ts:312-318`, `mpesa/callback.ts:165-220`
**Failure**: The mirror update `requests/{id}.payment.status='processing'` happens **outside** the `payment_requests/{key}` transaction (`stkPush.ts:312`), with a `.catch()` that swallows errors. If that mirror write fails (Firestore quota, network blip), the source of truth `payment_requests/{key}` says `pending` while the request mirror says `failed` (its initial value) or stays untouched. The two views drift.
**Fix**: include the mirror write in the same transaction, or run the mirror through a Firestore trigger on `payment_requests` so it is retry-able.

---

## NEW FINDINGS — Low Severity

### N-LOW-1 — `app/firebase-test.tsx` and `app/database-test.tsx` are exposed routes in production
**Confidence: PROBABLE**
**Location**: `app/_layout.tsx:90-91`
**Failure**: Two debug routes (`firebase-test`, `database-test`) are registered at the root Stack and reachable via deep link. They typically expose direct Firebase-write controls for ad-hoc dev testing.
**Fix**: gate registration behind `__DEV__` or `process.env.EXPO_PUBLIC_DEBUG === 'true'`.

### N-LOW-2 — `EmergencySOS` countdown effect dep array missing memoised deps
**Confidence: PROBABLE**
**Location**: `components/EmergencySOS.tsx:69-87`
**Failure**: Effect declares `[isCountingDown, countdown]` deps but uses `triggerEmergency`, which references `selectedType`. This is benign today (no stale closure observed) but is a future-bug magnet on countdown-cancel during type-switch.
**Fix**: extract `triggerEmergency` into a `useCallback` and add to deps; or move countdown state into a reducer.

### N-LOW-3 — `KENYA_EMERGENCY_NUMBERS.gsmStandard = '112'` not labelled in Quick Call buttons
**Confidence: POSSIBLE (UX correctness)**
**Location**: `components/EmergencySOS.tsx:21-27`, `components/EmergencySOS.tsx:217-222`
**Failure**: 999 (Police/Ambulance), 1199 (Red Cross), 112 (GSM Emergency) are the three quick-dial buttons. 112 is labelled "GSM Emergency" — meaningless to a panicked user. They expect plain words.
**Fix**: label as "Mobile Emergency (112)"; add a one-line descriptor under each button.

### N-LOW-4 — `__tests__/services/medical-compliance.service.test.ts` likely tests the demo path only
**Confidence: PROBABLE**
**Location**: not opened in this audit; inferred from N-CRIT-3
**Failure**: Because `medical-compliance.service.ts` is hardcoded to demo mode, any test for it can only exercise the demo path. The non-existent production path is therefore wholly untested.
**Fix**: ride on the N-CRIT-3 fix; add a contract test analogous to `payment.service.contract.test.ts`.

### N-LOW-5 — `services/firestore.service.ts:findNearestProviders` duplicates `notifyNearbyProviders` logic
**Confidence: POSSIBLE (architectural)**
**Location**: `services/firestore.service.ts:166+`, `requests.ts:241+`
**Failure**: Two implementations of geohash-bounded provider search exist: one in the client SDK shim, one in the canonical Cloud Function. They will diverge.
**Fix**: deprecate the client shim (throw, like `updateProviderLocation` already does); have the client call a `findNearestProviders` callable.

---

## Cross-cutting Risks

### X-1 — The frontend cannot exercise any of the fixed backend paths
The customer journey skips backend at every step that matters:
- login → `sendOTP` not called
- request → `createServiceRequest` not called
- tracking → no subscription to `requests/{id}` or `activeRequests/{id}`
- payment → `setTimeout` overrides the real callback observation
- SOS → `console.log` only

Any "backend is fixed" claim must be interpreted as "backend is correct **once a frontend that uses it exists**." The user has stated the frontend will be rewritten by another agent. **This audit document is the single source of truth that rewrite must respect.**

### X-2 — Test confidence is structurally inflated
Three classes of false-confidence test exist:
1. **Rules tests that bypass the trigger** (N-HIGH-8, N-CRIT-2): seed via `withSecurityRulesDisabled` then assert. Production never produces that state.
2. **Constants-mirror tests** (N-MED-6): tracking-lifecycle.test.ts copies 401 lines of screen constants and asserts on the copy. The real screen behaviour (timer-based auto-advance) is untested.
3. **Cloud Functions zero-coverage** (N-HIGH-9): the entire backend surface has no callable-level tests.

CI green is not safety here. Until callable-level integration tests exist for `acceptServiceRequest`, `updateRequestStatus`, `mpesaCallback`, and the dispatch state machine, treat backend invariants as theoretical.

### X-3 — Provider lifecycle has no completion path
N-CRIT-1 (provider lockout after first job) means the dispatch pool is single-use per provider. Combined with N-CRIT-2 (customer can't read tracking) and N-MED-1 (null providerLocation crash), the entire post-accept lifecycle is a graveyard. This is the single most consequential operational risk in the audit.

---

## SILENT FAILURE INVENTORY

The trustless v2 skill calls silent failure the highest-trust-damage category. Every entry here is a path where the system **looks** OK but is silently dropping or corrupting state.

| # | Where | What is silently happening | User-visible consequence |
| --- | --- | --- | --- |
| S-1 | `medical-compliance.service.ts:21` | Hardcoded `USE_DEMO_MODE=true`; medical PII writes go to `console.log` | No EMT verification, no audit trail, no incident reports |
| S-2 | `services/firestore.service.ts:77-114` | Vehicles/contacts/locations write to top-level user-doc array, not subcollection | New vehicles disappear from the new UI |
| S-3 | `triggers.ts:76-97` (no `customerId`) | Customer never authorised on RTDB; subscription denied | Tracking screen frozen on the loading message |
| S-4 | `requests.ts:464-475` (no release on complete) | `currentRequestId` never cleared | Provider permanently locked out after first job |
| S-5 | `PaymentModal.tsx:119-123` | UI fakes success after 5 s regardless of M-Pesa outcome | Customer thinks they paid, backend says failed |
| S-6 | `_layout.tsx:31-36` | SOS handler is `console.log` | Emergency contacts never alerted |
| S-7 | `requests.ts:340-358` (failed dispatch, no worker) | Failed dispatches have nowhere to go | Customer sees "searching" forever |
| S-8 | `mpesa/stkPush.ts:312-318` (mirror catch) | `requests/{id}.payment.status` mirror failures swallowed | Two views of payment state drift |
| S-9 | `requests.ts:618-621` (`Math.random` ETA) | ETA is fictional | Customer sees fake numbers, loses trust on first mismatch |
| S-10 | `customer.service.ts:39-45` (mutable demo flag) | Any caller can flip demo mode at runtime; nothing logs the flip | A whole production session can be silently demo-mode |

---

## REAL USER PRESSURE TEST

Six failure scenarios a non-developer Kenyan customer is plausibly going to produce in week one:

1. **Customer enters wrong OTP twice, then `123456` accidentally** → app accepts because of F-CRIT-3, signs them into a generic customer stack with no backing Firebase user; downstream calls fail. Recovery: none.
2. **Customer initiates STK push, doesn't have credit, ignores the prompt** → backend marks `payment_requests/{id}.status='failed'`, but PaymentModal already flipped to "success" 5 s later (N-CRIT-5). Recovery: none until the customer manually checks their M-Pesa SMS.
3. **Provider accepts a job, completes it, opens the app the next morning** → cannot accept new jobs (N-CRIT-1). Recovery: toggle offline/online.
4. **Customer in a no-signal basement parks, requests towing** → `createServiceRequest` (when wired) returns `internal`; nothing on screen tells them to retry; they tap again and again, multiplying requests because `idempotencyKey` is regenerated each time the form re-mounts (frontend gap).
5. **Customer subscribes to tracking** → RTDB rule denies (N-CRIT-2); listener returns empty forever; customer thinks the provider isn't moving.
6. **Customer hits SOS in a real emergency expecting their contact list to be alerted** → only the dialler opens (N-MED-7); contacts never see anything.

Recovery path exists for **none** of these. All six are silent failures.

---

## SKILL GAPS DETECTED

The v2 trustless skill expects integration with eight named skills. Mapping each to evidence in the codebase:

| Skill | Status | Evidence |
| --- | --- | --- |
| API-and-Interface-Design | **Applied to backend, not to frontend** | `CallResult<T,E>` envelope is solid; client wrappers (services/*.service.ts) faithfully forward. UI never imports those wrappers. |
| Security-and-Hardening | **Mostly applied** | Firestore rules tightened, HMAC, transactional invariants, amount reconciliation. Gaps: N-HIGH-2 (users rule), N-HIGH-3 (RTDB providerLocations), N-MED-2 (HMAC derivation reuses wire material), N-CRIT-3 (medical compliance disabled). |
| Test-Driven Development | **Partially applied** | Pure helpers are unit-tested. Cloud Functions surface untested (N-HIGH-9). Screens untested (N-MED-6). |
| Frontend-UI-Engineering | **Not applied to flows** | EmergencySOS, RequestFormShell, theme tokens — the static surface — meet the bar. Customer flows (auth, request, tracking, payment) do not connect to backend. |
| Source-Driven-Development | **Applied to RTDB Admin SDK update** | `location.ts:73-84` cites Firebase docs in comments. Other dependencies (Safaricom Daraja, Expo Location, FCM v1) lack equivalent citations. |
| Incremental-Implementation | **Not applied to frontend** | Frontend rewrite was deferred wholesale rather than sliced. |
| Code-Review-and-Quality | **Applied to PRs but missed regressions** | CodeRabbit caught major issues on PR #3; PR #7 introduced N-CRIT-1 (provider lockout) and N-CRIT-2 (customerId field) which were not caught by review. |
| Idea-Refine | **N/A for an existing system** | — |

**Most consequential gap**: the backend rewrite shipped without callable-level integration tests, which is exactly where N-CRIT-1 and N-CRIT-2 would have been caught.

---

## PRE-LAUNCH CHECKLIST

Actions a non-developer can run with no code knowledge:

- [ ] Have at least 3 real Kenyan customers — not the builder — completed a full flow: create request → see provider en route → pay via M-Pesa STK → receipt visible in History. As of this audit, 0 of 3.
- [ ] Have at least 2 real providers accepted, completed, and accepted-again-the-same-day a request? **Until N-CRIT-1 is fixed, this is impossible.**
- [ ] Did any payment in QA result in M-Pesa charging the customer a different amount than the receipt shows? **B-CRIT-6 fix means no, but verify with one cancellation and one timeout test.**
- [ ] When a customer cancels the M-Pesa STK prompt, does the app correctly say "payment failed" and not "complete"? **Currently no — N-CRIT-5.**
- [ ] When a customer in a basement loses signal mid-request, does the app surface a clear "we couldn't reach you, please retry" message? **No — F-CRIT-1 not wired; even when wired, retry deduping needs work.**
- [ ] When a customer presses SOS in a non-medical real emergency, does anyone other than the customer get notified? **No — N-MED-7.**
- [ ] Is the production environment configured with `mpesa.callback_secret` (not derived from `consumerSecret + passkey`)? See N-MED-2.
- [ ] Are debug routes (`firebase-test`, `database-test`) disabled in production builds? See N-LOW-1.
- [ ] Is `EXPO_PUBLIC_DEMO_MODE` provably unset in the production build? Add a launch-time banner if it's on.
- [ ] Can the operations team observe a payment that's been stuck in `initiating` for over an hour? See N-HIGH-6.

---

## OVERALL RISK LEVEL: **DO NOT SHIP**

**PRIMARY REASON**: Two newly-introduced critical regressions (provider lockout after first job, customer cannot read tracking) plus four pre-existing critical frontend gaps mean that an actual customer cannot complete the core flow today, even though every backend invariant is technically correct in isolation.

**AUDITOR CONFIDENCE IN THIS VERDICT**: HIGH.

**What would change the verdict**: real end-to-end testing by three Kenyan customers using real M-Pesa sandbox accounts, with the `currentRequestId` clear-on-complete fix, the `customerId` seed-node fix, the medical-compliance demo flag flip, and the PaymentModal subscription rewrite landed first. Once the frontend rewrite (the user-stated next step) wires the canonical callables and these four backend fixes are in, the next pass should resolve to MEDIUM-LOW and the launch decision becomes a function of how aggressive the soft-launch radius is.

---

## Findings Index

### Frontend (for the next agent)
- **F-CRIT-1** Service-request flow never calls backend (carried from v1; unfixed)
- **F-CRIT-2** Tracking screens auto-advance on timer (carried from v1; unfixed)
- **F-CRIT-3** OTP login non-functional in production (carried from v1; unfixed)
- **F-CRIT-4** PaymentModal hardcodes 5-second fake success (carried from v1; partially patched, still broken — see N-CRIT-5)
- **N-CRIT-5** PaymentModal UI fakes success regardless of M-Pesa outcome
- **N-HIGH-5** SidebarDrawer hardcodes John Mwangi / KES 2,450
- **N-MED-1** subscribeToProviderLocation null-deref
- **N-MED-4** verifyOTP hot-reload state loss
- **N-MED-7** EmergencySOS callback is `console.log` only
- **N-LOW-1** Debug routes exposed in production
- **N-LOW-2** EmergencySOS effect deps incomplete
- **N-LOW-3** KENYA_EMERGENCY_NUMBERS labels confusing

### Backend (for the team)
- **N-CRIT-1** Provider lockout after first completed job
- **N-CRIT-2** RTDB seed node missing `customerId`; customer can't read tracking
- **N-CRIT-3** medical-compliance.service.ts hardcoded demo mode
- **N-CRIT-4** medical/dispatch.ts:assignProvider non-atomic, no invariant gate
- **N-HIGH-1** firestore.service.ts legacy shims write to wrong paths
- **N-HIGH-2** users/{userId} rule has no field allow-list
- **N-HIGH-3** RTDB providerLocations writable without verification gate
- **N-HIGH-4** estimateETA returns Math.random()
- **N-HIGH-6** cleanupStaleInitiatingPayments cap truncates recovery
- **N-HIGH-7** Dispatch failure recovery worker missing
- **N-HIGH-8** Rules tests pass against state production never produces
- **N-HIGH-9** Cloud Functions zero test coverage
- **N-HIGH-10** Demo-mode flag is process-global mutable
- **N-MED-2** HMAC fallback derives from wire-material
- **N-MED-3** notifyNearbyProviders radius not service-aware
- **N-MED-5** Firestore composite index for dispatch query unverified
- **N-MED-6** tracking-lifecycle.test.ts is constants-mirror, not behaviour
- **N-MED-8** fcmToken write path not bounded
- **N-MED-9** Dispatch radius doesn't widen on retry
- **N-MED-10** payment.status mirror can drift from payment_requests source-of-truth
- **N-LOW-4** medical-compliance test exercises only demo path
- **N-LOW-5** firestore.service.ts duplicates dispatch geohash logic

### Cross-cutting
- **X-1** Frontend doesn't exercise any fixed backend path
- **X-2** Test confidence is structurally inflated
- **X-3** Provider lifecycle has no completion path

---

## Severity counts

- Frontend: 4 (carried v1) + 1 new critical, 1 high, 4 medium, 3 low — **Frontend overall risk: HIGH (UNCHANGED)**
- Backend: 4 critical (all NEW), 7 high, 8 medium, 2 low — **Backend overall risk: HIGH (regression — was MEDIUM after PR #7's fixes claimed)**
- Cross-cutting: 3 — **Treat all three as launch blockers in their own right**
