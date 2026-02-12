---
name: ResQ Emergency Platform Development
description: Specialized skill for developing the ResQ roadside and medical emergency assistance platform for Kenya and Dubai markets
---

# ResQ Platform Development Skill

This skill provides context-specific guidance for developing the ResQ emergency mobility platform - a specialized roadside and medical assistance service for emerging markets.

## Project Context

### What is ResQ?
ResQ is a mobile-first emergency response platform connecting motorists and medical emergency cases with verified service providers in real-time. Think "Uber for emergencies" but specialized for complex asset management (towing, fuel, medical response) rather than passenger transport.

**Mission:** Deliver instant, reliable, transparent emergency mobility services across Africa and Middle East.

**Markets:** 
- Dubai (UAE) - Premium positioning
- Nairobi (Kenya) - Mass market positioning

### Core Services (The "6 Pillars")
1. **Towing & Recovery** - Vehicle breakdowns and accidents
2. **Battery Jumpstart** - Dead battery assistance  
3. **Tire Repair** - Puncture and tire change services
4. **Fuel Delivery** - Emergency fuel to stranded vehicles
5. **Vehicle Diagnostics** - On-site professional diagnostics
6. **Medical Response** - Ambulance/EMT emergency services

## Technology Stack

### Frontend
- **Platform:** React Native with Expo (iOS, Android, Web)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind-style inline system (NativeWind not used - custom token system)
- **Navigation:** expo-router (file-based routing)
- **Maps:** react-native-maps (with platform-specific fallbacks)
- **State:** React Context API + hooks

### Backend (Current/Planned)
- **Primary:** Firebase (Firestore, Auth, Cloud Functions, Storage)
- **Payments:** 
  - M-Pesa Daraja API (Kenya - mobile money)
  - Stripe (Dubai - cards)
- **Infra:** AWS Multi-Region (planned for Phase 4)

### Key Dependencies
```json
{
  "expo": "~52.x",
  "react-native": "latest",
  "firebase": "^10.x",
  "react-native-maps": "latest",
  "expo-linear-gradient": "latest"
}
```

## Design System: "Voltage Premium"

Brand Identity

Primary Color: "Voltage Orange" #FFA500 (electric orange - represents instant energy, speed, reliability)
Logo: "RESQ" with orange-boxed "Q"
Aesthetic: Dark theme, premium, energetic, trustworthy

Color System (Defined in tailwind.config.js)
javascriptcharcoal: {
  900: '#0F0F0F',  // Primary black (rich, not pure)
  800: '#1A1A1A',  // UI backgrounds
  700: '#252525',  // Elevated surfaces (cards, modals)
  600: '#2E2E2E'   // Dividers/borders
},
voltage: '#FFA500',           // Primary brand (electric orange)
'voltage-bright': '#FFF455',  // Highlights, glow effects
'voltage-deep': '#E6B800',    // Pressed states, shadows
emergency: '#FF3D3D',         // Critical alerts ONLY (SOS button)
success: '#00E676',           // Service complete, verification
warning: '#FF9800',           // Vehicle issues, alerts
medical: '#DC143C'            // Ambulance services specifically
Service-Specific Colors
javascriptserviceTowing: '#FFA500',     // Uses primary voltage orange
serviceFuel: '#FFA500',       // Uses primary voltage orange
serviceBattery: '#FFA500',    // Uses primary voltage orange
serviceTire: '#FFA500',       // Uses primary voltage orange
serviceDiagnostic: '#FFA500', // Uses primary voltage orange
serviceMedical: '#DC143C'     // Medical-specific red
Theme File Location
All design tokens live in:

tailwind.config.js - Tailwind CSS tokens (web)
theme/voltage-premium.ts - React Native tokens (mobile)

