# ResQ Kenya - Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** ResQ Kenya  
**Generated:** 2026-01-30  
**Category:** Emergency Response Platform (Roadside + Medical)  
**Markets:** Kenya (Mass Market) + Dubai (Premium)  
**Platform:** React Native (iOS + Android + Web)

---

## 🎨 Brand Identity

| Element | Value |
|---------|-------|
| **Primary Brand Color** | Voltage Orange `#FFA500` |
| **Logo** | "RESQ" with orange-boxed "Q" |
| **Theme** | Dark mode ONLY (no light mode) |
| **Aesthetic** | Premium, trustworthy, energetic |
| **Use Context** | Emergency situations, outdoor sunlight |

---

## Color Palette

### Core Brand Colors

| Role | Hex | RGB | CSS Variable | Usage |
|------|-----|-----|--------------|-------|
| **Voltage** | `#FFA500` | 255, 165, 0 | `--color-voltage` | Primary brand, CTAs, highlights |
| **Voltage Bright** | `#FFB733` | 255, 183, 51 | `--color-voltage-bright` | Hover states, glow effects |
| **Voltage Deep** | `#E69500` | 230, 149, 0 | `--color-voltage-deep` | Pressed states, shadows |
| **Voltage Glow** | `rgba(255,165,0,0.4)` | - | `--color-voltage-glow` | Ambient glow, focus rings |

### Background System (Layered Depth)

| Role | Hex | CSS Variable | Layer Usage |
|------|-----|--------------|-------------|
| **Background** | `#0F0F0F` | `--color-bg-900` | Primary app background |
| **Surface** | `#1A1A1A` | `--color-bg-800` | Cards, UI containers |
| **Elevated** | `#252525` | `--color-bg-700` | Modals, overlays |
| **Border** | `#2E2E2E` | `--color-bg-600` | Dividers, borders |

### Text Colors

| Role | Hex | CSS Variable | Contrast Ratio | Usage |
|------|-----|--------------|----------------|-------|
| **Primary** | `#FFFFFF` | `--color-text-primary` | 21:1 | Headings, labels |
| **Secondary** | `#A0A0A0` | `--color-text-secondary` | 7.5:1 | Descriptions |
| **Muted** | `#6B6B6B` | `--color-text-muted` | 4.6:1 | Hints, timestamps |
| **On Voltage** | `#0F0F0F` | `--color-text-on-voltage` | 8.5:1 | Text on orange |

### Status Colors (WCAG Compliant)

| Status | Hex | Glow | CSS Variable | Usage |
|--------|-----|------|--------------|-------|
| **Emergency** | `#FF3D3D` | `rgba(255,61,61,0.2)` | `--color-emergency` | SOS, critical ONLY |
| **Success** | `#00E676` | `rgba(0,230,118,0.2)` | `--color-success` | Completed, verified |
| **Warning** | `#FF9800` | `rgba(255,152,0,0.2)` | `--color-warning` | Alerts, cautions |
| **Info** | `#29B6F6` | `rgba(41,182,246,0.2)` | `--color-info` | GPS, tracking |
| **Medical** | `#DC143C` | `rgba(220,20,60,0.25)` | `--color-medical` | Ambulance services |

### Service Category Colors

| Service | Hex | Icon |
|---------|-----|------|
| Towing | `#FFA500` (Voltage) | truck |
| Tire Repair | `#9C27B0` | circle-dot |
| Battery | `#FFA500` (Voltage) | zap |
| Fuel | `#4CAF50` | droplet |
| Diagnostics | `#2196F3` | activity |
| Ambulance | `#DC143C` | heart-pulse |

---

## Typography

### Font Stack

