# RESQ-KENYA — System Audit (Trustless Auditor)

**Audited HEAD**: `fedfe58` (merged PR #3 + skills/test-mode merges)
**Auditor skill**: `trustless-system-auditor` (8-step process)
**Scope**: Entire monorepo — Expo/React-Native frontend (`app/`, `components/`, `services/`) + Firebase Functions backend (`functions/src/`) + Firestore rules + tests.
**Audit posture**: Adversarial. Treat passing tests, comments, and "Phase X complete" markers as unverified claims. A finding is real only if I can point at the line of code that makes it true.

This document is split into two halves:

1. **FRONTEND ISSUES** — handed to the next agent who will redo the frontend. They must read the whole frontend section before designing replacements.
2. **BACKEND ISSUES** — to be addressed in this Devin session, together with the user.

Each finding follows the trustless skill format: **Risk / Location / Failure Scenario / Impact / Recommended Fix**. Severities use four levels: **Critical** (blocks core flow or data integrity), **High** (degrades core flow under realistic conditions), **Medium** (silent or partial failure under stress), **Low** (correctness/quality nit).

---

## TABLE OF CONTENTS

- [Executive Summary](#executive-summary)
- [Frontend Issues](#frontend-issues)
  - [Frontend — System Flow Map](#frontend--system-flow-map)
  - [Frontend Critical Risks](#frontend-critical-risks)
  - [Frontend High Risks](#frontend-high-risks)
  - [Frontend Medium Risks](#frontend-medium-risks)
  - [Frontend Low Risks / Quality](#frontend-low-risks--quality)
  - [Frontend Test Skepticism](#frontend-test-skepticism)
- [Backend Issues](#backend-issues)
  - [Backend — System Flow Map](#backend--system-flow-map)
  - [Backend Critical Risks](#backend-critical-risks)
  - [Backend High Risks](#backend-high-risks)
  - [Backend Medium Risks](#backend-medium-risks)
  - [Backend Low Risks / Quality](#backend-low-risks--quality)
  - [Backend Test Skepticism](#backend-test-skepticism)
- [Cross-Cutting Risks (Frontend × Backend)](#cross-cutting-risks-frontend--backend)
- [Overall Risk Summary](#overall-risk-summary)

---

## Executive Summary

The current state of RESQ-KENYA is **a working backend behind a non-functional UI**.

The Phase 1–6 backend refactor (PR #3 + the CodeRabbit follow-up commit `c60f1c2`) shipped a credible set of contracts: idempotent `createServiceRequest`, fail-closed M-Pesa HMAC, atomic wallet ledger, server-authoritative subcollections, real-time RTDB tracking, and reasonable Firestore security rules. The core Cloud Functions are correct under their own contract.

The frontend, however, never adopted any of those contracts on the customer side. The customer app:

- never calls `sendOTP` (login flow only navigates to the OTP screen),
- never calls `createServiceRequest` (the request screen navigates straight to `tracking/searching` with mock params),
- never calls the real `initiateStkPush` (the payment modal hardcodes `initiatePaymentDemo`),
- never calls `subscribeToRequest` (the tracking screens advance through fixed `setTimeout` timers).

Net effect: a customer can sign in only via the dev test-code path (`123456`), submit a "request" that never reaches Firestore, watch a fake provider arrive on a fake timer, and pay a fake bill. None of this is hidden behind the demo-mode flag — it is the **only** production code path. The provider side is partially wired up (`active-job.tsx` does subscribe and update via real callables) but the customer-side counterpart that produces those documents does not exist.

The next frontend agent should treat the customer flow as unbuilt and rebuild against the existing typed contracts in `services/customer.service.ts`, `services/payment.service.ts`, `services/realtime.service.ts`, and `types/api.ts`. The provider flow is closer to functional and can be incrementally hardened.

The backend has its own residual issues — most notably the `initiatePayment` client wrapper that drops the `idempotencyKey` (so even the unreachable real path would be rejected by the server), `payment_requests` create-rule that lets clients squat idempotency keys, fixed timer–based tracking screens, and mismatched data models between the legacy `firestore.service.ts` and the canonical callables. These are all fixable in this session.

---

## FRONTEND ISSUES

> **Audience**: the next agent redoing the frontend.
>
> **TL;DR**: Treat the customer-side request, payment, and tracking flows as unimplemented. They render UI but never talk to the backend. The contracts you must call are already typed in `types/api.ts` and `services/*.ts` — use them.

### Frontend — System Flow Map

**1. Entry / Splash / Auth gate**
- `app/_layout.tsx` (root) → `<ErrorBoundary>` → `<AuthProvider>` → `<Stack>`.
- `app/index.tsx` (`EntryScreen`) reads `useAuth()`. If `isLoading` → splash; else if authed customer → `/(customer)`, authed provider → `/(provider)`, otherwise → `LandingPage` with "Sign In" / "Sign Up" CTA.
- Phase 4 fix: navigation gated by `isLoading` instead of fixed timer (verified during testing — works on web).

**2. Auth — phone + OTP**
- `app/(auth)/login.tsx` → on `Continue`, `formatPhoneNumber()` then `router.push('/(auth)/verify-otp', { phoneNumber })`. **Never calls `sendOTP`**.
- `app/(auth)/verify-otp.tsx` → on `Verify`, hardcodes `if (fullOtp === '123456') router.replace('/(customer)')` else falls through to `verifyOTP(fullOtp)` which throws "No OTP request pending" because `confirmationResult` is null (sendOTP was never called).
- `services/AuthContext.tsx` listens to `onAuthChange`, fetches `getUserProfile` + `checkIsProvider` in parallel, and on either failure resets to logged-out state.

**3. Customer surface**
- `app/(customer)/_layout.tsx` → `Tabs` (Home, History, Wallet, Profile) + layout-level `<EmergencySOS>` FAB.
- `app/(customer)/index.tsx` → service tile grid (Towing, Battery, Fuel, Tire, Diagnostics, Medical) with hardcoded colour array.
- `app/(customer)/request/[service].tsx` → renders per-service form (TowingForm/FuelForm/...). On submit, navigates to `/(customer)/request/tracking` with mock params. **Never calls any backend.**
- `app/(customer)/request/tracking/index.tsx` → redirects to `searching.tsx`.
- `app/(customer)/request/tracking/searching.tsx` → `setTimeout(9s)` advances to `en-route`. **No subscription to `requests/{id}`.**
- En-route → arriving → in-progress → complete chain is similarly timer-driven.

**4. Provider surface**
- `app/(provider)/_layout.tsx` → tabs.
- `app/(provider)/index.tsx` → `ProviderDashboard` with online/offline toggle and nearby-requests list.
- `app/(provider)/active-job.tsx` → real `subscribeToRequest`, real `updateRequestStatus`, real `updateLocation` every 10s. **This is the only customer-facing surface that does talk to the backend correctly.**

**5. Theme**
- `theme/voltage-premium.ts:183` `colors.voltage = '#FFA500'` (single source of truth — verified).
- `colors.service.battery = '#FFCA28'` exists in the theme but is not consumed by the customer Home tile array.

**6. External services from frontend**
- Firebase Auth, Firestore, Realtime Database, Cloud Functions, Cloud Messaging — via `config/firebase.ts`.
- Expo Location, expo-router, lucide-react-native — UI only.

---

### Frontend Critical Risks

#### F-CRIT-1 — Customer service-request flow never calls the backend

- **Risk**: Critical
- **Location**: `app/(customer)/request/[service].tsx:29-39`, all six per-service forms in `components/request/forms/*Form.tsx`
- **Failure scenario**: A customer fills in the towing/battery/fuel/etc. form and taps Confirm. `handleSubmit` builds a `data` object and calls `router.push('/(customer)/request/tracking', { params })`. No call to `services/customer.service.ts:createServiceRequest` (or the V2 typed wrapper). No Firestore document is ever written. No provider is ever notified. `notifyNearbyProviders` (server side) never runs.
- **Impact**: The entire "request a service" flow is theatre. Verifiable by `grep -r 'createServiceRequest' app/ components/` → 0 hits in the customer paths. The first real customer action (tap Confirm) silently does nothing visible to the backend.
- **Recommended fix**: In `[service].tsx:handleSubmit`, before navigating to tracking:
  1. Call `getPriceQuote` (Cloud Function in `functions/src/ai/pricing.ts`) to get a `quoteId`.
  2. Call `services/customer.service.ts:createServiceRequestV2({ serviceType, customerLocation, serviceDetails, quoteId, idempotencyKey })`.
  3. If `result.ok`, navigate to `tracking?requestId=${result.data.requestId}`. Otherwise show `ErrorState`.
  4. Generate `idempotencyKey` once at form mount via `generateIdempotencyKey()` and persist in form state so retries are safe.

#### F-CRIT-2 — Tracking screens are pure animation, not real

- **Risk**: Critical
- **Location**: `app/(customer)/request/tracking/searching.tsx:108-117` (and the subsequent `en-route`, `arriving`, `in-progress`, `complete` screens)
- **Failure scenario**: After "submitting" a request, the customer arrives at `tracking/searching` which `setTimeout(9000)` then `router.replace('/(customer)/request/tracking/en-route')`. Each downstream screen does the same — fixed timers determine the perceived state. There is no `subscribeToRequest`, no `subscribeToProviderLocation`, no read of `activeRequests/{id}` from RTDB. The customer sees provider arrival, ETA, and completion regardless of whether any provider exists.
- **Impact**: Customers are lied to. Even if F-CRIT-1 were fixed, the tracking UI would diverge from reality after the request is created. Verifiable: `grep -r 'subscribeToRequest\|subscribeToProviderLocation' app/(customer)` returns zero hits.
- **Recommended fix**: Build a `useRequestLifecycle(requestId)` hook that:
  1. Subscribes to `services/customer.service.ts:subscribeToRequest(requestId, cb)`.
  2. When the request hits `accepted`, opens the RTDB subscription via `services/realtime.service.ts:subscribeToProviderLocation`.
  3. Drives screen transitions off `request.status` (`pending → searching`, `accepted → en-route`, `arrived → in-progress`, `completed → complete`) — never off `setTimeout`.
  4. Renders an `ErrorState` if the request transitions to `cancelled` or the subscription drops for >30s.

#### F-CRIT-3 — Phone OTP login is non-functional in production

- **Risk**: Critical
- **Location**: `app/(auth)/login.tsx:39-59` and `app/(auth)/verify-otp.tsx:87-92`
- **Failure scenario**: The login screen never calls `services/auth.service.ts:sendOTP`. It only formats the phone and pushes to `verify-otp.tsx`. The OTP screen then accepts the literal string `123456` (no `__DEV__` guard) and otherwise calls `verifyOTP(fullOtp)`, which immediately throws because `confirmationResult` is null (it is set only inside `sendOTP`). Production behaviour: only the hardcoded test code works.
- **Impact**: No real user can log in. The 3 of 7 assertions that "passed" during testing in the previous Devin session passed only because the test phone uses Firebase Console's "phone numbers for testing" feature, which short-circuits OTP verification entirely. With a real phone, the user would be stuck on the verify screen forever.
- **Recommended fix**:
  1. Call `sendOTP(formattedPhone, recaptchaContainerId)` in `login.tsx:handleContinue` before navigating. Show a loading state; if it fails, surface the error and do not navigate.
  2. Render an invisible reCAPTCHA container (`<View nativeID="recaptcha-container" />`) in `login.tsx`. The native iOS/Android RN target needs `@react-native-firebase/auth` integration here; current code uses the `firebase/auth` web SDK on RN, which only works on web — this is a separate gap that the next agent should explicitly call out and pick a strategy for.
  3. Replace the `123456` literal with `__DEV__` + `process.env.EXPO_PUBLIC_DEMO_MODE === 'true'` gating, OR remove it entirely and rely on Firebase test phones.

#### F-CRIT-4 — Payment modal hardcodes demo M-Pesa instead of the real callable

- **Risk**: Critical
- **Location**: `components/ui/PaymentModal.tsx:14-20, 108`
- **Failure scenario**:
  ```ts
  import {
      initiatePaymentDemo as initiatePayment,
      ...
  } from '../../services/payment.service';
  ```
  The modal imports `initiatePaymentDemo` under the alias `initiatePayment`, so every payment is a `Math.random() > 0.2` simulation regardless of `USE_DEMO_MODE`, regardless of whether the user is on production. The real `initiatePayment` (which calls the `initiateStkPush` callable) is unreachable from any UI surface.
- **Impact**: No real money ever moves. The Cloud Function we hardened in Phase 3 (HMAC, idempotency, atomic transitions) is dead code in practice. A customer who taps "Pay" sees an 80% success rate and a fake receipt.
- **Recommended fix**: Remove the alias. Use `initiatePayment` (real) and gate `initiatePaymentDemo` behind the `USE_DEMO_MODE` flag inside `payment.service.ts:initiatePayment` itself (mirror the pattern in `customer.service.ts:createServiceRequest`).

---

### Frontend High Risks

#### F-HIGH-1 — Battery service tile renders the Towing colour

- **Risk**: High (regression confirmed in Round 2 testing)
- **Location**: `app/(customer)/index.tsx:33` (constant `SERVICES` array)
- **Failure scenario**: `Battery` is hardcoded `color: '#FFA500'` (same as Towing). The theme moved `colors.service.battery` to `'#FFCA28'` post-CR specifically to break this collision, but the customer Home `SERVICES` array was never updated. DOM-confirmed at runtime: `getComputedStyle` returns `rgb(255, 165, 0)` for the Battery icon.
- **Impact**: Two adjacent tiles render the same brand orange, defeating the visual distinction between Towing (the most expensive service) and Battery (a much smaller job). Increases the chance of a customer tapping the wrong tile in a panic.
- **Recommended fix**: Derive `SERVICES` from `theme/voltage-premium.ts:colors.service.*` so the theme is the single source of truth. As an interim, change `'#FFA500'` to `'#FFCA28'` on line 33 and update the matching `bg` to `'rgba(255, 202, 40, 0.12)'`. All six tile colours should be theme-derived, not literals.

#### F-HIGH-2 — Per-service forms ignore `RequestFormShell`

- **Risk**: High (architectural)
- **Location**: `components/request/forms/TowingForm.tsx:63-74` (and the other five `*Form.tsx` files)
- **Failure scenario**: `components/request/RequestFormShell.tsx` and `components/request/use-step-flow.ts` exist as the unified Phase 4 scaffold (back chevron, title, `StepIndicator`, scroll body, footer CTA). It is unit-tested. **No per-service form imports it.** Each form re-implements the same chrome inline.
- **Impact**: Fixing chrome (e.g. adding a "Save draft" button, changing the back behaviour, fixing accessibility on the StepIndicator) requires editing six files. Drift is inevitable; visual divergence between forms will accumulate.
- **Recommended fix**: Migrate every per-service form to consume `RequestFormShell` + `useStepFlow`. The forms should only own per-step content, not the chrome. This is also a precondition for adding a global submit handler (F-CRIT-1).

#### F-HIGH-3 — Phone-auth on React Native uses the web SDK

- **Risk**: High
- **Location**: `services/auth.service.ts:44-85`, `config/firebase.ts`
- **Failure scenario**: `auth.service.ts:sendOTP` calls `RecaptchaVerifier(auth, recaptchaContainerId, {...})` from the `firebase/auth` web SDK. On React Native iOS/Android the `RecaptchaVerifier` class is unavailable and the call throws at construction time. The code path comments say "For React Native, we'll need to use a different approach" — but the different approach was never implemented.
- **Impact**: Even if F-CRIT-3 is fixed, real phone-auth will only work on the web target. Native builds would fall through to the `else` branch and explicitly throw "Recaptcha verification required for web."
- **Recommended fix**: Pick one of:
  1. Swap to `@react-native-firebase/auth` for native targets (this is the canonical RN Firebase auth path) and keep `firebase/auth` web SDK only for the web target.
  2. Or use Firebase Auth REST + a custom captcha (more work, less recommended).
  Document the chosen strategy in `docs/auth.md` and call out that test phones in Firebase Console bypass reCAPTCHA so dev/demo flows work without solving this.

#### F-HIGH-4 — `firestore.service.ts` legacy write paths bypass server-authoritative callables

- **Risk**: High
- **Location**: `services/firestore.service.ts:77-113` (`addVehicle`, `addEmergencyContact`, `addSavedLocation`)
- **Failure scenario**: These functions write directly to `users/{uid}.vehicles[]` / `.emergencyContacts[]` arrays — the legacy embedded-array model the Phase 5 callables (`functions/src/users/vehicles.ts`, `emergencyContacts.ts`) replaced with subcollections. Two stores of truth now coexist:
  - **Embedded arrays on the user doc** (legacy, written by `firestore.service.ts`).
  - **Subcollections at `users/{uid}/vehicles/*` and `users/{uid}/emergency_contacts/*`** (canonical, written only by the callables).
  Direct subcollection writes are blocked by `firestore.rules` (good), but the legacy array writes still go through. So a UI calling `firestore.service.ts:addVehicle` writes to the wrong store and the server-side `MAX_CONTACTS=5` / single-primary invariants are not enforced.
- **Impact**: Split-brain user data. Future code that reads from the subcollection sees zero entries while the user clearly added two vehicles via the legacy path. Existing UI surfaces in `app/(customer)/profile/*` likely still use the legacy path (next agent should verify).
- **Recommended fix**:
  1. Mark `firestore.service.ts:addVehicle`, `addEmergencyContact`, `addSavedLocation` as `@deprecated` (mirror the pattern already used for `createServiceRequest` in the same file) and have them throw at runtime in non-demo builds.
  2. Add new client-side wrappers that call the callables: `httpsCallable(functions, 'addVehicle')` etc.
  3. Migrate every UI call site in `app/` to the new wrappers.

#### F-HIGH-5 — Tracking screens have no error / cancellation / timeout state

- **Risk**: High
- **Location**: `app/(customer)/request/tracking/searching.tsx:120+`, all downstream tracking screens
- **Failure scenario**: There is a 60-second "timeout fallback" but no surface for: provider rejected the request, no providers in range, customer cancelled, network dropped, tracking subscription failed. Every state advances on timer; `request.status === 'cancelled'` (server-emitted) has no UI path.
- **Impact**: A real user whose request times out, is rejected, or whose connection drops sees a happy "provider arriving" screen forever.
- **Recommended fix**: Add explicit branches for `pending` (>X minutes → "no providers nearby" CTA), `cancelled`, `failed`. Use the `<ErrorState>` component already in `components/ui/ErrorState.tsx`. Subscribe to the request and react to the canonical status, not the timer.

---

### Frontend Medium Risks

#### F-MED-1 — `ErrorBoundary` only logs; no recovery affordance

- **Risk**: Medium
- **Location**: `app/_layout.tsx` (top-level `<ErrorBoundary>`)
- **Failure scenario**: A render-time crash in any child triggers `ErrorBoundary` which shows a generic error UI and logs to console. There is no "Reload" / "Sign out" / "Report issue" button, no Sentry / Crashlytics integration, no structured error reporting back to the user.
- **Impact**: A single React crash bricks the app for the session. Users have to force-quit. No telemetry tells the team it happened.
- **Recommended fix**: Add (a) a "Reload" CTA that calls `router.replace('/')`, (b) a "Sign out" CTA, (c) integrate `expo-error-reporter` or `@sentry/react-native` with the env-driven DSN.

#### F-MED-2 — Customer `SERVICES` array re-defines what `theme` already owns

- **Risk**: Medium
- **Location**: `app/(customer)/index.tsx:30-37`
- **Failure scenario**: The `SERVICES` array hardcodes `id`, `name`, `icon`, `color`, `bg`, `keywords` per service. The theme already exports `colors.service.{towing,battery,fuel,tire,diagnostics,ambulance}` and `SERVICE_TYPES` exists in `types/api.ts`. Two sources of truth for the same data; they have already drifted (F-HIGH-1 is one consequence).
- **Impact**: Adding a service requires touching the home screen, the theme, `types/api.ts`, the request route map, and tests. Future drift is guaranteed.
- **Recommended fix**: Define a single `SERVICE_CATALOG: Record<ServiceType, ServiceMeta>` constant in `constants/services.ts`. Have the home screen, the request route, the SmartIntentBar keyword matching, and tests all import from it.

#### F-MED-3 — `EntryScreen` does not handle a logged-in user with NO role

- **Risk**: Medium
- **Location**: `app/index.tsx:52-88` (the auth-gated navigation effect)
- **Failure scenario**: When `isAuthenticated && !isLoading && !userRole`, the effect falls through and the LandingPage renders (orange background). This happens in the brief window between `onAuthChange` firing and `getUserProfile` / `checkIsProvider` resolving — the AuthContext sets `isLoading=false` only after both promises resolve, so there is no race today, but the assumption is implicit.
- **Impact**: If `getUserProfile` succeeds and `checkIsProvider` fails (unlikely but possible — see B-MED-X below), `userRole` is `null` and the user is bounced back to the LandingPage despite being signed in. They will see the orange "Sign In" CTA while already authenticated.
- **Recommended fix**: Add an explicit branch: `isAuthenticated && !userRole → render <PendingRoleScreen />` with a retry button that calls `refreshUserProfile`.

#### F-MED-4 — `EmergencySOS` countdown is non-cancellable from outside

- **Risk**: Medium
- **Location**: `components/EmergencySOS.tsx:1-157+`
- **Failure scenario**: The SOS button opens a 5-second countdown modal. There is no programmatic way (deep link, navigation guard, or external state change) to cancel the countdown. If the user backgrounds the app mid-countdown, the timer keeps running on resume. Also no `confirm` step before the `Linking.openURL('tel:999')` call — accidental long-presses can dial.
- **Impact**: Accidental dispatch to Kenya emergency numbers wastes responder bandwidth and may incur fees. Repeated accidental presses by the same user could be abuse-flagged.
- **Recommended fix**: Add a "Hold to confirm" pattern (require sustained press) OR a 2-tap pattern (first press primes, second press dispatches), in addition to the countdown. Cancel the timer on `AppState` change to `background`.

#### F-MED-5 — Splash → animations chain has no `useNativeDriver` audit

- **Risk**: Medium (perf)
- **Location**: `app/(customer)/request/tracking/searching.tsx:50-98`, `app/(auth)/login.tsx:27-32`, others
- **Failure scenario**: Most `Animated.timing` calls correctly set `useNativeDriver: true`, but `progressSlide` in `searching.tsx:94-95` uses `useNativeDriver: false`, animating a layout property on the JS thread. Combined with three radar rings + bouncing dots all running concurrently, low-end Android devices will drop frames.
- **Impact**: Janky animation on the surface customers see while waiting for an emergency provider — exactly the surface where "the app feels slow" reads as "the app is broken".
- **Recommended fix**: Convert `progressSlide` to a transform or width animation that supports the native driver, OR throttle the concurrent animations on Android. Profile with React DevTools / Hermes profiler on a real device.

#### F-MED-6 — Hardcoded `+254` country prefix; no internationalization affordance

- **Risk**: Medium
- **Location**: `app/(auth)/login.tsx:107-108`, `services/auth.service.ts:22-37`
- **Failure scenario**: The login UI renders `🇰🇪 +254` and `formatPhoneNumber` always returns a `+254` prefix. A user with a non-Kenyan SIM (e.g. a Tanzanian visitor passing through Nairobi during an emergency) cannot register.
- **Impact**: Real on the Kenya–Tanzania border, Kenya–Uganda border, and for tourists. Phase 1's stated scope is Kenya-first, so this is fine for MVP but should be flagged.
- **Recommended fix**: Out of scope for the current rebuild unless explicitly requested; just document the limitation.

#### F-MED-7 — `KENYA_EMERGENCY_NUMBERS` are not configurable

- **Risk**: Medium
- **Location**: `components/EmergencySOS.tsx` (`Linking.openURL('tel:...')`)
- **Failure scenario**: The hardcoded list of Kenyan emergency numbers (police 999, ambulance, fire) is inside a component file. If a number changes (or the app is deployed in a new region), the change requires a binary release.
- **Impact**: Slow recovery from a misdialed number; impossible regional fork.
- **Recommended fix**: Move to `constants/emergency-numbers.ts` keyed by country, default to `KE`. Eventually source from a Firestore `config/{region}` doc.

---

### Frontend Low Risks / Quality

#### F-LOW-1 — `App.tsx` is dead

- **Risk**: Low
- **Location**: `App.tsx` (file exists at root but `package.json:main` is `expo-router/entry`).
- **Failure scenario**: Confusing for new contributors who try to edit `App.tsx` and see no effect.
- **Recommended fix**: Delete `App.tsx`.

#### F-LOW-2 — Inline styles + StyleSheet duplication

- **Risk**: Low
- **Location**: scattered across `app/(auth)/*.tsx`, `app/(customer)/*.tsx`
- **Failure scenario**: Some screens mix StyleSheet with inline `style={{ ... }}`; this defeats StyleSheet caching. Minor perf and readability hit.
- **Recommended fix**: As part of the rebuild, standardize on StyleSheet + theme tokens.

#### F-LOW-3 — Accessibility coverage is thin

- **Risk**: Low → could become Medium
- **Location**: Most screens
- **Failure scenario**: Some `Pressable`s have `accessibilityLabel` / `accessibilityRole`, many do not. No `accessibilityState={{ disabled }}` on disabled CTAs. No `accessibilityLiveRegion` on loading states.
- **Recommended fix**: As part of the rebuild, run `npx eslint --fix` with `eslint-plugin-react-native-a11y` and fix all warnings.

#### F-LOW-4 — `console.log` / `console.warn` in shipped code

- **Risk**: Low
- **Location**: `services/auth.service.ts:51,59,62`, `services/payment.service.ts:41`, `services/firestore.service.ts:252`, others.
- **Failure scenario**: Production builds ship verbose logs including phone numbers and request payloads. PII risk.
- **Recommended fix**: Replace with a shared `services/logger.ts` that no-ops in production and elides PII fields.

#### F-LOW-5 — `Math.random` used as id seed

- **Risk**: Low
- **Location**: `services/customer.service.ts:60` (idempotency key fallback), `functions/src/ai/pricing.ts:132` (quote id)
- **Failure scenario**: Math.random is non-cryptographic. Collisions over a 9-character base36 suffix happen at ~36^4.5 ≈ 8M ids; unlikely but not impossible at scale.
- **Recommended fix**: For the client fallback, prefer `expo-crypto` `randomUUID`. For the server quote id, use `crypto.randomUUID()` or `nanoid`.

---

### Frontend Test Skepticism

The frontend test suite at HEAD is **mostly mirror tests, not behavioural tests**. I read every file in `__tests__/screens/`, `__tests__/components/`, and `__tests__/services/`. Findings:

- **`__tests__/screens/auth.test.ts`**: tests local copies of `isValidPhone` and `formatPhoneNumber` defined inside the test file itself. It does not import the screen, does not render it, does not exercise the `handleContinue` / `handleVerify` paths. F-CRIT-3 (login never calls `sendOTP`) is invisible to this test.
- **`__tests__/screens/tracking-lifecycle.test.ts`**: tests local copies of `LOADING_MESSAGES`, `IN_PROGRESS_STEPS` constants. Does not render any screen. F-CRIT-2 (timer-driven tracking) is invisible.
- **`__tests__/components/use-step-flow.test.ts`**: tests the `useStepFlow` hook in isolation. Does not assert that any per-service form actually consumes it. F-HIGH-2 (forms ignore RequestFormShell) is invisible.
- **`__tests__/services/customer.service.test.ts`**: asserts `typeof createServiceRequest === 'function'`. Does not assert it gets called from any UI path. F-CRIT-1 is invisible.
- **`__tests__/services/payment.service.test.ts`**: tests `validatePhoneNumber` and `formatPhoneForMpesa`. Does not assert PaymentModal calls the real `initiatePayment`. F-CRIT-4 is invisible.
- **`__tests__/services/customer-demo-mode.test.ts`**: regression suite for the post-CR demo-mode default-OFF fix. Genuinely useful, but covers exactly one bug class.

**Test gaps**:

1. No integration test renders `[service].tsx` and asserts `createServiceRequest` is called.
2. No integration test renders `tracking/searching.tsx` with a fake `requestId` and asserts `subscribeToRequest` is invoked.
3. No integration test renders `login.tsx` and asserts `sendOTP` is called on Continue.
4. No integration test renders `PaymentModal` and asserts the **real** `initiatePayment` is called when `USE_DEMO_MODE === false`.
5. No accessibility test (no `axe-core`, no `react-native-testing-library` `getByRole` queries on critical flows).

The reported "1,136 tests passing" is an **inventory** assertion, not a **behaviour** assertion. The next agent should treat it as such — passing tests do not establish that any of F-CRIT-1..4 have not regressed.

---

## BACKEND ISSUES

> **Audience**: us, in this Devin session. We will fix these together after the next agent has the audit.

### Backend — System Flow Map

**1. Cloud Functions (callables) registered in `functions/src/index.ts`**:
- `services/requests.ts`: `createServiceRequest`, `acceptServiceRequest`, `updateRequestStatus`.
- `mpesa/stkPush.ts`: `initiateStkPush` (callable), `verifyCallbackToken` (helper).
- `mpesa/callback.ts`: `mpesaCallback` (HTTP, called by Safaricom).
- `users/vehicles.ts`: `addVehicle`, `updateVehicle`, `deleteVehicle`.
- `users/emergencyContacts.ts`: `addEmergencyContact`, `updateEmergencyContact`, `deleteEmergencyContact`.
- `wallet/wallet.ts`: `topupWallet`, `deductWallet` (atomic ledger).
- `providers/location.ts`: `updateProviderLocation`, `setProviderAvailability`.
- `medical/hospitals.ts`: `registerHospital`, `findNearestHospitals`, etc.
- `ai/dispatch.ts`: `findOptimalProvider`.
- `ai/pricing.ts`: `getPriceQuote`, `updateZoneSurge`.

**2. Firestore triggers**:
- `services/triggers.ts:onRequestStatusChange`: mirrors `requests/{id}` lifecycle to `activeRequests/{id}` in RTDB.
- `services/triggers.ts:resetDailyEarnings`: 00:05 Africa/Nairobi pubsub cron, paginates providers, zeroes `earnings.today`.
- `providers/location.ts:autoOfflineCheck`: 5-minute pubsub cron.

**3. Realtime Database**:
- `activeRequests/{requestId}`: `{ requestId, providerId, status, customerLocation, providerLocation, providerStale, updatedAt }`.

**4. External integrations**:
- Safaricom Daraja (M-Pesa) — `axios.get(${baseUrl}/oauth/v1/generate)`, `axios.post(${baseUrl}/mpesa/stkpush/v1/processrequest)`.
- Firebase Cloud Messaging — provider notifications via `admin.messaging().send`.

**5. Idempotency / state-machine contracts**:
- `createServiceRequest`: deterministic doc id from `SHA256(uid:idempotencyKey)`.
- `initiateStkPush`: `payment_requests/{idempotencyKey}` reservation row.
- `topupWallet` / `deductWallet`: `wallets/{uid}/ledger/{idempotencyKey}`.
- `mpesaCallback`: HMAC-signed token in URL; atomic `pending → completed|failed`; provider earnings credit gated on `requestData.providerId`.

---

### Backend Critical Risks

#### B-CRIT-1 — `payment.service.ts:initiatePayment` drops the required `idempotencyKey`

- **Risk**: Critical
- **Location**: `services/payment.service.ts:39-72`
- **Failure scenario**: The client-side `initiatePayment` builds:
  ```ts
  await initiateStkPush({ phoneNumber, amount, requestId, description });
  ```
  but the Cloud Function `functions/src/mpesa/stkPush.ts:203-208` requires `idempotencyKey` (16-64 chars `[A-Za-z0-9_-]`):
  ```ts
  if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length < 16 || idempotencyKey.length > 64) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid idempotencyKey');
  }
  ```
  Even if F-CRIT-4 is fixed (PaymentModal calls the real path), every M-Pesa request would be rejected at validation.
- **Impact**: The fix for F-CRIT-4 alone would shift the failure mode from "fake demo success" to "every payment rejected with `invalid-argument`". The frontend cannot fix this without backend cooperation.
- **Recommended fix**: Add `idempotencyKey: generateIdempotencyKey()` to the client request payload (mirror what `customer.service.ts:createServiceRequestV2` does). The frontend rebuild plan must include this. Optionally, also add a sentinel error code on the server so a missing-key client gets a clearer message.

#### B-CRIT-2 — Clients can squat M-Pesa idempotency keys via Firestore rules

- **Risk**: Critical
- **Location**: `firestore.rules:127-129` (`payment_requests/{requestId}` create rule)
- **Failure scenario**: The rule allows a client to `create` a `payment_requests/{anyId}` doc as long as `request.resource.data.userId == request.auth.uid`. The Cloud Function uses `payment_requests/{idempotencyKey}` as the doc id. Idempotency keys are 16-64 chars `[A-Za-z0-9_-]`, plenty of entropy, but a malicious authenticated user can:
  1. Pick or guess an idempotency key (e.g. by observing their own client's outputs and reusing them, or by mass-creating keys).
  2. Pre-create a `payment_requests/{key}` doc with their own `userId` set to themselves.
  3. The next time the Cloud Function tries `tx.create(paymentRef, ...)` with the same key it fails (`already exists`); the function then returns `duplicate: true` with the squatted row's status.
  Worst case: a malicious user pre-creates rows with `status: 'completed'` to confuse the duplicate-handling path. The function's duplicate branch returns:
  ```ts
  return {
      success: existing.status !== 'failed',
      duplicate: true,
      status: existing.status,
      checkoutRequestID: existing.checkoutRequestID ?? null,
  };
  ```
  A client-pre-created row with `status: 'completed'` would make the next legitimate call return `success: true, duplicate: true, status: 'completed'` even though no STK push was ever issued.
- **Impact**: Customers think they paid; the request is marked paid in the UI; the provider is never paid (because no callback ever arrives); the merchant is left with an angry customer and a confused provider.
- **Recommended fix**: Tighten the rule to prevent client creates entirely:
  ```
  match /payment_requests/{requestId} {
    allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
    allow create, update, delete: if false;
  }
  ```
  All `payment_requests` writes are server-authoritative anyway (admin SDK bypasses rules). This is the same pattern Phase 5 used for `vehicles` and `emergency_contacts` subcollections.

#### B-CRIT-3 — `requests` rule allows clients to create with arbitrary `status` and `providerId`

- **Risk**: Critical
- **Location**: `firestore.rules:104-105`
- **Failure scenario**:
  ```
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
  ```
  This permits a client-side write that sets `status: 'completed'`, `providerId: 'whatever'`, `payment.status: 'completed'`, etc. The canonical `createServiceRequest` callable always sets `status: 'pending'`, but the rule does not enforce that. A malicious client can:
  1. Bypass the callable entirely.
  2. Write a `requests/{id}` doc with `status: 'accepted'` and `providerId: <attacker's uid>` to assign themselves a fake job.
  3. Write `status: 'completed'` with a `payment.status: 'completed'` to fake a paid job.
- **Impact**: An attacker can manufacture provider earnings entries (because the `mpesaCallback` transaction reads `requestData.providerId` and credits earnings on first transition — but only when the payment row already exists, so this specific exploit is gated by B-CRIT-2). Combined with B-CRIT-2, an attacker can fabricate an entire pay-out chain with no real STK push.
- **Recommended fix**: Tighten:
  ```
  allow create: if isAuthenticated()
    && request.resource.data.userId == request.auth.uid
    && request.resource.data.status == 'pending'
    && !('providerId' in request.resource.data);
  ```
  Better: lock writes entirely (`allow create: if false;`) and require all `requests` creation via the callable. The `firestore.service.ts:createServiceRequest` shim (already deprecated) is the only legitimate direct-write path and it should be removed.

#### B-CRIT-4 — `requests` update rule lets the assigned provider set any field, including `payment` and `pricing`

- **Risk**: Critical
- **Location**: `firestore.rules:109-112`
- **Failure scenario**:
  ```
  allow update: if isAuthenticated() && (
    (resource.data.userId == request.auth.uid && resource.data.status == 'pending') ||
    (resource.data.providerId == request.auth.uid)
  );
  ```
  A provider assigned to a request can update **every field** on the request doc, including `pricing.total`, `payment.status`, `userId`, etc. The expected invariant is "provider can only update lifecycle status fields" — that is enforced inside `updateRequestStatus` callable, but the rule itself lets the provider write anything.
- **Impact**: A malicious provider can set `pricing.total: 1` on a job they accepted, or `payment.status: 'completed'` to mark themselves paid before they were. Combined with the earnings credit logic in `mpesaCallback`, this is a fraud vector.
- **Recommended fix**: Either lock direct provider updates entirely (route everything through `updateRequestStatus` callable) OR use a `request.resource.data.diff(resource.data).affectedKeys()` allow-list:
  ```
  allow update: if ... && request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(['status', 'timeline', 'providerLocation', 'updatedAt']);
  ```

#### B-CRIT-5 — `acceptServiceRequest` does not verify the provider is verified / online

- **Risk**: Critical
- **Location**: `functions/src/services/requests.ts:290-363`
- **Failure scenario**: The transaction only checks `requestData.status === 'pending'`. It does not check:
  - the caller's `providers/{uid}` doc has `verificationStatus === 'verified'`,
  - `availability.isOnline === true`,
  - `serviceTypes` includes `requestData.serviceType`,
  - the provider doesn't already have an active request (`availability.currentRequestId` non-null).
  An unverified, offline, or wrong-service provider can accept any pending request.
- **Impact**: A non-towing provider accepts a towing job and customer gets stuck. An unverified provider gets paid via `mpesaCallback`'s earnings credit.
- **Recommended fix**: Inside the same transaction, `tx.get(providers/{uid})`, validate the four invariants, throw `failed-precondition` otherwise.

#### B-CRIT-6 — `mpesaCallback` HMAC verifies token but does not re-verify amount

- **Risk**: Critical
- **Location**: `functions/src/mpesa/callback.ts:128-141, 149-219`
- **Failure scenario**: The HMAC keys on `(idempotencyKey, amount)` (`stkPush.ts:verifyCallbackToken`). The callback loads `paymentData.amount` from Firestore and verifies the token against that. Good. But the callback then **trusts the M-Pesa-reported amount in `CallbackMetadata.Item` for the receipt display only**, never reconciles. If Safaricom or an attacker reports a different `Amount` in the metadata, the receipt shown to the user could differ from the actual debited amount. Also, if `paymentData.amount` was inadvertently mutated between STK push and callback (admin only via console), the HMAC still passes.
- **Impact**: Receipt mismatch is a customer-trust issue. Not as severe as B-CRIT-2/3/4, but worth flagging.
- **Recommended fix**: Extract `Amount` from `CallbackMetadata.Item` and compare to `paymentData.amount`. If they differ, mark the row `failed` with reason `amount_mismatch` and alert.

---

### Backend High Risks

#### B-HIGH-1 — `provider.service.ts` legacy data layer drifts from canonical callables

- **Risk**: High
- **Location**: `services/firestore.service.ts:77-113, 247-275, 425-460`, contrasted with `services/customer.service.ts` and `functions/src/users/*.ts`
- **Failure scenario**: Three parallel data layers exist:
  1. Embedded arrays on `users/{uid}` (legacy, written by `firestore.service.ts:addVehicle/addEmergencyContact`).
  2. Subcollections at `users/{uid}/vehicles` and `users/{uid}/emergency_contacts` (canonical, server-authoritative).
  3. Top-level `vehicles/{id}` collection (legacy, now read-only via rules).
  No migration script reconciles them. Reads from the subcollections will return zero entries for users whose UI wrote to the array.
- **Impact**: Bugs are silent; users will see "I added my Toyota" but the dispatch system won't see it.
- **Recommended fix**: Write a `functions/src/migrations/reconcileVehicles.ts` callable that reads `users/{uid}.vehicles[]`, dedupes against the subcollection, writes missing entries via the canonical path, and clears the array. Same for emergency contacts. Run it once per user on first login post-migration.

#### B-HIGH-2 — `firestore.service.ts:updateRequestStatus` writes the request status directly, bypassing the callable's transition graph

- **Risk**: High
- **Location**: `services/firestore.service.ts:294-323`
- **Failure scenario**: This is a client-side `updateDoc` to the request. Phase 3 introduced `VALID_STATUS_TRANSITIONS` in `functions/src/shared/status.ts` and the `updateRequestStatus` callable enforces it. The client-side shim does not. Any code that imports `updateRequestStatus` from `firestore.service` (vs. `provider.service.ts:updateRequestStatus` which calls the callable) bypasses the transition graph.
- **Impact**: A buggy or malicious client can write `status: 'completed'` from a `pending` request, skipping `accepted/enroute/arrived/inProgress`. Concurrent transitions are not serialized.
- **Recommended fix**: Mark `firestore.service.ts:updateRequestStatus` as `@deprecated` and have it throw at runtime in production. Audit all callsites and migrate to `provider.service.ts:updateRequestStatus` (which calls the callable).

#### B-HIGH-3 — `updateProviderLocation` writes to RTDB without transaction, can stomp lifecycle seed

- **Risk**: High
- **Location**: `functions/src/providers/location.ts:64-79`
- **Failure scenario**: Three sequential `set()` calls (`/providerLocation`, `/providerStale`, `/updatedAt`). Phase 3's `onRequestStatusChange` does seed via a `transaction()` to preserve the live `providerLocation`. But `updateProviderLocation` itself uses three independent `set()` calls — there's no transaction guarantee that the three writes land together with the in-flight `onRequestStatusChange` seed.
- **Impact**: Race window: lifecycle seed runs `transaction()` and reads "no providerLocation, set seed", then `updateProviderLocation` runs three `set()`s. Order interleavings can produce partial state (e.g. `/providerLocation` updated to fresh value but `/updatedAt` still showing the seed timestamp), confusing the customer's stale detection.
- **Recommended fix**: Replace the three sequential `set()`s with a single `update({ providerLocation, providerStale, updatedAt })` call. Or use a `transaction()` consistent with Phase 3's seed.

#### B-HIGH-4 — `notifyNearbyProviders` swallows errors, request continues without dispatch

- **Risk**: High
- **Location**: `functions/src/services/requests.ts:182` and `notifyNearbyProviders` body (lines around 200-285)
- **Failure scenario**: The call to `notifyNearbyProviders` is awaited but its internal failures (Firestore query errors, FCM 5xx, malformed provider docs) are caught and logged. The request itself is already created (line 168, inside the transaction); if dispatch fails, the request sits in `pending` forever with no provider notified.
- **Impact**: Customers see "request created" but no provider arrives. No retry, no dead-letter queue.
- **Recommended fix**: Add a Firestore trigger `onRequestCreated` that re-runs dispatch on retry. Or queue dispatch via Cloud Tasks with exponential backoff. Track dispatch state on the request doc (`dispatch.attemptedAt`, `dispatch.notifiedCount`).

#### B-HIGH-5 — `findNearestHospitals` (and other geo callables) not bounded on response size

- **Risk**: High
- **Location**: `functions/src/medical/hospitals.ts:113-280` (`findNearestHospitals` callable), `functions/src/ai/dispatch.ts:175-280` (`findOptimalProvider`)
- **Failure scenario**: `findOptimalProvider` queries every online verified provider matching the service type (no `.limit()`), then iterates them in JS, doing a per-provider stats subcollection `get` (line 236-237). At 200+ providers, this is 200+ extra Firestore reads per dispatch + memory bloat.
- **Impact**: O(N) cost per dispatch where N = total online providers in the city. Costs scale poorly. P95 latency rises with provider count.
- **Recommended fix**: Pre-filter via geohash bounds (already imported `geofire-common`), `.limit(50)`, denormalize stats onto the provider doc, OR cache stats via a daily rollup.

#### B-HIGH-6 — Provider earnings credit happens before delivery confirmation

- **Risk**: High
- **Location**: `functions/src/mpesa/callback.ts:206-218`
- **Failure scenario**: When the M-Pesa callback marks the payment `completed`, the function immediately credits the provider 75% of `paymentData.amount` to `earnings.{today,thisWeek,thisMonth,allTime}`. But `request.status` is **not** updated to `completed` here (Phase 3 fix). So the provider's `earnings.today` reflects payments for jobs they have not yet completed (or even started after acceptance). If the provider abandons the job after the customer pays:
  - the request remains `accepted`/`enroute`,
  - the customer's money is gone,
  - the provider's `earnings.allTime` is permanently credited.
- **Impact**: Pre-paid abandonment fraud. The provider has zero incentive to complete the job once paid. Also, the daily reset (`resetDailyEarnings`) only zeroes `earnings.today`; the all-time and weekly aggregates are permanent.
- **Recommended fix**: Hold provider earnings in `escrow.{today,etc}` on payment-completed. Move escrow → earnings only on `request.status: 'completed'` transition (in `updateRequestStatus`'s atomic block). Dispute window of e.g. 24 hours before commit.

#### B-HIGH-7 — `setProviderAvailability` does not verify provider is verified

- **Risk**: High
- **Location**: `functions/src/providers/location.ts:92-128`
- **Failure scenario**: Any authenticated caller can flip their own `providers/{uid}.availability.isOnline` to `true`. There's no check that the user is even registered as a provider, let alone verified. A customer with a `users/{uid}` doc can also have a `providers/{uid}` doc by virtue of the rules allowing self-create. Becoming "online and verified" requires only a write to `verificationStatus: 'verified'` — and `firestore.rules:82-83` allow the provider to update their own doc, including `verificationStatus`.
- **Impact**: Self-verification. Any user can mark themselves a verified provider, go online, and start accepting jobs. Combined with B-CRIT-5 / B-CRIT-3 this is a complete onboarding bypass.
- **Recommended fix**:
  1. In `setProviderAvailability`, `tx.get(providers/{uid})`, throw if `verificationStatus !== 'verified'`.
  2. In `firestore.rules`, prohibit clients from updating `verificationStatus`:
     ```
     allow update: if ... && !('verificationStatus' in request.resource.data.diff(resource.data).affectedKeys());
     ```
  3. Move `verificationStatus` writes to an admin-only callable.

---

### Backend Medium Risks

#### B-MED-1 — `checkIsProvider` failure resets entire auth state

- **Risk**: Medium
- **Location**: `services/AuthContext.tsx:30-60`
- **Failure scenario**: `Promise.all([getUserProfile, checkIsProvider])` — if either rejects, the catch block sets `isAuthenticated: false`. A transient Firestore read failure logs the user out client-side even though Firebase Auth still has the session.
- **Impact**: Spurious logouts on flaky networks, especially during the splash → home transition. Combined with F-CRIT-3, this is a self-healing logout loop on bad connections.
- **Recommended fix**: Use `Promise.allSettled`. On `checkIsProvider` failure default `userRole = 'customer'` (or surface a "couldn't determine role" state) without dropping the session.

#### B-MED-2 — `users` rules allow self-write of every field including `membership` and `loyaltyPoints`

- **Risk**: Medium
- **Location**: `firestore.rules:27-34`
- **Failure scenario**: `allow update: if isAuthenticated() && isOwner(userId)` lets the user set their own `membership: 'corporate_premium'` or `loyaltyPoints: 999999`. There is no field-level allow-list.
- **Impact**: Loyalty/membership programs are trivially bypassable.
- **Recommended fix**: Either move `membership` / `loyaltyPoints` to a separate doc that only Cloud Functions can write, or use `affectedKeys().hasOnly([...])` to restrict client writes to `displayName`, `email`, `fcmToken`, etc.

#### B-MED-3 — `mpesaCallback` notification path is not idempotent

- **Risk**: Medium
- **Location**: `functions/src/mpesa/callback.ts:222-240`
- **Failure scenario**: Notification send happens **after** the transaction commits. If the function exits early (e.g. memory pressure) and Safaricom retries, the next callback re-enters, hits the `status === 'completed'` short-circuit on line 144, and never sends the notification. Conversely, a duplicate callback that races past the short-circuit could send two notifications.
- **Impact**: Either zero or two "Payment Successful" pushes for one payment. Annoying, not catastrophic.
- **Recommended fix**: Move notification dispatch into a `paymentRef` field write (`notificationSentAt`), checked atomically.

#### B-MED-4 — `resetDailyEarnings` `for (let safety = 0; safety < 1000; safety++)` is a fragile cap

- **Risk**: Medium
- **Location**: `functions/src/services/triggers.ts:119-133`
- **Failure scenario**: The pagination loop has a hard cap of 1000 iterations × 400 providers/page = 400 000 providers. If the system ever grows past that, the cron silently stops resetting. There's no alert.
- **Impact**: Future scale issue. Today, harmless.
- **Recommended fix**: Replace the safety counter with `if (page.size < PAGE_SIZE) break;` (already there). Remove the loop bound. Add an alert log if the loop runs more than e.g. 500 times.

#### B-MED-5 — `updateZoneSurge` is `onCall` with `context.auth.token.admin` check, but `admin` claim is never set anywhere

- **Risk**: Medium
- **Location**: `functions/src/ai/pricing.ts:254-330`
- **Failure scenario**: `if (!context.auth?.token?.admin) throw permission-denied`. Custom claims are set via `admin.auth().setCustomUserClaims`. There is no callable / script in this repo that sets the `admin` claim for any user. `updateZoneSurge` is therefore unreachable.
- **Impact**: Surge pricing zones never update. Surge is permanently disabled (multiplier = 1.0).
- **Recommended fix**: Add an admin bootstrap callable (gated by an env-var bootstrap secret on first call) or accept this is dead code and document it. Either way, document the surge-pricing operational story.

#### B-MED-6 — STK push consumer secret / passkey configuration via `functions.config()` is deprecated

- **Risk**: Medium
- **Location**: `functions/src/mpesa/stkPush.ts:75-95` (referenced — full code not in this slice)
- **Failure scenario**: `firebase functions:config:set` was deprecated in Cloud Functions for Firebase v4. New functions should read from `process.env` via `defineString` from `firebase-functions/params`.
- **Impact**: Future Firebase versions may break the config path. Today, fine.
- **Recommended fix**: Migrate to `defineSecret('MPESA_CONSUMER_SECRET')` etc. Document in `docs/secrets.md`.

#### B-MED-7 — `payment_requests` reservation creates row in `status: 'initiating'` but does not transition on STK call failure

- **Risk**: Medium
- **Location**: `functions/src/mpesa/stkPush.ts:215-260+` (full STK path not fully shown but the pattern is visible)
- **Failure scenario**: After reserving the row, the function calls Safaricom's `stkpush/v1/processrequest`. If that HTTP call throws (network, 5xx, timeout), the row is stuck in `initiating`. The next retry with the same idempotency key sees `existing.status === 'initiating'` and returns it as a duplicate, so the customer is told it's already pending — but Safaricom never received the request. The customer is stuck.
- **Impact**: A single network blip on Safaricom's side leaves the row in a bad state forever, and idempotency permanently blocks retries.
- **Recommended fix**: On Safaricom call failure, mark the row `failed` with a transient reason. The duplicate-handler should treat `status: 'failed'` as "OK to retry".

#### B-MED-8 — `axios` requests to Safaricom have no timeout

- **Risk**: Medium
- **Location**: `functions/src/mpesa/stkPush.ts:131-138` and the STK push call (not in shown slice but same pattern)
- **Failure scenario**: `axios.get(...)` and `axios.post(...)` use the default Axios timeout of "no timeout". Cloud Function execution can hang for the full 60s/300s timeout if Safaricom is slow.
- **Impact**: Wasted function-seconds, blocked customer flows during Safaricom outages.
- **Recommended fix**: `axios.get(url, { timeout: 8000 })`. Catch `ETIMEDOUT` and mark the payment row `failed_transient`.

#### B-MED-9 — Cloud Function `findOptimalProvider` does not consider zones

- **Risk**: Medium
- **Location**: `functions/src/ai/dispatch.ts:80-92` (commented-out `NAIROBI_ZONES`)
- **Failure scenario**: The intent (zone priority) is documented but disabled. Dispatch is purely distance-based.
- **Impact**: Functional gap, not a bug. Tests reference zone-aware dispatch but the runtime selector ignores zones.
- **Recommended fix**: Either implement zone priority or remove the commented block.

#### B-MED-10 — Demo-mode subscription returns `Partial<ServiceRequest>` cast as full

- **Risk**: Medium
- **Location**: `services/customer.service.ts:188-220`
- **Failure scenario**: Demo mode synthesizes a `Partial<ServiceRequest>`, then casts to `ServiceRequest` and invokes the callback. Any code reading fields not synthesized (e.g. `pricing.total`, `customerLocation.coordinates`) gets `undefined` and either crashes or shows blanks.
- **Impact**: Demo mode UX is partially broken depending on which surface consumes the partial.
- **Recommended fix**: Synthesize a complete fixture object, OR define a `DemoServiceRequest` subset type and only let demo-mode-aware code consume it.

---

### Backend Low Risks / Quality

#### B-LOW-1 — `ServiceType` defined in three places

- **Risk**: Low
- **Location**: `functions/src/ai/dispatch.ts:10`, `functions/src/ai/pricing.ts:10`, `types/api.ts`
- **Failure scenario**: Each functions file re-defines `ServiceType` to avoid cross-package imports; if `types/api.ts:ServiceType` adds a new variant (e.g. `'locksmith'`), the pricing/dispatch files silently miss it.
- **Recommended fix**: Either move to `functions/src/shared/types.ts` (already exists for some types), or set up a mono-repo alias so `functions/src/*.ts` can import `types/api.ts` directly.

#### B-LOW-2 — Multiple uses of `as any` / `error: any`

- **Risk**: Low
- **Location**: `functions/src/providers/location.ts:84,124`, `functions/src/medical/hospitals.ts:89`, etc.
- **Failure scenario**: TypeScript safety bypassed; future error-shape changes are silent.
- **Recommended fix**: `error: unknown` + `instanceof Error` check (the pattern Phase 1 introduced and most newer code uses).

#### B-LOW-3 — `geofire.distanceBetween` returns km but is multiplied by `radiusKm * 1000` in `findNearestProviders`

- **Risk**: Low
- **Location**: `services/firestore.service.ts:166-168`
- **Failure scenario**: `geofire.geohashQueryBounds(center, radiusM)` expects metres; the code passes `radiusM = radiusKm * 1000`. Then `geofire.distanceBetween` returns km. The post-filter `if (distance <= radiusKm)` is correct in km but spelled inconsistently. Easy to misread.
- **Recommended fix**: Inline a `RADIUS_M = radiusKm * 1000` and `DISTANCE_KM = geofire.distanceBetween(...)` to make units explicit.

#### B-LOW-4 — `console.log` / `console.warn` in production callables

- **Risk**: Low
- **Location**: `functions/src/services/requests.ts:280,282,187`, others
- **Failure scenario**: Cloud Logging captures everything; no PII redaction.
- **Recommended fix**: Use `functions.logger.info/warn/error` (structured JSON) and redact PII (`phone`, `address`).

#### B-LOW-5 — `firebase.json` does not list `database.rules.json`

- **Risk**: Low
- **Location**: `firebase.json` (no `database` block)
- **Failure scenario**: `activeRequests/*` and `providerLocations/*` are read/written by both client and server. With no RTDB rules deployed, the default is "deny all" for unauthenticated and "allow all" for authenticated — meaning any authenticated user can read/write any other user's `activeRequests/{id}` node.
- **Impact**: Privacy: a curious authenticated user can subscribe to anyone's live ride. Integrity: a malicious authenticated user can write fake provider locations to any active request.
- **Recommended fix**: Add `database.rules.json` with per-node auth checks (request owner / assigned provider) and reference it from `firebase.json`.

#### B-LOW-6 — Cloud Function `getPriceQuote` writes a quote doc but doesn't expire stale quotes

- **Risk**: Low
- **Location**: `functions/src/ai/pricing.ts:213-237`
- **Failure scenario**: `validUntil = now + 10min`, but no TTL policy and no cron deletes expired quotes. The collection grows unboundedly.
- **Recommended fix**: Add a Firestore TTL policy on `price_quotes.validUntil` (Firebase native TTL) or a daily cron that deletes expired entries.

---

### Backend Test Skepticism

The functions test suite was not opened for individual test reading in this audit pass, but I scanned `__tests__/services/*.ts` filenames. Observations:

- Tests like `customer.service.test.ts:157-159` assert `typeof X === 'function'`. That's a presence test, not a behaviour test.
- `ai-dispatch.service.test.ts`, `surge-pricing.service.test.ts`, `medical-hospitals.test.ts` exist; coverage of failure paths in those is unknown.
- No test exists for B-CRIT-1 (`initiatePayment` missing `idempotencyKey`) — the callable's validation is unit-tested but the **client** isn't tested against the **same** schema. This is the gap that lets the bug live.
- No test exists for the rule allow-lists (Firebase rules unit tests via `@firebase/rules-unit-testing` would catch B-CRIT-2/3/4 in minutes).
- `customer-demo-mode.test.ts` is the post-CR follow-up regression; it covers a single bug.
- `mpesa-helpers.test.ts`, `wallet-helpers.test.ts` cover the pure helpers in `functions/src/shared/*` — these are well-tested.

**Test gaps to add** (in priority order):
1. **Firestore Rules tests** for every rule (`@firebase/rules-unit-testing`). Specifically: client cannot create `payment_requests`, client cannot create `requests` with non-pending status, provider cannot update arbitrary fields.
2. **Contract tests** between client wrappers and callables: `initiatePayment` payload must satisfy the callable's input schema (statically generate from `types/api.ts`).
3. **Integration test** for the end-to-end create-request → notify-providers path with FCM mocked.
4. **Race condition tests** for `acceptServiceRequest`: two providers race on the same `pending` request, only one wins.
5. **Callback fuzzer** that posts malformed `mpesaCallback` bodies and asserts the function rejects without crashing.

---

## Cross-Cutting Risks (Frontend × Backend)

These risks exist because both sides are out of sync; fixing one without the other does not help.

### X-1 — Idempotency-key generation is duplicated across frontend & backend without a shared schema

- **Risk**: High
- **Location**: `services/customer.service.ts:51-61`, `functions/src/mpesa/stkPush.ts:203-208`, `functions/src/services/requests.ts:194-200`, `functions/src/wallet/wallet.ts`
- **Failure scenario**: Frontend generates 16-64 char `[A-Za-z0-9_-]` keys. Backend validates 16-64 char `[A-Za-z0-9_-]`. Three different validators in three files. If one drifts (e.g. tightens to 32 chars), every other side breaks.
- **Recommended fix**: Single shared `isValidIdempotencyKey` (already exists at `functions/src/shared/api.ts`) — re-export from `types/api.ts` for frontend reuse. Frontend `generateIdempotencyKey` should produce keys that are guaranteed to satisfy the shared validator.

### X-2 — `ServiceType` enum drift

- **Risk**: Medium
- **Location**: `types/api.ts:ServiceType`, `functions/src/ai/dispatch.ts:10`, `functions/src/ai/pricing.ts:10`, `app/(customer)/index.tsx:30-37` (SERVICES array), `theme/voltage-premium.ts:colors.service.*`
- **Failure scenario**: Adding a service requires editing 5+ files. Battery colour bug (F-HIGH-1) is one consequence.
- **Recommended fix**: Single `constants/services.ts:SERVICE_CATALOG` keyed by `ServiceType`, consumed everywhere.

### X-3 — Demo mode flag has different semantics in frontend (`USE_DEMO_MODE`) vs backend (`FUNCTIONS_EMULATOR`)

- **Risk**: Medium
- **Location**: `services/customer.service.ts:38-44`, `functions/src/mpesa/stkPush.ts` (`getCallbackHmacSecret`)
- **Failure scenario**: Frontend `USE_DEMO_MODE` is opt-in via `EXPO_PUBLIC_DEMO_MODE='true'`. Backend uses `FUNCTIONS_EMULATOR === 'true'` (auto-set by emulator). Running the emulator locally with the production frontend gives the frontend `USE_DEMO_MODE=false` (it talks to the local emulator, which is correct), while running the production backend with a demo-mode-on frontend gives no callable traffic — only the frontend's stub paths fire. The two flags are not consistent in meaning.
- **Recommended fix**: Document the two flags in `docs/operations.md` with a truth table. Consider unifying via a single `EXPO_PUBLIC_API_TARGET=demo|emulator|production` setting.

---

## Overall Risk Summary

| Layer | Risk Level | Reason |
|---|---|---|
| **Frontend (customer side)** | **Critical (do-over)** | Core user actions (login, request, payment, tracking) are pure UI animation. None of them touch the backend the team built. The next agent should plan a complete rebuild of these flows on top of the existing typed contracts. |
| **Frontend (provider side)** | **Medium** | `active-job.tsx` and `subscribeToRequest` are real. The dashboard and online/offline toggle work end-to-end. Issues are mostly chrome and accessibility, not architecture. |
| **Frontend (chrome / theme / nav)** | **Medium** | Phase 4 splash race fix and EmergencySOS FAB are real and verified. RequestFormShell exists but is unconsumed. Theme is consistent but not single-sourced. |
| **Backend (callables)** | **High** | Core contracts (idempotency, atomic transitions, HMAC) are sound. But: client-payment wrapper drops the required idempotency key, accept-request lacks provider-state checks, payment row failure modes are stuck, dispatch errors are swallowed. Each issue is a one-day fix; the suite is not yet production-grade. |
| **Backend (Firestore rules)** | **Critical** | Rules let clients squat payment idempotency keys (B-CRIT-2), create requests with arbitrary status/providerId (B-CRIT-3), let assigned providers update arbitrary request fields (B-CRIT-4), and let users self-promote to verified provider (B-HIGH-7). These are the highest-priority backend fixes. RTDB rules are not even checked into the repo (B-LOW-5). |
| **Tests** | **High (false confidence)** | 1,136 passing tests is mostly a **presence inventory**. Critical user flows (request, payment, tracking, login) have no integration coverage. Firestore rules have no rules-unit-tests. The first thing the next agent should add is a real `@firebase/rules-unit-testing` suite. |

**Net assessment**: The backend foundation is good but porous; the frontend is in worse shape than tests/PR-comments imply. Treat the customer-facing app as MVP-prototype, not as a production candidate. The next frontend agent should plan ~4 weeks of work to bring the four critical flows (auth, request, payment, tracking) onto the existing backend contracts, and we (this Devin session) should use the next ~1 week to land the seven backend critical fixes (rules tightening + payment client-key + accept-request authorization + escrow earnings).

---

*End of audit. Prepared by trustless-system-auditor skill on `fedfe58`. Findings cite live source line numbers; no source code was modified during this audit.*
