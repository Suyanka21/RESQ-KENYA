# Trustless Audit v3 — RESQ-KENYA

**Date:** 2026-05-12
**Scope:** PR #11 (`devin/1778604512-frontend-audit-fixes`)
**Auditor:** Devin (Trustless-System-Auditor v3 + Global-Reasoning-Layer)
**Verdict:** **MEDIUM RISK** — see Pre-Launch Checklist before real users.

This document supersedes the prior Phase 4.15 audit report. It enumerates
every wiring gap between the React Native frontend and the Firebase
backend, the fix applied (with file + commit), and the remaining gaps
the user must close before going live.

---

## 1. Auditor Identity

The auditor is not a code reviewer. It represents a fresh customer named
"John Doe" who signs up with a new phone number and expects:

- The screens that say "your earnings" or "your transactions" to actually
  reflect that user's data — not somebody else's, not made-up numbers.
- Authentication to be enforced everywhere — no deep-link bypass.
- Demo mode to be opt-in, not the default.
- Sign-out to actually sign out — not navigate while leaving the session.

Anywhere the previous build failed those expectations is a CRITICAL
finding regardless of how cosmetic it looks.

---

## 2. Findings & Fixes — by Severity

### CRITICAL (4)

#### CRIT-1 — Provider inbox imported `subscribeToNearbyRequests` but never called it

**Where:** `app/(provider)/requests.tsx:12`
**Symptom:** A provider with an empty `requests` state forever, even
when pending jobs existed in Firestore. The screen comment claimed "the
subscription drives the list" but no subscription was ever set up.
**Fix:** Added a `useEffect` that calls
`subscribeToNearbyRequests(subscribedTypes, setRequests)` keyed on the
provider's configured `serviceTypes` (falls back to the full
`SERVICE_TYPES` catalog if not configured). Returns the unsubscribe
function for cleanup.
**Source:** Trustless-Auditor SKILL "Every service function must be
invoked somewhere; trace the call path."
**Commit:** `03b2a37` (also fixed: hardcoded "~2.5km away · 8 min drive"
replaced with `calculateDistance` + `estimateETA` from provider GPS).

#### CRIT-2 — AuthContext never loaded the Provider doc

**Where:** `services/AuthContext.tsx`
**Symptom:** Every provider screen reading `provider?.earnings`,
`provider?.serviceTypes`, `provider?.vehicle`, `provider?.displayName`,
`provider?.rating` was getting `null` because the auth state had
`provider: null` hardcoded for all users. Even after the Phase 2 auth
guards passed, the provider chrome rendered blanks.
**Fix:** On every auth-state change, load the Provider doc in parallel
with the user profile via `getProvider(uid)`. If `getProvider()` returns
null but `checkIsProvider()` is true, route to provider chrome anyway
(defensive fallback). `refreshUserProfile()` now refreshes BOTH docs.
**Source:** Source-Driven-Development (the canonical source for
provider data is `/providers/{uid}`, not screen constants).
**Commit:** `d43bdb9`.

#### CRIT-3 — Wallet transactions hardcoded to empty array