```css
/* Primary Font - Clean, readable under stress */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace - For codes, numbers */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Type Scale (Mobile-First)

| Token | Mobile Size | Desktop Size | Weight | Line Height | Usage |
|-------|-------------|--------------|--------|-------------|-------|
| `hero` | 40px | 64px | 800 | 1.1 | Hero headlines |
| `section` | 28px | 48px | 700 | 1.15 | Section titles |
| `subsection` | 20px | 32px | 600 | 1.2 | Card titles |
| `body-lg` | 18px | 20px | 400 | 1.45 | Primary content |
| `body` | 16px | 18px | 400 | 1.5 | Body text |
| `body-sm` | 14px | 16px | 400 | 1.45 | Secondary text |
| `caption` | 12px | 14px | 500 | 1.35 | Labels, hints |
| `button` | 16px | 18px | 600 | 1.25 | Button text |

### Emergency Typography Rules

- **Minimum body size:** 16px (never smaller)
- **Price/ETA display:** 28px+ bold for critical info
- **Button text:** 16px minimum, 600 weight
- **Emergency labels:** ALL CAPS, 700 weight

---

## Spacing System (8-Point Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0.5` | 4px | Tight inline gaps |
| `--space-1` | 8px | Icon gaps, inline |
| `--space-2` | 16px | Standard padding |
| `--space-3` | 24px | Card padding |
| `--space-4` | 32px | Section gaps |
| `--space-6` | 48px | Section breaks |
| `--space-8` | 64px | Major sections |
| `--space-12` | 96px | Hero padding |

### Semantic Shortcuts

```javascript
const spacing = {
  xs: 4,    // Tight elements
  sm: 8,    // Icon gaps
  md: 16,   // Standard
  lg: 24,   // Cards
  xl: 32,   // Sections
  '2xl': 48,
  '3xl': 64,
};
```

---

## Touch Targets & Accessibility

### Minimum Touch Sizes

| Element | Minimum Size | Notes |
|---------|-------------|-------|
| **Buttons** | 48×48px | 44pt iOS minimum |
| **Icon Buttons** | 44×44px | With hit area padding |
| **List Items** | 48px height | Entire row tappable |
| **Links** | 44×44px area | Adequate tap area |
| **SOS Button** | 80×80px | Extra large for emergency |

### Spacing Between Targets

- Minimum 8px between adjacent touch targets
- Recommended 16px for frequently-used elements

### Accessibility Requirements

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| Color Contrast | WCAG AA (4.5:1) | All text on backgrounds |
| Focus Visible | 3px outline | `#FFA500` focus ring |
| Screen Reader | VoiceOver + TalkBack | `accessibilityLabel` on all |
| Reduced Motion | Respect preference | Check `prefers-reduced-motion` |
| Touch Targets | ≥44pt | Per iOS HIG |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small chips |
| `--radius-md` | 8px | Inputs, small buttons |
| `--radius-lg` | 12px | Standard buttons |
| `--radius-xl` | 16px | Cards |
| `--radius-2xl` | 24px | Large cards, panels |
| `--radius-full` | 9999px | Circles, pills |

---

## Shadows (Dark Theme Optimized)

### Elevation System

```javascript
const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 12,
  },
  button: {
    shadowColor: '#FFA500', // Voltage glow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  emergencyGlow: {
    shadowColor: '#FF3D3D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
};
```

---

## Animation Principles

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Instant | 150ms | ease-out | Micro-interactions |
| Fast | 250ms | ease-out | Buttons, toggles |
| Standard | 350ms | ease-in-out | Transitions |
| Slow | 500ms | ease-in-out | Page transitions |

### Easing Curves

```css
--ease-primary: cubic-bezier(0.4, 0, 0.2, 1);
--ease-emphasis: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-smooth: cubic-bezier(0.4, 0, 0.6, 1);
```

### Performance Requirements

- **Target FPS:** 60fps always
- **Use native driver:** `useNativeDriver: true`
- **Avoid:** Animating layout properties (width, height)
- **Prefer:** Transform, opacity animations

### Motion Patterns

| Pattern | Usage | Duration |
|---------|-------|----------|
| Pulse | Loading, SOS button | 2000ms loop |
| Scale | Button press feedback | 150ms |
| Fade | Page transitions | 250ms |
| Slide | Bottom sheets | 350ms |

---

## Component Specifications

### Primary Button (Voltage)

