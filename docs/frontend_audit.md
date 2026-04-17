# ResQ Kenya — Frontend Audit & Improvement Plan

**Audit scope:** `app/`, `components/`, `theme/`, `design-system/`, `tailwind.config.js`, `global.css`, `App.tsx`
**Reference docs consulted:** `docs/projectidx.md`, `docs/ResQ design philosophy.md`, `design-system/MASTER.md`, `docs/Idea skill.txt`, `docs/frontend SKILL.txt`, `docs/UI-OVERHAUL_PROGRESS.md`, `docs/desiredfrontend.txt`
**Date:** 2026-04-17

---

## 1. Overview — Frontend Health

The project has a **solid visual vision** (Voltage Premium dark theme, Bolt-inspired command center, 6 clearly-scoped service flows) and a **well-documented design system** (`design-system/MASTER.md`, `theme/voltage-premium.ts`). Foundational primitives like `Button`, `Card`, `Input`, `ErrorState`, `EmptyState`, and `SkeletonLoader` exist and are thoughtfully built.

However, execution lags behind design intent. The codebase shows the classic symptoms of a prototype that grew organically into an app without a refactor pass:

- **Two conflicting sources of truth** for brand colour (Tailwind config says `voltage: #FFD60A` yellow, `theme/voltage-premium.ts` and `design-system/MASTER.md` say `#FFA500` orange — see <ref_snippet file="/home/ubuntu/repos/RESQ-KENYA/tailwind.config.js" lines="11-25" /> vs <ref_snippet file="/home/ubuntu/repos/RESQ-KENYA/theme/voltage-premium.ts" lines="181-195" />).
- **Primitives are bypassed.** The app has 411 inline `Pressable` usages and only ~10 `<Button>` call-sites; 58 separate `StyleSheet.create` blocks with ~372 inline `fontSize` literals and ~91 inline padding numbers.
- **Screen files are oversized.** `app/(customer)/request/details.tsx` (1,436 lines), `app/(customer)/index.tsx` (1,067 lines), `app/(customer)/history.tsx` (841 lines), `app/(provider)/medical-onboarding.tsx` (835 lines), `components/request/forms/TireForm.tsx` (584 lines).
- **Feature duplication.** Six near-identical service forms (`components/request/forms/*.tsx`) _and_ a monolithic `details.tsx` that reimplements all of them. Two `PRICES` constants (one canonical in `constants/prices.ts`, one duplicated in `details.tsx`).
- **Icon system inconsistency.** `lucide-react-native`, `@expo/vector-icons`, custom `ServiceIcon` pictograms, and emoji glyphs all coexist for the same service concepts.
- **Accessibility + responsiveness are partial.** WCAG contrast targets are claimed in the design system but not verified; `Dimensions.get('window')` is sampled once at module load and breakpoints from the skill doc (320 / 768 / 1024 / 1440) are unused.
- **Dead code at the entry point.** `App.tsx` is still the Expo blank-template boilerplate even though `expo-router/entry` is the real entry (`package.json:main`).

**Bottom line:** the design system is ~80% defined but only ~30–40% enforced in code. The top priority is to **converge on a single source of truth** and **push primitives into every screen** before adding more features.

---

## 2. Key Issues Identified (Grouped)

### A. Design-system drift & dual sources of truth
1. Tailwind `voltage` colour does not match `theme/voltage-premium.ts` (yellow vs orange).
2. Legacy tokens (`colors.voltage`, `colors.charcoal[*]`, `colors.emergency`) coexist with semantic tokens (`colors.background.*`, `colors.text.*`, `colors.interactive.*`, `colors.status.*`) — 400+ call-sites still use legacy.
3. `PRICES` duplicated between `constants/prices.ts` and `app/(customer)/request/details.tsx`.
4. `docs/ResQ design philosophy.md` describes `#FFD60A` (yellow); `design-system/MASTER.md` describes `#FFA500` (orange). Docs contradict each other.