CRITICAL: Both files must stay in sync. Orange (#FFA500) is the source of truth.
UI Patterns

Maps First: Full-screen maps with bottom panels (not sidebars)
Pictogram Icons: Custom vector icons (not emojis) via components/ui/ServiceIcon.tsx
Dark Theme Only: Charcoal backgrounds (#0F0F0F, #1A1A1A), high contrast text
Mobile-First: All designs start mobile, scale up
Voltage Glow Effects: Subtle glow on hover/active states using voltage orange
Glass Morphism: Semi-transparent panels with backdrop blur

Typography

Font Family: Inter (primary), JetBrains Mono (code/technical)
Font Weights: 400 (regular), 600 (semibold), 700 (bold)
Base Size: 16px (mobile), 18px (desktop)
Line Height: 1.5 (body), 1.2 (headings)

Design Philosophy
The "Voltage Premium" aesthetic represents:

Instant Energy - orange like electricity/lightning
Speed - Fast emergency response
Reliability - Professional, trustworthy
Premium - High-quality service
Urgency - Attention-grabbing without panic

Brand Voice: "Fast • Reliable • Comprehensive • Professional • Accessible"

Color Usage Rules
When to Use Voltage Orange (#FFA500):
✅ Primary CTAs ("Request Help", "Get Started", "Confirm")
✅ Active states and selections
✅ Brand presence (logo, accents)
✅ Navigation highlights
✅ Loading indicators
✅ Service availability badges
✅ Links and interactive elements
✅ Success indicators (non-critical)
When to Use Emergency Red (#FF3D3D):
⚠️ ONLY for:

SOS/Emergency button (fixed position)
Critical danger alerts
Failed payment notifications
System errors requiring immediate attention
Ambulance-specific critical notifications

❌ DO NOT use red for:

Regular buttons or CTAs
Standard notifications
Service category icons
General navigation
Standard form validation

When to Use Service Colors:

Service type icons (each service can have subtle color variations)
Category badges
Service-specific status indicators
But voltage yellow remains dominant across the interface


Anti-Patterns (DO NOT USE)
Colors:

❌ Yellow (#FFD60A) - Outdated, not part of brand
❌ Purple/pink gradients - Generic AI aesthetic
❌ Light mode colors - Dark theme is brand identity
❌ Low contrast combinations - Accessibility requirement

UI Elements:

❌ Emojis as icons - Use SVG components
❌ Hardcoded hex colors - Use Tailwind classes or theme tokens
❌ Magic numbers for spacing - Use Tailwind spacing scale
❌ Light theme toggle - Dark only by design
❌ Bright neon colors - Professional, not flashy

Interactions:

❌ Animations without prefers-reduced-motion check
❌ Touch targets <44pt - Mobile accessibility
❌ Auto-playing videos/animations
❌ Blocking modals without escape
❌ Form submissions without loading states


Accessibility Requirements (WCAG 2.1 AA)
Color Contrast (All Verified):
✅ White (#FFFFFF) on Charcoal (#0F0F0F): 20.35:1 (Excellent)
✅ Voltage (#FFA500) on Charcoal (#0F0F0F): 12.8:1 (AAA)
✅ Gray (#A0A0A0) on Charcoal (#0F0F0F): 7.2:1 (Good)
✅ Dark text (#0F0F0F) on Voltage (#FFA500): 12.8:1 (AAA)
Interactive Elements:

Minimum touch target: 44px × 44px (iOS/Android standard)
Focus indicators: 2px solid voltage yellow outline, 4px offset
Keyboard navigation: All interactive elements must be keyboard accessible
Screen readers: Proper ARIA labels, semantic HTML
Motion: Respect prefers-reduced-motion media query


Platform-Specific Guidelines
React Native (Mobile):
javascript// Use theme tokens from theme/voltage-premium.ts
import { theme } from '@/theme/voltage-premium';

<View style={{ backgroundColor: theme.colors.charcoal[900] }}>
  <Text style={{ color: theme.colors.voltage }}>Voltage Text</Text>
</View>
Web (Tailwind):
jsx// Use Tailwind classes from tailwind.config.js
<div className="bg-charcoal-900">
  <h1 className="text-voltage">Voltage Heading</h1>
</div>
CRITICAL: Never hardcode colors. Always use theme tokens or Tailwind classes.

## Business Logic Rules

### Revenue Model (CRITICAL)
```typescript
// Customer pays 100%
// Platform takes 25% commission:
customerPayment = servicePrice
resqCommission = customerPayment * 0.25
providerEarning = customerPayment * 0.75
```

### Service Pricing (Dual Market)
Dubai (Premium):
- Towing: $50, Fuel: $15, Battery: $25, Diagnostics: $40, Medical: $100

Nairobi (Mass Market):  
- Towing: $20, Fuel: $5, Battery: $10, Diagnostics: $15, Medical: $30

**IMPORTANT:** All prices in `theme/voltage-premium.ts` under `PRICES` constant.

### B2B vs B2C
- **B2C (60%):** Individual motorists, pay-per-use
- **B2B (40%):** Corporate fleets, subscriptions $500-$2000/month
- **B2B is strategic priority** - provides revenue stability

## Project Structure

```
resq-kenya/
├── app/
│   ├── index.tsx              # Welcome screen
│   ├── (auth)/                # Authentication flow
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── verify-otp.tsx
│   ├── (customer)/            # Customer app (main)
│   │   ├── index.tsx          # Dashboard with map
│   │   ├── wallet.tsx         # M-Pesa wallet
│   │   ├── history.tsx        # Service history
│   │   └── profile.tsx        # User settings
│   └── (provider)/            # Provider app (future)
├── components/
│   ├── ui/
│   │   ├── ServiceIcon.tsx    # Pictogram icons
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   └── maps/
│       └── PlatformMapView.*  # Platform-specific map components
├── services/                   # Business logic
│   ├── auth.service.ts
│   ├── location.service.ts
│   ├── payment.service.ts
│   └── firestore.service.ts
├── theme/
│   └── voltage-premium.ts     # Design system (source of truth)
└── docs/
    ├── ROADMAP_TO_PRODUCTION.md
    ├── PHASE1_COST_ACCOUNTING.md
    └── Res-q Bizplan Antigravity.txt
```

## Development Patterns

### 1. Service Request Lifecycle
```typescript
type OrderStage = 
  | 'idle'        // Browsing services
  | 'details'     // Entering service details
  | 'searching'   // Finding provider
  | 'tracking'    // Provider en-route
  | 'arrived'     // Provider on-scene
  | 'payment'     // Processing payment
  | 'complete'    // Service done

// Always use this state machine in service flows
```

### 2. Location Handling
```typescript
// Kenya default (Nairobi CBD)
NAIROBI_DEFAULT = { lat: -1.2864, lng: 36.8172 }

// Always request permissions before location access
const permission = await requestLocationPermission()
if (!permission) {
  // Use default location
}
```

### 3. Payment Flow (M-Pesa Priority)
```typescript
// Kenya: M-Pesa STK Push
// Dubai: Stripe Payment Intent
// Always show both options where applicable
```

### 4. Error Handling
```typescript
// Use try-catch with user-friendly messages
try {
  await serviceCall()
} catch (error) {
  // Log for debugging
  console.error('Service error:', error)
  // Show user-friendly message
  setError('Unable to connect. Please try again.')
}
```

## Testing Standards

### Unit Tests (Jest)
- Target: 90%+ coverage
- Current: **394 tests passing across 18 test suites**
- All tests located in `__tests__/` folder (centralized)

### Test Folder Structure
```
__tests__/
├── services/     # 12 service test files
├── types/        # 2 type test files  
├── theme/        # 1 theme test file
├── utils/        # 1 utility test file
└── provider/     # 2 provider screen test files
```

### Manual Testing Checklist
- [ ] Works on iOS (Expo Go)
- [ ] Works on Android (Expo Go)  
- [ ] Works on Web (localhost)
- [ ] M-Pesa flow tested with sandbox
- [ ] All 6 services selectable
- [ ] Maps render on all platforms

## Common Tasks & Solutions

### Adding a New Service Type
1. Update `SERVICES` array in `app/(customer)/index.tsx`
2. Add icon to `components/ui/ServiceIcon.tsx`
3. Add pricing to `theme/voltage-premium.ts`
4. Create service-specific UI in details stage

### Platform-Specific Code
```typescript
// Use Platform.OS checks
import { Platform } from 'react-native'

if (Platform.OS === 'web') {
  // Web-specific code
} else {
  // Native code
}
```

### Map Issues (Common)
- Web: Use fallback grid (no react-native-maps)
- Use `PlatformMapView` components (auto-resolves)
- Dark map style defined in `DARK_MAP_STYLE`

## Critical Constraints

### DO NOT:
- ❌ Use emojis as primary icons (use ServiceIcon component)
- ❌ Reference "taxi" or ride-sharing terms (we're emergency services)
- ❌ Hardcode prices (use `PRICES` from theme)
- ❌ Skip M-Pesa integration (critical for Kenya market)
- ❌ Ignore B2B features (40% of revenue strategy)

### ALWAYS:
- ✅ Use Voltage Premium design tokens
- ✅ Test on all platforms (web, iOS, Android)
- ✅ Follow the service lifecycle state machine
- ✅ Maintain 90%+ test coverage
- ✅ Consider both Dubai and Nairobi markets
- ✅ Use pictogram icons, not emojis
- ✅ Keep mobile-first, map-centric UI

## MANDATORY: Build & Test Verification (CRITICAL)

> **This section is NON-NEGOTIABLE.** All agents working on this codebase MUST follow these rules.

### After EVERY New Feature or Code Addition:

#### 1. Run Build Command
```bash
npm run build
```
This builds the Cloud Functions and verifies TypeScript compilation.

**If build fails:** Fix all errors BEFORE proceeding to tests.

#### 2. Run Tests
```bash
npm test
```
All existing tests must pass.

#### 3. Create Test File for New Feature
**RULE:** Every new service, type, or feature MUST have a corresponding `.test.ts` file in the `__tests__/` directory.

**Test File Location (MANDATORY):**
All test files MUST be placed in the centralized `__tests__/` folder with proper subdirectories:

| New File Created | Required Test File Location |
|------------------|----------------------------|
| `services/xxx.service.ts` | `__tests__/services/xxx.service.test.ts` |
| `types/xxx.ts` | `__tests__/types/xxx.test.ts` |
| `theme/xxx.ts` | `__tests__/theme/xxx.test.ts` |
| `utils/xxx.ts` | `__tests__/utils/xxx.test.ts` |
| `components/xxx.tsx` | `__tests__/components/xxx.test.tsx` |
| Provider/dashboard screens | `__tests__/provider/xxx.test.tsx` |

**Important Import Path Rule:**
When creating tests in `__tests__/<subfolder>/`, use `../../<folder>/` paths:
```typescript
// In __tests__/services/customer.service.test.ts
import { functionName } from '../../services/customer.service';

// Mock firebase config
jest.mock('../../config/firebase', () => ({ db: {} }));
```

#### 4. Minimum Test Coverage Requirements
- **Validation functions:** Test valid AND invalid inputs
- **Service functions:** Test happy path + error cases
- **UI components:** Test rendering + user interactions
- **Cloud Functions:** Test with mock data

### Test File Template
```typescript
// Example: __tests__/services/xxx.service.test.ts
import { functionName } from '../../services/xxx.service';

// Mock Firebase if needed
jest.mock('../../config/firebase', () => ({ db: {} }));

describe('xxx.service', () => {
  describe('functionName', () => {
    it('should handle valid input', () => {
      expect(functionName(validInput)).toBe(expectedOutput);
    });
    
    it('should handle invalid input', () => {
      expect(functionName(invalidInput)).toBe(errorOutput);
    });
  });
});
```

### Pre-Commit Checklist
Before notifying the user that a phase/feature is complete:
- [ ] `npm run build` passes
- [ ] `npm test` passes  
- [ ] New test file(s) created for new features
- [ ] Test count increased (check in terminal output)

### Commands Reference
```bash
npm run build           # Build Cloud Functions
npm run build:web       # Build web export
npm test                # Run all tests
npm test -- --watch     # Watch mode
npm run typecheck       # TypeScript check only
```

---

## Medical Compliance (Phase 3)

When working on ambulance/medical features:
- HIPAA compliance considerations (end-to-end encryption)
- Kenya health authority requirements
- UAE medical service licensing
- EMT/Paramedic certification verification
- Patient data privacy (separate from general user data)

## B2B Platform Features (Phase 2)

Corporate dashboard requirements:
- Fleet vehicle tracking (real-time)
- Service history & analytics
- Cost center allocation
- SLA monitoring
- White-label capability for insurance partners

## Quick Reference

### Start Dev Server
```bash
npx expo start
# Then: w for web, i for iOS, a for Android
```

### Run Tests
```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

### Key Files to Remember
- Design System: `theme/voltage-premium.ts`
- Business Plan: `docs/Res-q Bizplan Antigravity.txt`
- Roadmap: `docs/ROADMAP_TO_PRODUCTION.md`
- Costs: `docs/PHASE1_COST_ACCOUNTING.md`

### Contact for Decisions
- **Technical:** Brian Njoroge (CTO)
- **Business:** Joe Mwirigi (CEO)
- **Security:** Kephas Kahuki

## Version History
- v1.0 - Initial skill creation (Jan 2026)
- Theme updated: Yellow → Orange (#FFA500)
- Added pictogram icons system
- Enhanced auth flow (register.tsx added)

---

**Remember:** ResQ is NOT a taxi app. We're specialized emergency response with medical compliance, complex asset management, and B2B corporate focus. This specialization is our competitive moat against larger generalist platforms.