```typescript
const primaryButton = {
  backgroundColor: '#FFA500',
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 28,
  ...shadows.button,
  text: {
    color: '#0F0F0F',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    backgroundColor: '#E69500',
    transform: [{ scale: 0.98 }],
  },
};
```

### Secondary Button (Ghost)

```typescript
const secondaryButton = {
  backgroundColor: 'transparent',
  borderWidth: 2,
  borderColor: '#FFA500',
  borderRadius: 12,
  paddingVertical: 12,
  paddingHorizontal: 26,
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
};
```

### Emergency Button (SOS)

```typescript
const emergencyButton = {
  backgroundColor: '#FF3D3D',
  borderRadius: 12,
  paddingVertical: 16,
  paddingHorizontal: 32,
  minWidth: 80,
  minHeight: 80, // Large touch target
  ...shadows.emergencyGlow,
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
};
```

### Cards

```typescript
const card = {
  standard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    padding: 24,
    ...shadows.card,
  },
  elevated: {
    backgroundColor: '#252525',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.2)',
    padding: 24,
    ...shadows.cardElevated,
  },
  service: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    borderLeftWidth: 3,
    borderLeftColor: '#FFA500',
    padding: 16,
  },
};
```

### Input Fields

```typescript
const input = {
  default: {
    backgroundColor: '#252525',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  focused: {
    borderColor: '#FFA500',
    shadowColor: 'rgba(255,165,0,0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
};
```

---

## Iconography

### Icon Library

- **Primary:** Lucide React Native (consistent stroke)
- **Fallback:** Heroicons (solid variants)
- **Brand icons:** Simple Icons

### Icon Sizing

| Context | Size | Stroke |
|---------|------|--------|
| Navigation | 24px | 2px |
| Button inline | 20px | 2px |
| Service cards | 28px | 2px |
| Large feature | 32px | 2px |

### Rules

- ❌ **NO emojis** as functional icons
- ✅ Use consistent stroke width (2px)
- ✅ Match icon color to context (status, brand)

---

## Map Styling (Dark Theme)

```javascript
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0F0F0F' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6B6B6B' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0F0F0F' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2E2E2E' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3D3D3D' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A0A0A' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
```

---

## Outdoor/Sunlight Considerations

### High Visibility Requirements

| Element | Requirement |
|---------|-------------|
| Primary CTA | Orange on dark with glow |
| Emergency button | Red with white text, pulsing |
| Status indicators | High saturation colors |
| Text | High contrast (7:1+ for critical) |

### Screen Brightness

- Support auto-brightness awareness
- Critical buttons remain visible at max brightness
- Avoid pure white backgrounds (harsh glare)

---

## Anti-Patterns (DO NOT USE)

| ❌ Forbidden | ✅ Instead |
|--------------|-----------|
| Light color schemes | Dark theme only |
| Touch targets <44pt | Minimum 44pt (48pt preferred) |
| Low contrast combinations | WCAG AA minimum |
| Playful/casual aesthetics | Premium, trustworthy |
| Emojis as icons | SVG icons (Lucide) |
| Instant state changes | Smooth transitions (150-300ms) |
| Layout-shifting hovers | Transform only (scale, opacity) |
| Hardcoded colors | Theme tokens |
| Missing accessibility labels | Full ARIA coverage |

---

## File Structure

```
design-system/
├── MASTER.md              ← This file (Source of Truth)
├── pages/                 ← Page-specific overrides
│   ├── dashboard.md
│   ├── tracking.md
│   └── emergency.md
└── tokens/
    └── exported.json      ← Token export for tools
```

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG: Lucide)
- [ ] All interactive elements have `accessibilityLabel`
- [ ] All buttons have `cursor-pointer` (web)
- [ ] Touch targets ≥44pt
- [ ] Uses theme tokens (no hardcoded colors)
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Text contrast 4.5:1 minimum (7:1 for critical)
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] Loading states for all async operations
- [ ] Error states with retry actions
- [ ] Works in bright sunlight (high contrast)

---

*Design System for ResQ Kenya Emergency Platform*  
*Last Updated: January 30, 2026*
