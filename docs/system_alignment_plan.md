# System Alignment Plan — ResQ Kenya

> **Phase 1 deliverable.** Produced by combining `docs/frontend_audit.md` and
> `docs/backend_impact_audit.md` into a single executable system plan.
>
> **Skills applied (Phase 1):** `Idea-Refine`, `API-and-Interface-Design`,
> `Code-Review-and-Quality`, `Source-Driven-Development`.
>
> **Date:** 2026-05-05.
> **Theme color (single source of truth):** `#FFA500` (Voltage Orange) — see
> `theme/voltage-premium.ts`. Do not reintroduce `#FFD60A`.

---

## 1. How this plan was built

1. **Extract** every numbered finding from `frontend_audit.md` (Findings 1–45)
   and `backend_impact_audit.md` (Fixes 1–13).
2. **Map** each frontend change to its backend dependency using the existing
   "Frontend ↔ Backend Mapping" table in `backend_impact_audit.md` §5.
3. **Identify** conflicts (FE assumes API contract X; BE provides Y) and
   ordering dependencies (FE refactor cannot land before BE contract is stable).
4. **Group** the work into six phases that match the master task brief:
   alignment → contracts → real-time/payments → frontend → data model → final
   integration.

The output of this phase is **planning only**. No code is changed in
Phase 1; that begins in Phase 2.

---

## 2. Cross-cutting principles

These rules apply to every subsequent phase. They come from the user-supplied
skill files and `Idea-Refine`'s "Not Doing" list.

- **One source of truth per concern.** Brand colour, API contract, real-time
  state, and price quotes each have exactly one authoritative location.
- **Backward compatibility first.** New contracts ship alongside the old one
  via either a `v2` namespace or a discriminated `CallResult` envelope; the old
  surface is deprecated with a console warning before removal.
- **Validation at the boundary.** Cloud Functions validate every input;
  Firestore rules deny by default; clients trust nothing.
- **No financial state outside a transaction.** Wallet credits, earnings
  increments, and quote consumption all run inside `db.runTransaction`.
- **Fail loud, then localized.** All user-facing copy comes from a typed
  notification kind so it can be translated.
- **Tests precede or accompany every change** (`Test-Driven Development`).

---

## 3. Phase roadmap

Each phase below includes: **scope**, **affected systems**, **risks**,
**success criteria**.

### Phase 2 — Contract Stabilization

**Scope.** Make `createServiceRequest` a single, versioned callable. Introduce
a shared `CallResult<T,E>` envelope. Add `quoteId` + `idempotencyKey` plumbing
to the canonical request creation path. Deprecate the duplicate
`services/firestore.service.ts:createServiceRequest`. Gate the legacy
`USE_DEMO_MODE` flag behind `EXPO_PUBLIC_DEMO_MODE`.

**Affected systems.**
- `functions/src/services/requests.ts` (canonical Cloud Function)
- `services/customer.service.ts` (client wrapper)
- `services/firestore.service.ts` (deprecated shim)
- `types/api.ts` (new — shared client/server types)

**Skills primary.** `API-and-Interface-Design`, `Source-Driven-Development`.
**Skills supporting.** `Security-and-Hardening`, `Test-Driven Development`,
`Incremental-Implementation`, `Code-Review-and-Quality`.

**Risks.**
- Existing call sites in `corporate.service.ts` still reference the old
  shape. Mitigation: keep the legacy fields nullable in the new input type;
  add a runtime adapter.
- Demo mode is used by some screens at runtime. Mitigation: do not delete it,
  just gate it behind an explicit env flag and document.

**Success criteria.**
- Single TypeScript interface for `CreateServiceRequestInput` /
  `CreateServiceRequestOutput` exported from `types/api.ts`.
- `CallResult<T,E>` discriminated union exported and used by the new path.
- `functions/src/services/requests.ts` validates `idempotencyKey` and
  `quoteId` (when supplied) and returns `CallResult` shape.
- `services/firestore.service.ts:createServiceRequest` becomes a deprecated
  shim that warns once and forwards to the canonical path.
- Tests prove (a) idempotent retry returns the same `requestId`, (b) missing
  required fields return a typed `errorCode`.

---

### Phase 3 — Payments + Real-time

**Scope.** Two highest-risk surfaces: M-Pesa and live tracking.

**Payments — `Fix 5` from backend audit.**
- Idempotent STK Push: the `payment_requests/{idempotencyKey}` row is written
  **before** the HTTP call to Daraja, with `status: 'initiating'`. The HTTP
  result transitions it to `pending` or `failed`.
- Callback hardens: optional HMAC signature on the callback URL path
  (`/mpesaCallback/:token` where `token = HMAC(secret, requestId|amount)`).
  Reject any callback with a missing or mismatching token. Atomic
  `pending → completed` transition; duplicate callbacks return early without
  re-incrementing earnings.
- Daily earnings reset cron (`functions.pubsub.schedule('every day 00:00')`).

