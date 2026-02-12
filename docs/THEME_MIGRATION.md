# Theme Migration Guide

## voltage-premium.ts v2.0

This guide helps migrate components from the old theme tokens to the new semantic token system.

---

## Quick Reference

### Background Colors

| Old Token | New Token |
|-----------|-----------|
| `colors.charcoal[900]` | `colors.background.primary` |
| `colors.charcoal[800]` | `colors.background.secondary` |
| `colors.charcoal[700]` | `colors.background.tertiary` |
| `colors.charcoal[600]` | `colors.background.border` |

### Text Colors

| Old Token | New Token |
|-----------|-----------|
| `colors.text.primary` | `colors.text.primary` ✅ |
| `colors.text.secondary` | `colors.text.secondary` ✅ |
| `colors.text.muted` | `colors.text.tertiary` |
| `colors.text.onVoltage` | `colors.text.onBrand` |

### Interactive States

| Old Token | New Token |
|-----------|-----------|
| `colors.voltage` | `colors.interactive.default` |
| `colors.voltageBright` | `colors.interactive.hover` |
| `colors.voltageDeep` | `colors.interactive.pressed` |
| `colors.voltageGlow` | `colors.interactive.focus` |

### Status Colors

| Old Token | New Token |
|-----------|-----------|
| `colors.emergency` | `colors.status.error` |
| `colors.success` | `colors.status.success` |
| `colors.warning` | `colors.status.warning` |
| `colors.info` | `colors.status.info` |

### Service Colors

| Old Token | New Token |
|-----------|-----------|
| `colors.serviceTowing` | `colors.service.towing` |
| `colors.serviceTire` | `colors.service.tire` |
| `colors.serviceBattery` | `colors.service.battery` |
| `colors.serviceFuel` | `colors.service.fuel` |
| `colors.serviceDiagnostics` | `colors.service.diagnostic` |
| `colors.serviceAmbulance` | `colors.service.medical` |

---

## Component Token Usage

### Buttons

```tsx
// OLD
import { colors, shadows, borderRadius, spacing } from '../theme/voltage-premium';

<Button style={{
  backgroundColor: colors.voltage,
  borderRadius: borderRadius.lg,
  ...shadows.button,
}} />

// NEW
import { button, componentStyles } from '../theme/voltage-premium';

// Option 1: Use component token
<Button style={{
  backgroundColor: button.primary.background,
  color: button.primary.text,
}} />

// Option 2: Use componentStyles helper
<Button style={componentStyles.button.primary} />
```

### Inputs

```tsx
// OLD
backgroundColor: colors.charcoal[700],
borderColor: colors.charcoal[600],
color: colors.text.primary,

// NEW
import { input, componentStyles } from '../theme/voltage-premium';

// Option 1: Use token
backgroundColor: input.background,
borderColor: input.border,
color: input.text,

// Option 2: Use componentStyles helper
<TextInput style={componentStyles.input.default} />
```

### Cards

```tsx
// OLD
backgroundColor: colors.charcoal[800],
borderColor: colors.charcoal[600],

// NEW
import { card, componentStyles } from '../theme/voltage-premium';

backgroundColor: card.background,
borderColor: card.border,

// Or use helper
<View style={componentStyles.card.standard} />
```

---

## Animation Tokens

```tsx
// OLD
duration: 300,
easing: 'ease-out',

// NEW
import { animation } from '../theme/voltage-premium';

duration: animation.duration.normal,  // 300ms
easing: animation.easing.primary,     // cubic-bezier(0.4, 0, 0.2, 1)
```

---

## Backward Compatibility

**All legacy tokens are preserved.** You can migrate incrementally:

```tsx
// These still work:
colors.voltage           // '#FFA500'
colors.charcoal[800]     // '#1A1A1A'
colors.text.primary      // '#FFFFFF'
colors.emergency         // '#FF3D3D'
voltageColors.primary    // '#FFA500'
```

---

## TypeScript Types

Import types for type-safe theme usage:

```tsx
import type {
  Theme,
  ColorToken,
  ButtonVariants,
  InputToken,
  CardToken,
  ShadowToken,
  SpacingScale,
  FontSizeScale,
} from '../theme/voltage-premium';
```

---

## Files to Update (Priority Order)

1. `components/EmergencySOS.tsx` - Replace hardcoded colors
2. `components/ui/Button.tsx` - Use button tokens
3. `components/maps/TrackingMap.native.tsx` - Use background tokens
4. `app/(customer)/index.tsx` - Use theme throughout

---

*Migration Guide for Phase 1.1 Theme Overhaul*