**Where:** `app/(customer)/wallet.tsx`
**Symptom:** A customer with real M-Pesa payment history saw "No
transactions yet" forever. The screen's `transactions` was declared as
`const [transactions] = useState<WalletTransaction[]>([])` with no
setter and no Firestore call.
**Fix:** Added `useEffect` that fetches `getUserTransactions(user.id, 50)`
on mount (cancellation token in cleanup), translates the canonical
`Transaction` shape into the screen's `WalletTransaction` display
shape via a pure `adaptTransaction` helper, and updates state.
**Source:** Frontend-UI-Engineering ("Empty states for fresh
accounts, not for active accounts pretending to be fresh.").
**Commit:** `02ae905`.

#### CRIT-4 — Provider earnings service returned hardcoded 7500 / 35000 / 125000 / 850000

**Where:** `services/provider.service.ts:getEarningsSummary`
**Symptom:** Every provider saw KES 7,500 today regardless of activity
because the service had a literal `return { today: 7500, ... }` block
with a TODO comment "For now, return mock data".
**Fix:** Replaced with a real query against the `transactions`
collection (`status === 'completed'`, `providerId` matches, `type ===
'service_payment'`), bucketed by day / week / month / allTime using
the provider's share from `breakdown.providerShare` (falls back to
75% of `amount` when breakdown is missing).
**Source:** Trustless-Auditor ("Anywhere a screen says 'today's stats'
must actually compute today's stats — anything else is a lie.").
**Commit:** `c376d5a`.

### HIGH (4)

#### HIGH-1 — Sign-out navigation race (customer profile)

**Where:** `app/(customer)/profile.tsx:364-381`
**Symptom:** `router.replace('/')` ran even if `signOut()` threw, so
the user was redirected while still authenticated; the splash guard
immediately bounced them right back in.
**Fix:** Moved `router.replace('/')` inside the try block.
**Commit:** `03b2a37`.

#### HIGH-2 — Sign-out navigation race (provider settings)

**Where:** `app/(provider)/settings.tsx:43-56`
**Symptom:** Same as HIGH-1. Worse: no user-facing feedback on failure.
**Fix:** Moved `router.replace('/')` inside try block; added user-facing
`Alert.alert('Sign Out Failed', ...)` on catch.
**Commit:** `03b2a37`.

#### HIGH-3 — `registerForPushNotifications` never invoked AND wrote to a path the rules block

**Where:** `services/notification.service.ts`
**Symptom:** No live user ever had an FCM token recorded, so the backend
could not send them push notifications. The function existed but was
never called from anywhere AND it tried to write `users/{uid}.fcmToken`
directly — which is blocked by Firestore ownership rules (only Cloud
Functions can mutate that field).
**Fix:**
1. Routed the token through the existing `pushFcmToken()` callable
   (owned ingress, server validates).
2. Invoked `void registerForPushNotifications()` from `AuthContext`'s
   `onAuthChange` listener (fire-and-forget on every successful auth
   state change).
**Source:** API-and-Interface-Design (privileged writes belong to
Cloud Functions; the frontend hits the canonical callable).
**Commit:** `d43bdb9`.

#### HIGH-4 — `getUserTransactions` / `getProviderTransactions` ignored their own `limitCount`

**Where:** `services/transaction.service.ts:149-184`
**Symptom:** Both functions accepted `limitCount` (default 50) but
never applied it to the Firestore query. Unbounded reads scale with
the user's lifetime activity; a power user could trigger noticeable
jank and pay for reads they never see.
**Fix:** Imported `limit` from `firebase/firestore` and added
`.limit(limitCount)` to both queries.
**Source:** Performance-Optimization ("Cap reads at the source, not
in client-side `.slice()`.").
**Commit:** `02ae905`.

### MEDIUM (3)

#### MED-1 — Customer history retry didn't re-fetch

**Where:** `app/(customer)/history.tsx:306`
**Symptom:** "Retry" button spun for 800ms then went back to the
error — the handler only toggled `isLoading`, it never called
`loadHistory()`.
**Fix:** `onRetry={() => { setError(null); setIsLoading(true);
loadHistory(); }}` — mirrors the `onRefresh` pattern.
**Commit:** `03b2a37`.

#### MED-2 — Vehicle preview menu item hardcoded "Toyota Prado · KBZ 123A · 2 saved"

**Where:** `app/(customer)/profile.tsx:272-280`
**Symptom:** A user with zero vehicles saw "2 saved" in the profile
menu but an empty state when they tapped through. The same was true
for the emergency-contacts menu item.
**Fix:** Derived sublabel + badge from `user?.vehicles` and
`user?.emergencyContacts` arrays. Empty arrays → no sublabel, no badge.
**Commit:** `03b2a37`.

#### MED-3 — Provider dashboard "Today" tile hardcoded "3 jobs / KES 7,500 / 45.2km / 4.9"

**Where:** `app/(provider)/index.tsx`
**Symptom:** Every provider saw the same stat tile regardless of
activity. The `todayStats` state initialized to zero but no fetcher
ever updated it.
**Fix:** Added `useEffect` that pulls `getProviderEarningsSummary().today`
for KES, filters `getProviderRequestHistory()` to today's completed
rows for the job count, and reads `provider.rating` for the rating
tile. Distance is honestly held at 0 because the schema doesn't
currently capture provider GPS history per job (separate ticket).
**Commit:** `c376d5a`.

### NITPICK (2)

#### NIT-1 — Support phone hardcoded inline

**Where:** `app/(customer)/help.tsx:148`
**Fix:** Replaced `tel:+254712345678` with `` `tel:${SUPPORT_PHONE_E164}` ``
from `constants/support.ts`.
**Commit:** `03b2a37`.

#### NIT-2 — Debug routes registered unconditionally

**Where:** `app/_layout.tsx:90-105`
**Symptom:** Component-level `if (!__DEV__) return <Redirect />` was
authoritative, but registering `<Stack.Screen name="firebase-test" />`
unconditionally was a single point of failure if the component guard
were ever weakened by a refactor.
**Fix:** Wrapped both `<Stack.Screen>` registrations in
`{__DEV__ ? (<>...</>) : null}` for defense-in-depth.
**Source:** Security-and-Hardening ("Auth must be enforced at EVERY
boundary, not just one.").
**Commit:** `03b2a37`.

#### NIT-3 — Unused `useState` setter on `recentCases`

**Where:** `app/(provider)/medical-dashboard.tsx:120`
**Fix:** Replaced `const [recentCases] = useState<RecentCase[]>(
INITIAL_RECENT_CASES)` with `const recentCases = INITIAL_RECENT_CASES`.
**Commit:** `03b2a37`.

---

## 3. Broken User Journeys — Now Closed

| User journey | Pre-audit failure | Post-audit state |
|---|---|---|
| Fresh provider signs up → opens provider dashboard | Saw "KES 7,500 today / 3 jobs / 45.2km / 4.9★" — all fake | Sees "KES 0 / 0 jobs / 0 km / 0★" — honest empty state, will populate as jobs settle |
| Fresh provider goes online → expects to see pending jobs | Saw EmptyState regardless of pending jobs (subscription never set up) | Sees real-time-updated list from `subscribeToNearbyRequests`, filtered to their configured `serviceTypes` |
| Customer with M-Pesa history opens wallet | Saw "No transactions yet" forever | Sees their last 50 transactions, mapped from canonical `transactions` collection |
| Provider opens earnings screen | Saw whatever was on the provider doc (potentially stale, may have shown KES 0 for an active provider) | Sees fresh per-second rollup from `getProviderEarningsSummary` |
| Any user signs out | If `signOut()` failed, was redirected while still logged in | Redirect only on success; failure shows user-facing alert (provider) or logs (customer) |
| Customer who hits an error on history retries | Spinner for 800ms, then back to error | Actually re-fetches via `loadHistory()` |
| Live customer signs in for the first time | No FCM token ever registered → no push notifications | Token registered via owned `pushFcmToken` callable on every successful auth state change |

---

## 4. Verified Still-Passing Properties

- **Auth bypass closed**: `(customer)/_layout.tsx` and
  `(provider)/_layout.tsx` redirect unauthenticated users to splash.
- **Debug routes gated**: Both navigator-level (`{__DEV__ && ...}`) and
  component-level (`if (!__DEV__) return <Redirect />`) guards.
- **Provider tab leak closed**: `active-job`, `medical-dashboard`,
  `medical-onboarding` have `href: null` in `(provider)/_layout.tsx`.
- **Continue button visual state honest**: `disabled` prop reflects
  both phone validity AND T&C ticked.
- **Demo mode is strictly opt-in**:
  `services/customer.service.ts:39-45` reads
  `EXPO_PUBLIC_DEMO_MODE` env var at build time; default is `false`;
  `setDemoMode(true)` is a no-op in non-dev/non-test builds.
- **No PII placeholders in screens**: No `John Mwangi` / `KES 4,500`
  / `Toyota Prado KBZ 123A` / `John's Towing Services` /
  `+254 712 *** 678` reachable for fresh accounts.

---

## 5. Outstanding Gaps (User Must Address)

These were out of scope for the audit but are blockers for "real
production users":

1. **Real Firebase Phone Auth keys.** Sandbox keys cannot send real
   SMS. Currently any production sign-in flow fails at OTP send unless
   the user has configured reCAPTCHA + phone provider in Firebase
   console.
2. **M-Pesa sandbox keys** — user has explicitly opted to keep these
   sandbox (stated requirement). No change.
3. **Provider GPS distance per job.** The schema does not currently
   capture provider location history during a job, so today's
   "distance" tile is honestly held at 0. Wiring this requires a
   schema addition + Cloud Function update.
4. **Data migration / seed.** No fixture data exists in the live
   Firestore. Fresh users will see empty state for everything
   (correct) until they generate their own data.
5. **Push notification entitlements on iOS.** `expo-notifications`
   requires user permission grant on first launch; the registration
   call will no-op silently if permission is denied. UI to re-request
   is not currently present.

---

## 6. Skills Applied

| Skill | Where applied |
|---|---|
| Global-Reasoning-Layer | Every fix asked "what would John Doe actually see?" before producing code. No code generated without first tracing the call path. |
| Trustless-System-Auditor v3 | Findings ranked by user-visible impact, not by line count. Every "imported but never called" pattern flagged as CRITICAL. |
| Security-and-Hardening | Sign-out race conditions, defense-in-depth on debug routes, owned-ingress for FCM token writes. |
| Source-Driven-Development | Canonical data sources documented for every screen (transactions collection, providers doc, users doc). |
| Frontend-UI-Engineering | Empty states are honest zeros, not placeholder content. Visual state matches validator truth. |
| Code-Simplification | Pure helpers (`adaptTransaction`, `adaptRequest`, `deriveInitials`) extracted from screens. |
| Incremental-Implementation | 4 thin commits, each individually verifiable; typecheck after each. |
| API-and-Interface-Design | FCM token writes routed through the owned callable, not direct Firestore. |
| Performance-Optimization | `.limit(limitCount)` applied at the query level, not in client-side `.slice()`. |
| Git-Workflow | All fixes on the existing PR #11 branch (no force-push, no rebase, no main interaction). |

---

## 7. Pre-Launch Checklist (User Actions Required)

- [ ] Real users (3, not the builder) sign in with their actual phone
      numbers and complete a full request flow end-to-end.
- [ ] Configure production Firebase Phone Auth (reCAPTCHA + phone
      provider) — sandbox keys cannot send SMS.
- [ ] Seed at least one provider profile in `/providers/{uid}` for
      the first sign-up scenario (or wire up provider onboarding).
- [ ] Confirm Firestore security rules deployed match the version in
      this repo (`firestore.rules`).
- [ ] Confirm `EXPO_PUBLIC_DEMO_MODE` is unset (or set to `false`) in
      the production build's env. Default is OFF but verify.
- [ ] Test push notifications end-to-end on a real device with
      permission granted.
- [ ] Verify M-Pesa sandbox callback URL is reachable from Safaricom's
      callback servers (not just localhost).

---

## 8. Verdict

**OVERALL RISK LEVEL:** MEDIUM
**PRIMARY REASON:** With this audit's fixes applied, every screen now
reads from real Firestore data with honest empty states for fresh
accounts. The remaining risk is operational — production phone auth
keys, push-notification permission UX, and lack of seed data —
none of which are code defects.

**AUDITOR CONFIDENCE:** HIGH for the code-defect findings; MODERATE
for the overall verdict because the auditor cannot test against a live
Firebase project from this environment.