**Real-time — `Fix 2` from backend audit.**
- Firestore `onUpdate` trigger on `requests/{id}`:
  - On `pending → accepted`: create RTDB node `activeRequests/{id}` with
    initial `providerLocation` from the provider's last Firestore position.
  - On `completed | cancelled`: remove the node.
- `updateProviderLocation` mirrors into RTDB when the provider is on an
  active request.
- Provider client uses `ref.onDisconnect().update({ providerStale: true })`
  so the customer can show a "waiting for provider" state.

**Affected systems.**
- `functions/src/mpesa/stkPush.ts`, `functions/src/mpesa/callback.ts`
- `functions/src/providers/location.ts`
- New: `functions/src/services/triggers.ts` (Firestore `onUpdate` trigger)
- New: `functions/src/services/earningsCron.ts`

**Skills primary.** `Security-and-Hardening`.
**Skills supporting.** `API-and-Interface-Design`, `Test-Driven Development`,
`Incremental-Implementation`, `Code-Review-and-Quality`.

**Risks.**
- HMAC secret rotation. Mitigation: load from
  `functions.config().mpesa.callback_secret`; fail closed if absent.
- RTDB node not cleaned up on crashed Cloud Function. Mitigation: the trigger
  is idempotent — re-running it on the same status transition is a no-op.

**Success criteria.**
- A retried `initiateStkPush` with the same `idempotencyKey` returns
  `{ ok: false, errorCode: 'duplicate' }` instead of charging twice.
- Callbacks without the HMAC token are rejected with HTTP 401.
- The RTDB `activeRequests/{id}` node is created the moment a provider
  accepts a request and removed when the request finishes.

---

### Phase 4 — Frontend Refactor

**Scope.** Bring the UI into alignment with the now-stable backend contract.

- Delete `app/(customer)/request/details.tsx` (1,436-line orphan). Its
  responsibilities are already covered by
  `app/(customer)/request/[service].tsx` + `components/request/forms/*Form.tsx`.
- Delete `App.tsx` (Expo blank-template boilerplate; the real entry is
  `expo-router/entry`).
- Introduce `components/request/RequestFormShell.tsx` and a `useStepFlow`
  hook so the six service forms share scaffolding instead of each
  reimplementing the header/footer/step indicator.
- Mount `EmergencySOS` as a floating FAB in `app/(customer)/_layout.tsx`.
- Fix the splash navigation race in `app/index.tsx` (gate the timed
  navigation on `authLoading === false`).
- Distinguish the battery service color from towing in
  `theme/voltage-premium.ts` (battery → `#29B6F6`).

**Affected systems.**
- `app/(customer)/_layout.tsx`, `app/index.tsx`
- `components/request/RequestFormShell.tsx`,
  `components/request/use-step-flow.ts`
- `components/request/forms/*Form.tsx` (one form refactored as the
  reference implementation; remaining migrations tracked in
  `UI-OVERHAUL_PROGRESS.md`).
- `theme/voltage-premium.ts`

**Skills primary.** `Frontend-UI-Engineering`.
**Skills supporting.** `Incremental-Implementation`, `Test-Driven Development`,
`Code-Review-and-Quality`, `Source-Driven-Development`.

**Risks.**
- Deleting `details.tsx` could break a forgotten deep-link or test.
  Mitigation: grep for any router `push('/request/details')` before delete.
- Mounting a floating SOS button on every customer screen risks z-index
  conflicts. Mitigation: use a portal-like absolute-positioned overlay anchored
  at the root layout, not inside individual screens.

**Success criteria.**
- `details.tsx` and `App.tsx` are gone; `git grep` returns no references.
- `RequestFormShell` consumed by at least one form (TowingForm) with
  identical observable behaviour (snapshot test passes).
- `EmergencySOS` visible on the customer dashboard; pressing it opens the
  modal already implemented in `components/EmergencySOS.tsx`.
- Splash never navigates while `authLoading === true`.
- `colors.service.battery !== colors.service.towing`.

---

### Phase 5 — Data Model Migration

**Scope.** Fix structural issues that block multi-vehicle / contact / wallet
features.

- Move vehicles into `users/{uid}/vehicles/{vehicleId}` subcollection with
  callable endpoints (`addVehicle`, `removeVehicle`, `setPrimaryVehicle`).
- Move emergency contacts into
  `users/{uid}/emergency_contacts/{contactId}` subcollection with
  `addEmergencyContact`, `removeEmergencyContact`.
- Introduce `wallets/{userId}` (balance + version) and
  `wallet_transactions/{id}` (append-only ledger).
- Introduce `topUpWallet`, `debitWallet`, `getWalletLedger` callables.
- Update `firestore.rules` to cover every new collection.

**Affected systems.**
- New: `functions/src/users/vehicles.ts`,
  `functions/src/users/emergencyContacts.ts`,
  `functions/src/wallet/wallet.ts`