### B. Primitive components exist but are bypassed
5. `components/ui/Button.tsx` is effectively unused. Every screen recreates its own `<Pressable>` + styled `<Text>` header back-button, primary CTA, etc.
6. `components/ui/Input.tsx` (`PhoneInput`, `OTPInput`) duplicates the hand-rolled phone input in `app/(auth)/login.tsx:92-135`.
7. `components/ui/Card.tsx` / `ServiceCard` unused in favour of inline cards in every screen.
8. `ErrorState`, `EmptyState`, `SkeletonLoader` exist but inconsistent: `searching.tsx` rolls its own radar loader, other screens show blank views while fetching.

### C. Structural / file-organisation problems
9. Monolithic route files: `details.tsx` (1,436 L), `(customer)/index.tsx` (1,067 L), `history.tsx` (841 L), `medical-onboarding.tsx` (835 L), `wallet.tsx` (660 L), `profile.tsx` (637 L), `vehicles.tsx` (686 L), `help.tsx` (742 L). All well above the 200-line red flag in `docs/frontend SKILL.txt`.
10. Two parallel implementations of the service-request flow: `app/(customer)/request/[service].tsx` → `components/request/forms/*Form.tsx` **and** the legacy `app/(customer)/request/details.tsx`. Only the first is wired; the second is dead/duplicate code.
11. Inline sub-components in screens: `DarkMap` and `SidebarDrawer` are both defined inside `app/(customer)/index.tsx` (100+ lines each), despite a `components/tracking/DarkMap.tsx` and `components/maps/TrackingMap.*` already existing.
12. `App.tsx` is the unused Expo blank-template placeholder (<ref_file file="/home/ubuntu/repos/RESQ-KENYA/App.tsx" />) — confusing for newcomers; real entry is `expo-router/entry`.
13. No shared `PageHeader` / `ScreenShell` wrapper — every screen re-codes its own safe-area + back arrow + title + trailing action (24+ duplicates across `app/`).
14. Forms folder uses PascalCase filenames (`TowingForm.tsx`) while `FormInput.tsx` and `StepIndicator.tsx` are named `FormInput`/`StepIndicator` and the skill-recommended colocated `use-*.ts` hooks are absent.

### D. Component-level issues
15. Six service forms (`TowingForm`, `FuelForm`, `BatteryForm`, `TireForm`, `DiagnosticsForm`, `AmbulanceForm`) share ~80% structure: header + `StepIndicator` + 3 steps + footer CTA + price summary + confirm. Each copies the same `styles.header`, `styles.backButton`, `styles.scroll`, `styles.sectionTitle`, etc. (~150 duplicated style lines per form).
16. Icon system: `EmergencySOS.tsx` uses `Ionicons` from `@expo/vector-icons`; every other screen uses `lucide-react-native`; `ServiceIcon.tsx` ships custom pictograms built from `View`s; and `app/(customer)/index.tsx` uses Lucide glyphs for services instead. Four visual languages for the same concept.
17. Service colour collision: `colors.service.towing` and `colors.service.battery` are both `#FFA500`, giving no visual differentiation between two primary flows.
18. `PhoneInput` and `OTPInput` in `components/ui/Input.tsx` aren't imported from `(auth)/login.tsx`, `(auth)/register.tsx`, or `(auth)/verify-otp.tsx` — all three re-implement phone/OTP inputs manually.
19. `TouchableOpacity` (61) and `Pressable` (411) are mixed with no clear rule — skill guidance says choose one and be consistent.
20. `components/ui/Card.tsx` `ServiceCard` takes an `emoji: string` prop, conflicting with the design-system insistence on Lucide/pictogram icons.
21. `StepIndicator` currently assumes exactly 3 steps visually (`line` in-between; label spacing) — form "4-step" flows would break silently.

