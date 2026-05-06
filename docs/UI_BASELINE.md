# UI_BASELINE.md — ResQ Kenya Frontend Audit Snapshot

**Date**: 2026-05-06  
**Branch scanned**: `main` (HEAD at time of audit)  
**Purpose**: Establish current UI state before Phase 2 refactor.  
**Scope**: Frontend only (UI structure, styling, components). Backend logic is read-only.

---

## 1. Screen Inventory (Grouped by Module)

### CLIENT MODULE (Foundation)

| # | Route | File | Lines | Purpose |
|---|-------|------|-------|---------|
| 1 | `/` | `app/index.tsx` | 332 | Splash (loading) + Landing Page (logged out) |
| 2 | `/(customer)/` | `app/(customer)/index.tsx` | 1067 | Home/Dashboard — 3-state bottom sheet, map, sidebar, service grid |
| 3 | `/(customer)/history` | `app/(customer)/history.tsx` | 841 | Service history list with filters |
| 4 | `/(customer)/wallet` | `app/(customer)/wallet.tsx` | 660 | Wallet balance, top-up, transaction list |
| 5 | `/(customer)/profile` | `app/(customer)/profile.tsx` | 637 | Digital Glovebox — settings, garage, account |
| 6 | `/(customer)/vehicles` | `app/(customer)/vehicles.tsx` | 686 | Vehicle management |
| 7 | `/(customer)/help` | `app/(customer)/help.tsx` | 742 | Emergency Safety Hub |
| 8 | `/(customer)/terms` | `app/(customer)/terms.tsx` | 164 | Terms & Conditions |
| 9 | `/(customer)/request/[service]` | `app/(customer)/request/[service].tsx` | — | Dynamic service request form |
| 10 | `/(customer)/request/tracking/searching` | `.../searching.tsx` | — | Radar animation, searching for provider |
| 11 | `/(customer)/request/tracking/arriving` | `.../arriving.tsx` | — | Provider en route |
| 12 | `/(customer)/request/tracking/en-route` | `.../en-route.tsx` | — | Provider on the way |
| 13 | `/(customer)/request/tracking/in-progress` | `.../in-progress.tsx` | — | Service in progress |
| 14 | `/(customer)/request/tracking/complete` | `.../complete.tsx` | — | Service completion/rating |

### PROVIDER MODULE (Pattern Reuse)

| # | Route | File | Lines | Purpose |
|---|-------|------|-------|---------|
| 15 | `/(provider)/` | `app/(provider)/index.tsx` | 513 | Provider Dashboard — online toggle, stats, nearby requests |
| 16 | `/(provider)/requests` | `app/(provider)/requests.tsx` | 425 | Incoming request list (accept/decline) |
| 17 | `/(provider)/active-job` | `app/(provider)/active-job.tsx` | 454 | Active job tracking (real backend subscription) |
| 18 | `/(provider)/earnings` | `app/(provider)/earnings.tsx` | 313 | Earnings summary |
| 19 | `/(provider)/settings` | `app/(provider)/settings.tsx` | 271 | Provider profile & settings |
| 20 | `/(provider)/medical-dashboard` | `app/(provider)/medical-dashboard.tsx` | 785 | Medical provider dashboard |
| 21 | `/(provider)/medical-onboarding` | `app/(provider)/medical-onboarding.tsx` | 835 | Medical provider onboarding wizard |

### ADMIN MODULE (Structured Interface)

| # | Route | File | Lines | Purpose |
|---|-------|------|-------|---------|
| 22 | `/(admin)/analytics-dashboard` | `app/(admin)/analytics-dashboard.tsx` | 633 | Predictive analytics & metrics |
| 23 | `/(admin)/pricing-dashboard` | `app/(admin)/pricing-dashboard.tsx` | 411 | Surge pricing management |

### AUTH (Shared)

| # | Route | File | Lines | Purpose |
|---|-------|------|-------|---------|
| 24 | `/(auth)/login` | `app/(auth)/login.tsx` | 379 | Phone number login |
| 25 | `/(auth)/register` | `app/(auth)/register.tsx` | 479 | Registration |
| 26 | `/(auth)/verify-otp` | `app/(auth)/verify-otp.tsx` | 385 | OTP verification |