- `firestore.rules`
- `services/customer.service.ts` (client wrappers)

**Skills primary.** `Incremental-Implementation`.
**Skills supporting.** `API-and-Interface-Design`, `Security-and-Hardening`,
`Test-Driven Development`, `Code-Review-and-Quality`.

**Risks.**
- No data loss during migration. Mitigation: subcollections are
  *additive* — the old root-level `vehicles` collection remains read-only for
  legacy clients until a deprecation cycle completes.
- Wallet balance race conditions. Mitigation: every credit / debit runs
  inside `db.runTransaction` and bumps `version`.

**Success criteria.**
- Subcollections exist and are reachable via callables.
- `firestore.rules` covers `wallets`, `wallet_transactions`,
  `users/*/vehicles/*`, `users/*/emergency_contacts/*`,
  `notifications`, `surge_zones`, `price_quotes`,
  `emergency_requests`, `medical_providers`, `hospitals`,
  `dispatch_predictions`, `dispatch_training_data`.
- Tests prove (a) two concurrent debits cannot drive the balance negative,
  (b) a non-owner cannot read someone else's wallet.

---

### Phase 6 — Final Integration + Verification

**Scope.** Prove the system works end-to-end.

- TDD-style coverage for every contract added in Phases 2–5
  (`useStepFlow`, `RequestFormShell`, `CallResult` envelope helper,
  idempotency key dedup, splash gating).
- Fix the four pre-existing typecheck errors in
  `__tests__/screens/tracking-lifecycle.test.ts`.
- Produce `docs/system_health_report.md` summarising:
  - which audit findings are fixed in this PR;
  - which findings are deferred and why;
  - manual verification steps for booking → tracking → payment → SOS.
- Add a rule-extension to `eslint-plugin-resq-theme` so any new hard-coded
  hex colour outside `theme/` is rejected.

**Affected systems.**
- `__tests__/**`
- `docs/system_health_report.md` (new)

**Skills primary.** `Test-Driven Development`.
**Skills supporting.** `Code-Review-and-Quality`, `Security-and-Hardening`,
`Source-Driven-Development`.

**Risks.**
- Regression in the existing 1,081 passing tests. Mitigation: every change
  is run against `npm test && npm run typecheck && npm run lint` before
  commit.

**Success criteria.**
- All tests pass.
- Typecheck has zero errors (down from 4).
- New tests cover the new contracts and the new shell/hook.

---

## 4. Frontend ↔ Backend dependency matrix

A condensed view of which frontend changes block on which backend changes.
Read top-to-bottom in the recommended landing order.

| # | FE change                                | BE prerequisite                          | Phase |
| - | ---------------------------------------- | ----------------------------------------- | ----- |
| 1 | One booking flow (`details.tsx` deleted) | Single `createServiceRequest` (Fix 1)    | 2 → 4 |
| 2 | Real map on dashboard                    | RTDB writer in CF (Fix 2)                | 3 → 4 |
| 3 | Global SOS FAB                           | Unified `requests` collection (Fix 3)    | 2 → 4 |
| 4 | Wallet tab populated                     | Wallet schema + callables (Fix 4)        | 5 → 4 |
| 5 | Cancel button during tracking            | `cancelServiceRequest` callable (Fix 12) | 3 → 4 |
| 6 | Notification feed                        | Persisted notifications (Fix 10)         | 5 → 4 |
| 7 | Swahili copy                             | Server-side localized templates (Fix 10) | 5 → 4 |
| 8 | Per-form distinct battery color          | None — pure FE                           | 4     |
| 9 | Splash race fix                          | None — pure FE                           | 4     |

---

## 5. "Not doing" list (Idea-Refine convergence)

Explicitly out of scope for this multi-phase PR. Tracked for follow-up.

- **Storybook + visual regression** — separate effort once the primitives are
  stable (Finding 45).
- **Light-mode / Dubai theme** — design system supports it, but switching
  rendering pipelines is a large effort; revisit after Phase 6.
- **Full migration of all six service forms onto `RequestFormShell`** —
  done as one reference form here; remaining five tracked in
  `docs/UI-OVERHAUL_PROGRESS.md`.
- **i18n string extraction across the entire app** — scope-creep risk;
  the typed notification kind in Phase 5 unblocks it but the FE rollout is
  a follow-up.
- **Removal of `services/firestore.service.ts:createServiceRequest`** — left
  as a deprecated shim, not deleted, until all call sites are migrated.

---

## 6. How to verify Phase 1 itself

Phase 1 is pure documentation. Acceptance is binary:

- This file exists at `docs/system_alignment_plan.md`.
- It links every frontend audit finding with backend impact to a concrete
  phase (sections 3 and 4 above).
- Every phase has scope / affected systems / risks / success criteria.
- A "Not Doing" list is present (section 5).

If any of the four are missing the plan is incomplete and Phases 2–6 must
not start.