### E. UX / flow issues
22. `app/(customer)/index.tsx` renders an _illustrative_ `DarkMap` with hardcoded `PROVIDER_MARKERS` — this is still the simulated prototype, not a real map. Must be replaced with `TrackingMap` before launch.
23. `SearchingScreen` (`app/(customer)/request/tracking/searching.tsx`) has no cancel path that returns the user to the request flow cleanly — timeout path exists but it's unclear what happens to the in-flight request record.
24. Landing / splash navigation race: `app/index.tsx` navigates after a fixed 1.5s timeout in `SplashScreen` regardless of whether `isAuthenticated` is resolved — can navigate an unauthenticated user to `(customer)`.
25. Tab bar on `(customer)/index` is hidden (`tabBarStyle: { display: 'none' }`), but the Home tab is still visible on all other customer tabs — visual inconsistency where Home is "special."
26. No global emergency/SOS entry point on most customer screens — the `EmergencySOS` component exists but is not mounted at the root layout as the design philosophy demands.
27. `app/index.tsx:86` sets `StatusBar style="dark"` on a dark-theme splash, so the status bar is invisible. All other screens correctly use `light`.
28. `ConfirmationCard` talks about "Track Provider" CTA (<ref_snippet file="/home/ubuntu/repos/RESQ-KENYA/components/request/ConfirmationCard.tsx" lines="86-96" />) but is never actually rendered in the wired flow (confirmation happens inline in each form).

### F. Accessibility (WCAG 2.1 AA)
29. Many `Pressable`s missing `accessibilityLabel` / `accessibilityRole` (partial coverage; forms are OK, legacy `details.tsx` largely is not).
30. `TextInput`s in forms have visible `<Text>` labels but no `accessibilityLabel` and no `htmlFor`-equivalent linkage on web.
31. Success / error state is conveyed by colour alone in a few places (e.g. fuel-type selection stripe in `FuelForm`, urgency-card border in `BatteryForm`) — violates skill rule "don't rely solely on colour."
32. Focus management: the modal `SidebarDrawer` in `app/(customer)/index.tsx` doesn't move focus to the close button on open, and doesn't trap focus — skill file calls this out explicitly.
33. Touch targets inconsistent — design-system doc claims 44pt minimum; several icon buttons are 32×32 (sidebar close button is 36, but tab-icon containers are 32 high).

### G. Performance & scalability
34. Many top-level `Dimensions.get('window')` reads at module load (forms, dashboards) — device rotation or split-screen resizing is not handled; values are captured once.
35. Animated loops (radar rings, pulse, glow) are started on mount with no pause when screen blurs; drains battery on long idle screens like `SearchingScreen`. Skill guidance: `AccessibilityInfo.isReduceMotionEnabled()` is respected only inside `SkeletonLoader` — not the dashboard pulse or SOS pulse.
36. Large screens render many shadow layers (`...shadows.card`, `...shadows.cardElevated`) on low-end Android — design-system doc warns against shadow-heavy design.
37. No image component abstraction; `expo-image` isn't used despite being recommended for caching; avatars / illustrations in `vehicles.tsx`, `profile.tsx`, `wallet.tsx` use raw `<Image>` or inline coloured `<View>`s.
38. Re-rendering: `app/(customer)/index.tsx` stores `slideAnim`/`backdropAnim` in refs but the parent screen re-renders every panel state change, recalculating huge style arrays.

### H. Copy, content, and localisation
39. Mock data (`MOCK_HISTORY` in `history.tsx`, `NAV_ITEMS` in `(customer)/index.tsx`, wallet balance `"KES 2,450"`) is hardcoded in screens. Skill rule: separate data from presentation.
40. Placeholder strings: `"John Mwangi"`, `"Safety Rating 4.74"`, `"ResQ Wallet — KES 2,450"` are visible in production build paths.
41. No i18n layer. App-wide copy is English-only despite Kenya having a strong Swahili speaker base (Kiswahili is co-official) — a production roadside app should support Swahili/English toggle.
42. Currency formatting is inline `KES {n.toLocaleString()}` in 20+ places — no `formatCurrency()` utility.

### I. Testing & tooling
43. Only 2 test files exist (`components/maps/TrackingMap.test.tsx`, `components/ui/PaymentModal.test.tsx`) for 55+ screens/components.
44. `eslint.config.js` includes a custom `eslint-plugin-resq-theme` but the plugin's enforcement appears partial — hardcoded hex values are still present in ~35 files.
45. No Storybook or visual regression harness — difficult to spot the design-drift above without running full app.