**Total**: ~26 screens, ~15,637 lines across app + components.

---

## 2. Component Structure

### Shared UI Components (`components/ui/`)

| Component | Lines | Variants | Theme Usage |
|-----------|-------|----------|-------------|
| `Button.tsx` | 195 | primary, secondary, emergency, text | `colors`, `shadows`, `borderRadius`, `spacing`, `typography` |
| `Card.tsx` | 250 | standard, elevated, service + `ServiceCard` | `colors`, `shadows`, `borderRadius`, `spacing` |
| `Input.tsx` | 224 | text input with label, error, icon slots | `colors`, `borderRadius`, `spacing` |
| `EmptyState.tsx` | 229 | configurable icon + message | `colors`, `spacing` |
| `ErrorState.tsx` | 236 | configurable error display + retry CTA | `colors`, `spacing` |
| `SkeletonLoader.tsx` | 280 | `SkeletonCard`, `SkeletonListItem`, `SkeletonStatRow` | `colors`, `borderRadius` |
| `PaymentModal.tsx` | 265 | M-Pesa payment modal | `colors`, `spacing` |
| `ServiceIcon.tsx` | 308 | Custom pictogram icons (towing/battery/tire/fuel/diagnostics/ambulance) | `colors` |

### Request Flow Components (`components/request/`)

| Component | Lines | Purpose |
|-----------|-------|---------|
| `RequestFormShell.tsx` | 177 | Shared shell: header, step indicator, footer CTA |
| `StepIndicator.tsx` | 130 | Step progress dots |
| `FormInput.tsx` | 126 | Request-specific input wrapper |
| `ConfirmationCard.tsx` | 187 | Confirmation summary card |
| `use-step-flow.ts` | — | Hook: multi-step navigation logic |
| `forms/TowingForm.tsx` | — | Towing-specific form fields |
| `forms/FuelForm.tsx` | — | Fuel-specific form fields |
| `forms/BatteryForm.tsx` | — | Battery-specific form fields |
| `forms/TireForm.tsx` | — | Tire-specific form fields |
| `forms/DiagnosticsForm.tsx` | — | Diagnostics-specific form fields |
| `forms/AmbulanceForm.tsx` | — | Ambulance-specific form fields |

### Tracking Components (`components/tracking/`)

| Component | Lines | Purpose |
|-----------|-------|---------|
| `DarkMap.tsx` | 213 | Simulated dark-themed map with road grid |
| `ProviderCard.tsx` | 133 | Provider info card (avatar, name, rating, vehicle) |
| `ProgressSteps.tsx` | 94 | Vertical tracking step indicator |

### Map Components (`components/maps/`)

| Component | Lines | Purpose |
|-----------|-------|---------|
| `TrackingMap.tsx` | 7 | Platform switch |
| `TrackingMap.native.tsx` | 438 | react-native-maps with dark styling |
| `TrackingMap.web.tsx` | 124 | Web fallback (CSS grid-based map) |
| `LocationMapPreview.tsx` | 161 | Small map preview for forms |
| `PlatformMapView.native.tsx` | 9 | Native MapView wrapper |
| `PlatformMapView.web.tsx` | 114 | Web MapView fallback |

### Layout Components (Inline in Screens)

- `EmergencySOS` (`components/EmergencySOS.tsx`) — FAB with countdown modal, mounted at customer layout level
- `SidebarDrawer` — inline in `app/(customer)/index.tsx`
- `DarkMap` — inline in `app/(customer)/index.tsx` (separate from `components/tracking/DarkMap.tsx`)

---

## 3. Styling Approach

### Primary: `StyleSheet.create` (dominant)

- **58 files** use `StyleSheet.create`
- All screens in `app/` use inline `StyleSheet.create` at file bottom
- All shared components in `components/` use `StyleSheet.create`

### Secondary: NativeWind/Tailwind `className` (limited)

- **Only ~86 className usages** across entire codebase
- Confined almost exclusively to `app/firebase-test.tsx` and `app/database-test.tsx` (dev/test screens)
- Production screens do NOT use className — they use StyleSheet

### Theme Token System: `theme/voltage-premium.ts` (743 lines)

Exports used across the app:

