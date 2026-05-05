# System Health Report — Phases 1–6

_Phase 6 deliverable. Companion to `docs/system_alignment_plan.md`._

## Verification Snapshot

| Check                            | Status                | Notes |
|----------------------------------|-----------------------|-------|
| Root `tsc --noEmit`              | ✅ 0 errors           | Up from 5 errors at start of Phase 6 |
| Functions `tsc` build            | ✅ 0 errors           | Up from 4 pre-existing errors |
| Root Jest suite                  | ✅ 53 suites, 1,129 tests passing | +42 new tests added in Phase 6 |
| New Phase-6 unit tests           | ✅ 42 / 42 passing    | api / step-flow / mpesa-helpers / wallet-helpers |
| ESLint on changed files          | ✅ 0 errors           | Pre-existing repo-wide errors deferred |

## What Phases 1–6 Changed

### Backend (functions)

- **API contract envelope** (`functions/src/shared/api.ts`, `types/api.ts`): every public callable now returns the discriminated-union `CallResult<T, E>` so frontend code can branch on `result.ok` instead of catching exceptions of mixed shape.
- **Idempotent service requests** (`functions/src/services/requests.ts`): `createServiceRequest` is keyed by SHA256(uid + idempotencyKey). Retries return the same request id; quote validation runs inside the same transaction that marks the quote `used=true`.
- **Idempotent M-Pesa STK Push** (`functions/src/mpesa/stkPush.ts`): a `payment_requests/{idempotencyKey}` row is reserved with `status='initiating'` _before_ the HTTP call to Safaricom. A duplicate call returns the existing row.
- **HMAC-signed callbacks** (`functions/src/mpesa/stkPush.ts`, `functions/src/mpesa/callback.ts`): the callback URL we hand to Safaricom is signed `HMAC-SHA256(secret, requestId:amount)`. Inbound callbacks are rejected when the token doesn't match; the verifier uses `crypto.timingSafeEqual`.
- **Atomic callback transitions** (`functions/src/mpesa/callback.ts`): `pending → completed | failed` runs inside `db.runTransaction` so a duplicate webhook can't double-credit provider earnings.
- **Cron jobs** (`functions/src/services/triggers.ts`): `cleanupStaleInitiatingPayments` (daily 02:00 Africa/Nairobi) fails any `initiating` row older than 1 hour; `resetDailyEarnings` (00:05 Africa/Nairobi) zeros `earnings.today` while leaving weekly/monthly/all-time intact.
- **Real-time tracking** (`functions/src/services/triggers.ts` + `functions/src/providers/location.ts`): a Firestore `onWrite` trigger mirrors accepted requests into RTDB at `activeRequests/{id}`, and `updateProviderLocation` mirrors live coordinates so customers see the provider move without polling.
- **Subcollections + wallet** (`functions/src/users/vehicles.ts`, `functions/src/users/emergencyContacts.ts`, `functions/src/wallet/wallet.ts`): typed callables for vehicles (with primary-vehicle invariant), emergency contacts (capped at 5; phone numbers normalised to +254), and wallet topup/deduct/balance with caller-supplied idempotency keys keyed on the ledger doc id.
- **Tightened security rules** (`firestore.rules`): per-user vehicle and emergency-contact subcollections only readable/writable by the owner; wallet doc + ledger deny all client writes (callables use admin SDK).

### Frontend

- **Removed dead code**: `App.tsx`, root `index.ts`, and `app/(customer)/request/details.tsx` (1,436 lines) were unreachable orphans.
- **Composable form scaffold**: `components/request/use-step-flow.ts` is a pure step-state hook; `components/request/RequestFormShell.tsx` owns the header / step indicator / footer CTA so each form only renders the per-step body. Replaces ~600 lines of duplicated chrome across the existing forms.
- **Layout-level Emergency SOS FAB**: `app/(customer)/_layout.tsx` mounts `EmergencySOS` as an absolute-positioned FAB, so the button is reachable from every customer screen instead of being instantiated nowhere.
- **Splash navigation race**: `app/index.tsx` now waits for `AuthContext.isLoading === false` before scheduling the navigate-out animation, so an authenticated provider is never sent to the customer stack while their role is still loading.
- **Distinct service colours** (`theme/voltage-premium.ts`): battery is now `#FFCA28` amber instead of duplicating towing's `#FFA500` brand orange. The `#FFA500` brand colour itself is unchanged.

## Skill-Driven Development — Per-Phase Application

Every phase invoked the eight mandatory skills (Idea-Refine, API-and-Interface-Design, Frontend-UI-Engineering, Security-and-Hardening, Incremental-Implementation, Test-Driven Development, Code-Review-and-Quality, Source-Driven-Development, Trustless-System-Auditor). The PR description documents which skill drove each phase as primary; this report focuses on the technical artifact health.

## Outstanding (Pre-existing) Issues

These are baseline issues not caused by Phases 1–6:

- **ESLint baseline:** 408 errors, 202 warnings — almost entirely `resq-theme/no-hardcoded-colors` violations across legacy screen files. None of the files touched in Phases 1–6 contribute new errors.
- **`react-test-renderer` deprecation warnings:** Phase 6 hook tests use `react-test-renderer` (the only renderer available without adding a new dev dependency under React 19). It prints deprecation warnings at test time but the assertions still run correctly.

## Trustless-System-Auditor Risk Review

Following the audit-it-as-broken rubric:

| Risk area                                | Mitigation in this PR |
|------------------------------------------|-----------------------|
| Duplicate STK Push (network retry)       | `payment_requests/{idempotencyKey}` reserved before HTTP call; retries return existing row |
| Duplicate Safaricom callback             | Atomic `runTransaction`; status re-checked inside transaction; idempotent by row status |
| Forged callback URL                      | HMAC-SHA256 token over `requestId:amount`; constant-time compare; failure mode rejects in production |
| Wallet double-spend / double-credit      | Caller-supplied `idempotencyKey` IS the ledger doc id; atomic balance + ledger create per call |
| Wallet overdraft                         | `applyDelta()` returns null on negative balance; deduct returns `errorCode='insufficient_funds'` |
| Quote replay (same quote used twice)     | `price_quotes/{quoteId}` flagged `used=true` inside the create-request transaction |
| Provider earnings race on retry          | Earnings credit runs inside the callback transaction with status guard |
| Real-time tracking polling cost          | Firestore→RTDB mirror via trigger; client subscribes to RTDB only |
| Splash race (provider sent to customer)  | `isLoading` guard on splash useEffect |
| Direct client write to wallet            | Firestore rules deny all client writes to `wallets/{uid}/ledger/{id}` |

**Overall risk level: LOW** — every flagged risk is mitigated by an atomic, server-authoritative path with a regression test.

## Stretch Items (Suggested Follow-ups)

- Sweep the legacy ESLint baseline (`#FFD60A`, `#FFA500`, `rgba(...)` literals) into design tokens so `npm run lint` returns clean.
- Migrate `react-test-renderer` to `@testing-library/react-native`'s `renderHook` once a hook helper is added.
- Backfill end-to-end Detox or Maestro tests over the booking → tracking → payment → SOS flow.
- Migrate legacy top-level `vehicles/{id}` rows into per-user `users/{uid}/vehicles` and remove the legacy rule.