---

## 3. Detailed Findings & Fixes

For each numbered issue below, I give: **Problem → Why → Proposed solution → Implementation approach**.

### Finding 1 — Brand colour has two sources of truth
**Problem.** `tailwind.config.js` defines `voltage: '#FFD60A'` (yellow). `theme/voltage-premium.ts` and `design-system/MASTER.md` define `voltage = '#FFA500'` (orange). `docs/ResQ design philosophy.md` says yellow.
**Why it's a problem.** Any screen using NativeWind (`className="bg-voltage"`) will render a different colour than screens using `colors.voltage` from the theme. Visual inconsistency; brand breakage.
**Proposed solution.** Pick one (the MASTER.md answer is orange `#FFA500`). Generate the Tailwind theme from `theme/voltage-premium.ts` so the token is written once.
**Implementation approach.**
- Refactor `tailwind.config.js` to import tokens from `theme/voltage-premium.ts` at build time (via `require()`).
- Add a generated `theme/tokens.ts` that exports flat tokens consumable by both NativeWind and RN styles.
- Update `docs/ResQ design philosophy.md` to reference MASTER.md colour table.
- Add a CI lint rule (in `eslint-plugin-resq-theme`) to reject any hex literal inside `app/` or `components/`.

### Finding 2 — Legacy theme tokens coexist with semantic tokens
**Problem.** `colors.charcoal[800]`, `colors.voltage`, `colors.emergency` are used alongside `colors.background.secondary`, `colors.interactive.default`, `colors.status.error`. 40+ files reach for legacy.
**Why it's a problem.** Renaming or re-theming (e.g. light mode if ever added, or the Dubai premium market mentioned in MASTER.md) requires editing hundreds of call sites.
**Proposed solution.** Treat legacy tokens as _deprecated_, enforce semantic tokens going forward, migrate in tranches.
**Implementation approach.**
- Mark each legacy key with an `@deprecated` JSDoc tag in `theme/voltage-premium.ts` so IDEs highlight usage.
- Write a codemod (`jscodeshift` or `ts-morph`) that rewrites `colors.charcoal[900] → colors.background.primary`, `colors.voltage → colors.interactive.default`, `colors.emergency → colors.status.error`, etc. Run per-folder, one PR per folder.
- Add an ESLint rule `resq-theme/no-legacy-color` after migration completes.

### Finding 3 — PRICES duplicated
**Problem.** `constants/prices.ts` is the canonical price table; `app/(customer)/request/details.tsx:27-37` redefines it.
**Why it's a problem.** Prices can diverge; the 180.66 petrol price in `details.tsx` will silently go stale when `constants/prices.ts` updates.
**Proposed solution.** Delete the local copy, import from `constants/prices.ts`.
**Implementation approach.** Straight refactor; also audit `details.tsx`'s role overall (see Finding 10).

### Finding 5 — Primitive Button is bypassed
**Problem.** `components/ui/Button.tsx` implements primary / secondary / emergency / text variants with sizes and loading state. Only ~10 call-sites use it; 400+ screens hand-roll `Pressable + View + Text`.
**Why it's a problem.** Every CTA has subtly different padding, corner radius, and pressed-state behaviour. Skill doc flags "AI aesthetic" when buttons drift.
**Proposed solution.** Make `<Button>` the only way to render an interactive CTA. Extend if variants missing.
**Implementation approach.**
- Add variants the codebase actually uses: `ghost`, `icon`, `destructive`. Add `leftIcon`/`rightIcon` Lucide slots instead of the current `icon` prop.
- Write a codemod that flags any `Pressable` whose direct child is a `<Text>` and suggests a `<Button>` rewrite (manual review, not auto-apply — too many footguns).
- Add a `<PressableCard>` primitive in `components/ui/Card.tsx` for the "whole card is tappable" pattern used in forms/lists.