| Export | Used By | Description |
|--------|---------|-------------|
| `colors` | All production screens | Semantic color tokens (background, text, interactive, status, service) |
| `spacing` | All production screens | 4px-based scale (xs=4, sm=8, md=16, lg=24, xl=32, xxl=48, xxxl=64) |
| `borderRadius` | All production screens | sm=4, md=8, lg=12, xl=16, 2xl=24, full=9999 |
| `shadows` | Cards, buttons | Dark-theme optimized shadows |
| `typography` | Most screens | Font sizes + weights + mobile/desktop scales |
| `touchTargets` | Buttons, SOS | minimum=44, standard=48, large=56, sos=80 |
| `button`, `input`, `card` | Component tokens | Pre-composed style objects |
| `componentStyles` | Available but underused | Full pre-composed style objects |
| `voltageColors` | Admin dashboards | Legacy convenience alias |
| `voltageSpacing` | Admin dashboards | Alias for `spacing` |

### Tailwind Config Discrepancy (CRITICAL)

```js
// tailwind.config.js
voltage: '#FFD60A',        // ← WRONG (yellow)
'voltage-bright': '#FFF455',
'voltage-deep': '#E6B800',
```

```ts
// theme/voltage-premium.ts
colors.voltage: '#FFA500',  // ← CORRECT (orange)
colors.interactive.default: '#FFA500',
```

The Tailwind `voltage` color is `#FFD60A` (yellow) while the theme system defines voltage as `#FFA500` (orange). Since production screens use StyleSheet (not Tailwind), this discrepancy only manifests in the dev test screens but represents a drift risk.

### Icon Systems (Dual)

| Library | Usage Count | Where |
|---------|-------------|-------|
| `lucide-react-native` | 37 imports | Customer screens, provider layout, request forms, shared UI |
| `@expo/vector-icons` (Ionicons) | 47 imports | Admin dashboards, EmergencySOS, provider dashboard, medical screens |

Two icon libraries serving the same purpose — inconsistency flagged in audit.

### Hardcoded Colors

- **93 instances** of raw hex values (`#FF...`, `#0F...`) in screen files
- ESLint plugin `resq-theme/no-hardcoded-colors` is configured as `error` but not enforced in CI
- Primary offender: `app/(customer)/index.tsx` line 31-36 (`SERVICES` array with inline colors)

---

## 4. State Management

| Pattern | Location | Scope |
|---------|----------|-------|
| React Context | `services/AuthContext.tsx` | Auth state (user, role, loading) |
| Local `useState` | Every screen | Screen-level state |
| Animated refs | Every screen | Animation state (Animated.Value) |

- **No global store** (no Zustand, Redux, MobX)
- All data is mock/hardcoded within screens (no live API calls from customer side)
- Provider `active-job.tsx` is the only screen with real backend subscriptions

---

## 5. API Usage Patterns

### Services Layer (`services/`)

| Service | Customer Use | Provider Use | Admin Use |
|---------|-------------|--------------|-----------|
| `auth.service.ts` | Login/register OTP | Same | — |
| `customer.service.ts` | **NOT CALLED** (mock navigation) | — | — |
| `payment.service.ts` | **NOT CALLED** (demo wrapper only) | — | — |
| `realtime.service.ts` | **NOT CALLED** (timer-based tracking) | `active-job.tsx` subscribes | — |
| `firestore.service.ts` | — | `index.tsx` reads nearby requests | — |
| `location.service.ts` | — | `index.tsx` gets location | — |
| `surge-pricing.service.ts` | — | — | `pricing-dashboard.tsx` |
| `demand-forecast.service.ts` | — | — | `analytics-dashboard.tsx` |
| `churn-prediction.service.ts` | — | — | `analytics-dashboard.tsx` |

**Key audit finding**: Customer-side screens (request, payment, tracking) render UI but **never call backend services**. They navigate with mock params and advance tracking screens via `setTimeout`. This is a backend-wiring issue documented in `docs/system-audit.md` — NOT a UI-refactor concern for Phase 2 (UI layout/consistency is fixable independently of wiring).

---

## 6. Audit-Identified Frontend Issues (Summary Reference)

From `docs/system-audit.md` — frontend section. Listed here for refactor targeting:

### Critical

| ID | Summary | Location |
|----|---------|----------|
| F-CRIT-1 | Customer request flow never calls `createServiceRequest` | `app/(customer)/request/[service].tsx` |
| F-CRIT-2 | Payment flow hardcodes `initiatePaymentDemo` | `components/ui/PaymentModal.tsx` |
| F-CRIT-3 | Tracking screens use fixed `setTimeout` not real subscriptions | `app/(customer)/request/tracking/*` |

### High

| ID | Summary | Location |
|----|---------|----------|
| F-HIGH-1 | Battery service color inconsistency (`#FFCA28` vs `#FFA500`) | `app/(customer)/index.tsx:33` |
| F-HIGH-2 | Tracking has no error/cancelled/timeout states | `app/(customer)/request/tracking/*` |

### Medium

| ID | Summary | Location |
|----|---------|----------|
| F-MED-1 | ErrorBoundary has no recovery affordance | `app/_layout.tsx` |
| F-MED-2 | `SERVICES` array duplicates theme-owned data | `app/(customer)/index.tsx:30-37` |
| F-MED-3 | Entry screen doesn't handle authed user with no role | `app/index.tsx` |
| F-MED-4 | EmergencySOS countdown non-cancellable on background | `components/EmergencySOS.tsx` |
| F-MED-5 | No `useNativeDriver` audit on animation chains | Tracking screens |

### Low / Quality

| ID | Summary | Location |
|----|---------|----------|
| F-LOW-1 | Dual icon libraries (lucide + Ionicons) | Across all modules |
| F-LOW-2 | Inconsistent import patterns across screens | App-wide |
| F-LOW-3 | No accessibility labels on interactive elements | App-wide |

---

## 7. Key Inconsistencies Identified

1. **Monolithic screens** — Customer home (1067 lines) contains `DarkMap`, `SidebarDrawer`, `SmartIntentBar` inline. These should be extracted.
2. **Dual icon systems** — lucide-react-native vs @expo/vector-icons (Ionicons). No single standard.
3. **Tailwind vs StyleSheet** — Tailwind configured but unused in production. Config colors conflict with theme.
4. **Service data duplication** — `SERVICES` array in home screen duplicates `colors.service.*` and `SERVICE_TYPES`.
5. **Admin screens use legacy aliases** — `voltageColors`, `voltageSpacing`, `Ionicons` vs main system using `colors`, `spacing`, `lucide`.
6. **Hardcoded font sizes** — Some screens use raw numbers (e.g., `fontSize: 56`) instead of `typography.*`.
7. **No shared loading/empty states** in all screens — `SkeletonLoader`, `EmptyState`, `ErrorState` exist but adoption is partial.
8. **Touch target compliance** — Not verified across all interactive elements.

---

## 8. Design System Status

| Aspect | Status | Notes |
|--------|--------|-------|
| Color palette | Defined (Voltage Premium) | Brand orange `#FFA500`, bg `#0F0F0F`, fully tokenized |
| Spacing system | Defined (4px grid) | Exported as `spacing` — adopted in most screens |
| Typography | Defined | `typography.mobile.*` / `typography.desktop.*` — underused |
| Component tokens | Defined | `button`, `input`, `card`, `componentStyles` — available but screens often re-implement |
| Touch targets | Defined | `touchTargets.minimum=44, sos=80` — not enforced everywhere |
| ESLint enforcement | Configured | `no-hardcoded-colors: error`, `no-hardcoded-spacing: warn` — not run in CI |
| Tailwind integration | Broken | Config uses wrong brand color (`#FFD60A`), unused in prod |

---

## Skills Applied

- **Source-Driven Development**: Scanned actual source files to build this baseline; no assumptions from memory.
- **Frontend-UI-Engineering**: Assessed component architecture, accessibility gaps, design system adherence.
- **Code-Review-and-Quality**: Identified inconsistencies (dual icons, hardcoded values, monolithic files).
- **Incremental-Implementation**: This is a read-only audit step (Phase 1). No code changes made.

---

## Next Step

Await instruction to begin **Phase 2 — Module 1 (CLIENT)**, starting with the Home/Dashboard screen (gold standard).