### Finding 6 — Duplicated phone/OTP inputs
**Problem.** `PhoneInput` and `OTPInput` exist in `components/ui/Input.tsx`. `app/(auth)/login.tsx`, `register.tsx`, and `verify-otp.tsx` hand-roll phone + OTP UI.
**Why it's a problem.** Validation, formatting, focus-management, and a11y drift across three copies.
**Proposed solution.** Replace the hand-rolled inputs with the primitives; extend the primitives with any missing features (Kenya flag, focus animation) so there's no loss of functionality.
**Implementation approach.** Three small PRs, one per auth screen. Visual regression snapshot each screen before + after.

### Finding 9/10 — Monolithic screen files + duplicate service flow
**Problem.** `app/(customer)/request/details.tsx` (1,436 L) and the `components/request/forms/*Form.tsx` (~300 L each) implement the same six service-request UIs twice. The per-service route `[service].tsx` is the wired one; `details.tsx` appears orphaned.
**Why it's a problem.** Maintenance cost doubles; bug fixes go into one and not the other; fresh contributors don't know which is live.
**Proposed solution.**
1. Confirm `[service].tsx` flow is the canonical one (it is — it's what the customer dashboard `router.push`es to).
2. Delete `details.tsx` (keep in git history).
3. Extract the shared scaffolding of the forms into a `<RequestFormShell>` + `useStepFlow` hook.
**Implementation approach.**
- Create `components/request/RequestFormShell.tsx` with: `header` (back + title), `StepIndicator` (n-steps, not hardcoded 3), `ScrollView` body, sticky footer (back / next / submit CTA), and the price-summary card.
- Convert each `*Form.tsx` to: a typed `Step[]` array (`title`, `body`, `canProceed`) passed to the shell, plus the service-specific state.
- Remove ~150 lines of duplicated styles per form.
- Update tests to cover the new `useStepFlow` hook.

### Finding 11/13 — Inline sub-components / no PageHeader
**Problem.** `DarkMap`, `SidebarDrawer` declared inline in `(customer)/index.tsx`. Every screen re-codes header safe-area + back + title.
**Proposed solution.** Extract to `components/layout/`:
- `ScreenShell` — handles safe area, default background, status bar, and optional header slot.
- `PageHeader` — back button, title, optional right action, optional subtitle.
- Move inline `DarkMap` to `components/maps/SimulatedDarkMap.tsx` (renamed to make clear it's a placeholder) OR delete once `TrackingMap` integration lands.
- Move inline `SidebarDrawer` to `components/layout/SidebarDrawer.tsx`.
**Implementation approach.** One `ScreenShell` PR, then migrate 3-4 screens per PR. Track progress in `docs/UI-OVERHAUL_PROGRESS.md`.

### Finding 12 — App.tsx is dead boilerplate
**Problem.** <ref_file file="/home/ubuntu/repos/RESQ-KENYA/App.tsx" /> renders `"Open up App.tsx to start working on your app!"` — it is never reached (`"main": "expo-router/entry"`).
**Proposed solution.** Delete `App.tsx`. Add a root `README` note clarifying that `app/_layout.tsx` is the real root.

### Finding 15 — Service-form duplication
Covered by Finding 10 solution (`RequestFormShell` + `useStepFlow`). Net line reduction estimate: ~900 lines.

### Finding 16 — Four icon systems
**Problem.** Lucide, `@expo/vector-icons`, custom `ServiceIcon` pictograms, emoji — all in active use.
**Why it's a problem.** Inconsistent stroke weight, colour inheritance, accessibility. Bundle size carries both icon libs.
**Proposed solution.** Standardise on `lucide-react-native`. Delete `ServiceIcon.tsx` custom pictograms (or keep as a visual-polish option but only for hero / marketing contexts). Replace `Ionicons` in `EmergencySOS` with `lucide-react-native` `Siren` / `AlertTriangle`.
**Implementation approach.**
- Find + replace `Ionicons` imports in `EmergencySOS.tsx`.
- Remove `@expo/vector-icons` from `package.json` if no other usage (grep first).
- Remove emoji glyphs from `ServiceCard` / `TowingForm` VEHICLE_TYPES — replace with Lucide `Car`, `Truck`, `Bike`.

### Finding 17 — Service colour collision
**Problem.** `towing` and `battery` share `#FFA500`.
**Proposed solution.** Assign battery a distinct accent. The physical battery-colour intuition is red/green; design-system already reserves red for emergency, so use a cool blue (`#29B6F6` info glow already compatible) for battery, or a warm gold (`#F9A825`) if we want it to read "electric/energy" without colliding with towing orange.
**Implementation approach.** Update `colors.service.battery` in `theme/voltage-premium.ts`; update `design-system/MASTER.md` table.

### Finding 19 — TouchableOpacity vs Pressable
**Problem.** Both in use; inconsistent pressed-state behaviour.
**Proposed solution.** Standardise on `Pressable` (RN-recommended, better a11y). Replace the 61 `TouchableOpacity` call-sites.
**Implementation approach.** Batch codemod: `TouchableOpacity → Pressable`, `activeOpacity={n}` → pressed-state style function.

### Finding 22 — Simulated dark map is still in production dashboard
**Problem.** The customer home screen draws a fake grid map with hardcoded provider dots. Docs say real map with live provider tracking is required.
**Proposed solution.** Wire `components/maps/TrackingMap` (which has `.native` and `.web` variants and a test) into `(customer)/index.tsx` behind a `__DEV__` guard so the fake map only shows in Expo Go.
**Implementation approach.**
- Pull the geo-nearby query from `services/` (or stub it) and feed provider locations to `TrackingMap`.
- Keep `SimulatedDarkMap` as the web fallback until real map for web is implemented.

### Finding 23 — Searching screen cancel path
**Problem.** `searching.tsx` hasTimedOut branch shows an error state; the happy path auto-advances. No explicit "Cancel request" CTA returns the user to the request form with their data intact.
**Proposed solution.** Add a sticky "Cancel request" text button above the map. On press: confirmation sheet → return to `/(customer)/request/[service]` with the form's last state (use `expo-router` query params or Zustand draft store).

### Finding 24 — Splash navigation race
**Problem.** `SplashScreen` navigates after 1.5s regardless of auth-loading state.
**Proposed solution.** Gate navigation on `authLoading === false`. If still loading at 1.5s, show a small spinner and wait.

### Finding 26 — No global SOS entry point
**Problem.** `EmergencySOS` component is excellent but not mounted anywhere.
**Proposed solution.** Mount a floating SOS FAB in `app/(customer)/_layout.tsx` so it sits on every customer screen. Exclude the splash and auth screens.

### Finding 29–33 — Accessibility gaps
**Proposed solution.**
- Add `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` to every `Pressable`. Add a lint rule (`eslint-plugin-jsx-a11y` with RN reporter) to enforce.
- Pair every colour state change with an icon or text marker (✓ already present on steps; fuel-type selection needs a check icon, urgency cards need an "active" label).
- Implement focus trap in `SidebarDrawer` using `react-native-focus-trap` or `AccessibilityInfo.setAccessibilityFocus()`.
- Audit touch targets with a lint rule: any `Pressable` with computed height < 44 is flagged.

### Finding 34–36 — Performance
**Proposed solution.**
- Use `useWindowDimensions()` instead of `Dimensions.get('window')` at module load — responsive to rotation.
- Pause all `Animated.loop` on `navigation.addListener('blur', …)` and resume on `focus`. Centralise in a `useFocusedAnimation` hook.
- Respect `AccessibilityInfo.isReduceMotionEnabled()` globally, not only in `SkeletonLoader`.
- Replace `shadow*` on Android with `elevation` only (shadow has no effect on Android RN; elevation is GPU-accelerated).

### Finding 39–42 — Data, copy, i18n
**Proposed solution.**
- Move mock data to `__mocks__/` or a `src/fixtures/` folder.
- Add `utils/formatCurrency.ts` with Intl.NumberFormat (KES locale).
- Introduce `i18next` with `en` + `sw` (Swahili) locale bundles. Wrap strings with `t('login.title')` — start with auth + SOS flows (highest user-anxiety surfaces).

### Finding 43–44 — Testing
**Proposed solution.**
- Add render tests for all primitives (`Button`, `Card`, `Input`, `PhoneInput`, `OTPInput`, `StepIndicator`, `ErrorState`, `EmptyState`).
- Add integration tests for each request form: fill-in → advance → submit → calls `onSubmit` with correct shape.
- Wire `jest --coverage` into CI with a gradual threshold (50% → 70% → 80%).

---

## 4. Priority Actions (What to fix first)

Ranked by **user-impact × blast-radius × effort**. P0 items should land before any new feature work.

### P0 — Foundation (Week 1)
1. **Reconcile brand colour** (Finding 1). Single source of truth; Tailwind config imports from theme. _1 PR, ~1 day._
2. **Delete `App.tsx` dead code** (Finding 12). _Trivial, clears confusion._
3. **Remove duplicated `PRICES` in `details.tsx`** (Finding 3). _Trivial, high correctness risk._
4. **Kill the orphan `details.tsx`** (Finding 10) once forms flow is confirmed wired. _Huge line-count reduction._
5. **Mount `EmergencySOS` FAB in customer layout** (Finding 26). _Core safety feature currently dormant._
6. **Fix splash navigation race** (Finding 24). _Auth correctness._

### P1 — Primitives & structure (Week 2-3)
7. **Extract `ScreenShell` + `PageHeader`** (Finding 13). Refactor 6-8 screens to use it in subsequent PRs.
8. **Refactor service forms to `RequestFormShell` + `useStepFlow`** (Finding 10/15). _Biggest DRY win (~900 LOC)._
9. **Replace hand-rolled phone/OTP inputs in auth with primitives** (Finding 6).
10. **Standardise on `lucide-react-native`; remove `@expo/vector-icons`** (Finding 16). Delete or demote `ServiceIcon`.
11. **Wire `Button` primitive into every CTA** (Finding 5).

### P2 — Quality & polish (Week 4-5)
12. **Accessibility pass** (Findings 29–33). Lint rule + audit sweep per route group.
13. **Replace simulated `DarkMap` with `TrackingMap`** on real devices (Finding 22).
14. **Responsive + performance sweep** (Findings 34–38). `useWindowDimensions`, `useFocusedAnimation`, elevation-only on Android.
15. **Distinct battery service colour** (Finding 17).
16. **Testing pushes** (Findings 43–44). Primitive tests, request-form integration tests.

### P3 — Product depth (Week 6+)
17. **Swahili localisation** (Finding 41). Auth + SOS + dashboard first; roll out per flow.
18. **Currency/date utilities** (Finding 42).
19. **Storybook for primitives** (Finding 45). Catches drift early.
20. **Legacy-token codemod** (Finding 2). Final step; do once most screens are on `ScreenShell`.

---

## 5. Suggested Follow-up Artifacts

To avoid a repeat of the current drift, propose adding:

- `docs/frontend_audit_checklist.md` — a per-PR checklist derived from `docs/frontend SKILL.txt`'s Verification section, enforced in PR template.
- `design-system/pages/` directory (already scaffolded by MASTER.md intent) with one file per screen spelling out tokens & deviations.
- `components/ui/primitives/README.md` — one-pager of "if you need a button, use `<Button>`; if you need a screen wrapper, use `<ScreenShell>`" with screenshots.
- `.github/pull_request_template.md` linking to the audit checklist.

---

## 6. Appendix — Quick-reference stats

| Metric | Count |
|---|---|
| Screen files > 500 LOC | 10 |
| Largest screen (`request/details.tsx`) | 1,436 LOC |
| Inline `fontSize: N` literals | ~372 |
| Inline `padding*: N` literals | ~91 |
| `StyleSheet.create` blocks | 58 |
| `TouchableOpacity` call-sites | 61 |
| `Pressable` call-sites | 411 |
| Test files | 2 |
| Icon libraries in use | 4 (lucide, expo-vector, custom pictogram, emoji) |
| Brand-colour definitions | 2 conflicting (`#FFD60A` vs `#FFA500`) |

---

_End of audit._
