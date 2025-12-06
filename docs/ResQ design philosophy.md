# ⚡ RESQ VISUAL IDENTITY SYSTEM

## **Complete Aesthetic & Design Language Documentation**

---

# 🎨 **DESIGN PHILOSOPHY**

## **Core Aesthetic: "Voltage Premium"**

**Design Intention:**  
ResQ is the visual embodiment of **instant emergency response energy**—fast, powerful, reliable, and sophisticated. The aesthetic balances **high-performance urgency** with **calm professionalism**, creating an interface that feels like a premium emergency service platform, not a chaotic crisis app.

**Emotional Arc:**  
Panic → Confidence → Relief → Empowerment

**Design Principles:**

1. **Clarity Under Pressure** — Every element is readable in crisis
2. **Energy Through Motion** — Animation conveys speed and power
3. **Trust Through Restraint** — Premium comes from what you don't show
4. **Voltage as Metaphor** — Electricity = instant energy = rapid response
5. **Dark Sophistication** — Modern, sleek, professional

---

# 🎨 **COLOR SYSTEM**

## **Primary Palette**

### **Base: Deep Charcoal Foundation**

```
Primary Black: #0F0F0F (rich, not pure black)
Secondary Black: #1A1A1A (UI backgrounds)
Elevated Surface: #252525 (cards, modals)
Divider/Border: #2E2E2E (subtle separation)
```

**Usage:**  
Main app background, navigation bars, content containers. Creates depth through layering (darker = background, lighter = foreground).

---

### **Energy Accent: Electric Voltage**

```
Primary Voltage: #FFD60A (electric yellow, high energy)
Voltage Bright: #FFF455 (highlights, glow effects)
Voltage Deep: #E6B800 (pressed states, shadows)
Voltage Glow: rgba(255, 214, 10, 0.3) (ambient light effects)
```

**Usage:**  
Primary CTAs, active states, loading indicators, success moments, brand presence, navigation highlights. Should feel like electricity coursing through the interface—representing instant response and powerful assistance.

---

### **Trust Layer: Premium Neutrals**

```
Pure White: #FFFFFF (headlines, key text)
Soft White: #F5F5F5 (secondary text, backgrounds)
Medium Gray: #A0A0A0 (supporting text, labels)
Subtle Gray: #6B6B6B (disabled states, placeholders)
```

**Usage:**  
Typography hierarchy, readability optimization, balancing the dark base with clarity.

---

### **Semantic Colors**

**Success/Confirmation:**

```
Success Green: #00E676 (service complete, verification)
Success Glow: rgba(0, 230, 118, 0.2)
```

**Warning/Attention:**

```
Warning Orange: #FF9800 (vehicle issues, alerts)
Warning Glow: rgba(255, 152, 0, 0.2)
```

**Critical Emergency:**

```
Emergency Red: #FF3D3D (SOS button, critical alerts only)
Emergency Glow: rgba(255, 61, 61, 0.2)
```

**Info/Navigation:**

```
Info Blue: #29B6F6 (GPS, tracking, location markers)
Info Glow: rgba(41, 182, 246, 0.2)
```

**Medical Emergency:**

```
Medical Red: #DC143C (ambulance services specifically)
Medical Glow: rgba(220, 20, 60, 0.25)
```

---

### **Gradient System**

**Primary Voltage Gradient:**

```
Linear: #FFD60A → #FFA800 (45deg)
```

Usage: Primary CTAs, hero sections, loading states, premium features

**Dark Depth Gradient:**

```
Linear: #0F0F0F → #1A1A1A (180deg)
```

Usage: Hero backgrounds, section dividers

**Glow Gradient (Overlays):**

```
Radial: rgba(255, 214, 10, 0.15) → transparent
```

Usage: Button hover states, card highlights, energy effects

---

# 🔤 **TYPOGRAPHY SYSTEM**

## **Font Family Selection**

### **Primary Typeface: Inter**

```
Headings: Inter Bold (700-800)
Body: Inter Regular (400)
Emphasis: Inter SemiBold (600)
UI Elements: Inter Medium (500)
```

**Why Inter:**

- Exceptional readability at all sizes
- Modern, clean, professional
- Wide range of weights for hierarchy
- Optimized for digital screens
- Open-source, easily accessible

**Alternative Option: Satoshi**  
(If you want slightly more personality while maintaining professionalism)

---

## **Type Scale & Hierarchy**

### **Mobile (375px base)**

```
Hero Headline: 40px / 44px line-height / Bold (800)
Section Headline: 28px / 32px / Bold (700)
Subsection: 20px / 24px / SemiBold (600)
Body Large: 18px / 26px / Regular (400)
Body Default: 16px / 24px / Regular (400)
Body Small: 14px / 20px / Regular (400)
Caption: 12px / 16px / Medium (500)
Button Text: 16px / 20px / SemiBold (600)
```

### **Desktop (1440px base)**

```
Hero Headline: 64px / 72px / Bold (800)
Section Headline: 48px / 56px / Bold (700)
Subsection: 32px / 40px / SemiBold (600)
Body Large: 20px / 30px / Regular (400)
Body Default: 18px / 28px / Regular (400)
Body Small: 16px / 24px / Regular (400)
Caption: 14px / 20px / Medium (500)
Button Text: 18px / 24px / SemiBold (600)
```

---

## **Typography Treatment**

**Voltage Text Effect (for key headlines):**

```css
color: #FFD60A;
text-shadow: 
  0 0 10px rgba(255, 214, 10, 0.5),
  0 0 20px rgba(255, 214, 10, 0.3),
  0 0 30px rgba(255, 214, 10, 0.1);
```

**High-Contrast Body Text:**

```css
color: #FFFFFF;
letter-spacing: -0.01em; /* Slightly tighter for modern feel */
font-weight: 400;
```

**Supporting/Secondary Text:**

```css
color: #A0A0A0;
letter-spacing: 0;
font-weight: 400;
```

---

# 🎨 **VISUAL ELEMENTS & PATTERNS**

## **Cards & Containers**

### **Standard Card**
```
Background: #1A1A1A
Border: 1px solid #2E2E2E
Border Radius: 16px
Padding: 24px
Shadow: 0 4px 24px rgba(0, 0, 0, 0.4)
```

### **Elevated Card (Hover/Active)**
```
Background: #252525
Border: 1px solid #FFD60A33 (voltage at 20% opacity)
Box Shadow: 
  0 8px 32px rgba(0, 0, 0, 0.5),
  0 0 0 1px rgba(255, 214, 10, 0.1) inset (inner glow)
Transform: translateY(-2px)
Transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

### **Service Category Card**
```
Background: Linear gradient #1A1A1A → #252525
Border: 1px solid #2E2E2E
Border-left: 3px solid #FFD60A (voltage accent)
Padding: 20px
Border Radius: 12px
```

---

## **Buttons & Interactive Elements**

### **Primary CTA (Voltage Button)**
```
Background: Linear gradient #FFD60A → #FFA800
Color: #0F0F0F (dark text for contrast)
Font: Inter SemiBold 16px
Padding: 16px 32px
Border Radius: 12px
Border: none

Hover State:
  Transform: scale(1.02)
  Box Shadow: 
    0 8px 24px rgba(255, 214, 10, 0.4),
    0 0 40px rgba(255, 214, 10, 0.3)
  
Active/Pressed:
  Transform: scale(0.98)
  Background: #E6B800

Transition: all 0.2s ease
```

### **Emergency SOS Button (Critical Use Only)**
```
Background: Linear gradient #FF3D3D → #FF6259
Color: #FFFFFF (white text)
Font: Inter Bold 16px
Padding: 16px 32px
Border Radius: 12px
Border: none

Icon: AlertCircle, 20px, animated pulse

Hover State:
  Transform: scale(1.02)
  Box Shadow: 
    0 8px 24px rgba(255, 61, 61, 0.5),
    0 0 40px rgba(255, 61, 61, 0.4)

Active/Pressed:
  Transform: scale(0.98)
  Background: #E02020

Animation: Subtle pulse on idle
Usage: ONLY for true emergency/SOS scenarios
```

### **Secondary Button (Ghost)**
```
Background: transparent
Color: #FFFFFF
Border: 2px solid #FFD60A
Padding: 14px 30px
Border Radius: 12px

Hover:
  Background: rgba(255, 214, 10, 0.1)
  Border-color: #FFF455
  Box Shadow: 0 0 20px rgba(255, 214, 10, 0.2) inset
```

### **Tertiary/Text Button**
```
Background: transparent
Color: #FFD60A
Font: Inter SemiBold 16px
Padding: 8px 16px
Border: none

Hover:
  Color: #FFF455
  Text-decoration: underline
```

### **Service Selection Button**
```
Background: #252525
Color: #FFFFFF
Border: 1px solid #2E2E2E
Padding: 20px
Border Radius: 12px
Icon: 32px (service-specific color)

Selected State:
  Border: 2px solid #FFD60A
  Background: rgba(255, 214, 10, 0.05)
  Transform: scale(1.02)
  Box Shadow: 0 0 20px rgba(255, 214, 10, 0.2)
```

---

## **Input Fields**

### **Text Input (Default)**
```
Background: #252525
Border: 1px solid #2E2E2E
Border Radius: 8px
Padding: 14px 16px
Color: #FFFFFF
Placeholder Color: #6B6B6B
Font: Inter Regular 16px

Focus State:
  Border: 1px solid #FFD60A
  Box Shadow: 0 0 0 3px rgba(255, 214, 10, 0.1)
  Outline: none
```

### **Dropdown/Select**
```
Same as text input +
Icon: Chevron down (white, 16px)
Dropdown Menu:
  Background: #1A1A1A
  Border: 1px solid #2E2E2E
  Shadow: 0 8px 24px rgba(0, 0, 0, 0.6)
  Option Hover: background #252525, voltage accent
```

---

## **Icons & Iconography**

### **Icon System: Lucide React**
```
Size Scale:
  Small: 16px
  Medium: 20px
  Large: 24px
  XL: 32px
  Hero: 48px+

Colors:
  Primary: #FFD60A (voltage yellow - main brand color)
  Secondary: #FFFFFF (white)
  Tertiary: #A0A0A0 (gray)
  Success: #00E676 (green)
  Warning: #FF9800 (orange)
  Emergency: #FF3D3D (red - critical only)

Treatment:
  Stroke Width: 2px (consistent across all icons)
  Style: Rounded corners (consistent with Lucide's design)
```

**Key Icons:**
- Zap (energy/speed/ResQ brand)
- Truck (towing)
- Wrench (repairs)
- Battery (jumpstart)
- Fuel (fuel delivery)
- Activity (diagnostics)
- Heart (medical/ambulance)
- MapPin (location)
- Phone (contact)
- Shield (verification/safety)
- AlertCircle (emergency - red only)
- Clock (time/arrival)
- Users (community)
- Star (ratings)
- MessageCircle (support)

---

## **Service Category Colors**

```
Towing: #FF9800 (Orange)
Tire Repair: #9C27B0 (Purple)
Battery Jumpstart: #FFD60A (Voltage Yellow - primary brand)
Fuel Delivery: #4CAF50 (Green)
Diagnostics: #2196F3 (Blue)
Ambulance: #DC143C (Medical Red)

Usage: Service icons, category badges, status indicators
Always pair with dark backgrounds for maximum visibility
```

---

## **Spacing & Layout System**

### **8-Point Grid System**
```
Base Unit: 8px

Spacing Scale:
  4px   (0.5x) — Tight elements
  8px   (1x)   — Default small spacing
  16px  (2x)   — Default medium spacing
  24px  (3x)   — Section padding
  32px  (4x)   — Large spacing
  48px  (6x)   — Section breaks
  64px  (8x)   — Major sections
  96px  (12x)  — Hero spacing
```

### **Container Widths**
```
Mobile: 100% (16px side padding)
Tablet: 720px max-width
Desktop: 1200px max-width
Wide: 1440px max-width
```

### **Section Padding**
```
Mobile: 64px vertical / 16px horizontal
Desktop: 120px vertical / 48px horizontal
```

---

# 🎭 **MOTION & ANIMATION**

## **Animation Philosophy**

**Speed = Trust**  
Animations should feel instant and responsive, never sluggish. Every motion reinforces the brand promise of rapid emergency response.

---

## **Timing Functions**

```css
/* Primary Easing (most interactions) */
cubic-bezier(0.4, 0, 0.2, 1) — "ease-out"

/* Emphasis Easing (CTAs, important actions) */
cubic-bezier(0.34, 1.56, 0.64, 1) — "back-out" (slight bounce)

/* Smooth Easing (long transitions) */
cubic-bezier(0.4, 0, 0.6, 1) — "smooth"
```

---

## **Duration Scale**
```
Instant: 150ms   (button presses, toggles)
Fast: 250ms      (hover states, tooltips)
Standard: 350ms  (page transitions, modals)
Slow: 500ms      (large animations, loading states)
```

---

## **Signature Animations**

### **"Voltage Pulse" (Active States)**

```css
@keyframes voltagePulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 214, 10, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 214, 10, 0.6),
                0 0 60px rgba(255, 214, 10, 0.3);
  }
}

animation: voltagePulse 2s ease-in-out infinite;
```

**Usage:** Primary action buttons, active service status, provider approaching notification

### **"Emergency Pulse" (Critical SOS Only)**

```css
@keyframes emergencyPulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 61, 61, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 61, 61, 0.7),
                0 0 60px rgba(255, 61, 61, 0.4);
  }
}

animation: emergencyPulse 1.5s ease-in-out infinite;
```

**Usage:** ONLY for SOS/emergency alert buttons and critical danger notifications

---

### **"Energy Sweep" (Success Moments)**

```css
@keyframes energySweep {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

background: linear-gradient(
  90deg,
  transparent,
  rgba(255, 214, 10, 0.3),
  transparent
);
background-size: 200% 100%;
animation: energySweep 1.5s ease;
```

**Usage:** Service confirmation, provider arrival, payment success

---

### **"Fade & Rise" (Page Transitions)**

```css
@keyframes fadeRise {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

animation: fadeRise 0.35s cubic-bezier(0.4, 0, 0.2, 1);
```

**Usage:** Section reveals, card entries, modal appearances

---

### **"Glow Intensify" (Hover States)**

```css
transition: all 0.25s ease;

/* Default State */
box-shadow: 0 0 0 rgba(255, 214, 10, 0);

/* Hover State */
box-shadow: 
  0 0 20px rgba(255, 214, 10, 0.4),
  0 0 40px rgba(255, 214, 10, 0.2),
  0 8px 24px rgba(0, 0, 0, 0.3);
```

**Usage:** Button hovers, card interactions, clickable elements

---

## **Micro-Interactions**

### **Button Press**
```
Scale: 1 → 0.98 (on press) → 1 (on release)
Duration: 150ms
Easing: ease-out
```

### **Toggle Switch**
```
Duration: 250ms
Movement: Slide + Color change (voltage yellow when active)
Easing: cubic-bezier(0.34, 1.56, 0.64, 1) (slight bounce)
```

### **Checkbox/Radio**
```
Duration: 200ms
Effect: Scale from center + voltage glow
Color: Gray → Voltage Yellow
```

### **Loading Spinner**
```
Style: Circular voltage arc (not full circle)
Rotation: Continuous 360deg
Duration: 1s linear infinite
Color: Voltage gradient (#FFD60A → #FFA800)
Stroke Width: 3px
```

---

# 🖼️ **IMAGERY & VISUAL STYLE**

## **Photography Direction**

### **Hero/Marketing Images:**
**Style:**
- Professional, well-lit scenarios
- Real emergency service situations
- Urban and highway environments
- Service vehicles with voltage-yellow branding
- High contrast, professional color grading

**Color Treatment:**
- Enhance yellows/golds (voltage brand color)
- Professional, trustworthy aesthetic
- Deep shadows (#0F0F0F blacks)
- Well-lit service providers and vehicles

**Examples:**
- Tow truck with voltage-yellow accents at night
- Service provider assisting customer (professional uniform)
- Emergency vehicle with distinctive branding
- Mechanic performing roadside repair with voltage-yellow equipment
- Professional service scenarios showing competence and care

---

### **UI Photography (Provider Profiles, Testimonials):**
**Style:**
- Clean, well-lit professional headshots
- Neutral or slightly dark backgrounds
- Natural expressions (confident, friendly, trustworthy)
- Providers in branded uniform with subtle voltage-yellow accents

**Treatment:**
- Circular crops (96px minimum)
- Subtle border: 2px solid #2E2E2E
- Verified badge overlay (small voltage-yellow checkmark)

---

## **Illustration Style**

### **Icon Illustrations:**
**When custom icons are needed:**
- Geometric, minimal line art
- 2px consistent stroke weight
- Voltage yellow primary color (#FFD60A)
- Can include subtle glow effects
- Avoid gradients in icons (flat colors only)

**Examples:**
- Tow truck icon (geometric, clean lines)
- Location pin with voltage accent
- Service tools with electric energy
- Vehicle outlines (minimal, recognizable)

---

### **Empty States & Placeholders:**
**Style:**
- Simple line illustrations (white or gray)
- Centered composition
- Voltage-yellow accent elements
- Friendly, reassuring aesthetic

**Messaging:**
- Warm, reassuring copy
- "No requests yet" → "Ready when you need us"
- "No history" → "Your journey starts here"

---

## **Map Styling**

### **GPS/Tracking Map Theme:**
```
Base Style: Dark (Mapbox Dark or Google Maps Night mode)

Customization:
  Roads: #2E2E2E
  Water: #0F0F0F
  Parks: #1A2B1A (very dark green)
  Buildings: #252525
  
Custom Markers:
  Customer Location: Voltage yellow pin with glow
  Provider Location: White vehicle icon on voltage yellow circle
  Route Line: Dashed voltage yellow, 3px width
  
Ambulance Route (Special Case):
  Route Line: Medical red dashed line
  Ambulance Marker: Red cross icon on red circle
```

---

# 🎨 **COMPONENT PATTERNS**

## **Navigation Bar**

### **Mobile Navigation:**
```
Height: 64px
Background: #0F0F0F (solid, or blur if overlaying content)
Border-bottom: 1px solid #2E2E2E
Padding: 12px 16px

Logo: 32px height, voltage yellow accent
Menu Icon: 24px, white, hamburger style

Active state: Voltage yellow underline or background pill
```

### **Desktop Navigation:**
```
Height: 80px
Background: #0F0F0F with backdrop blur
Position: Sticky top
Shadow on scroll: 0 4px 24px rgba(0, 0, 0, 0.6)

Navigation Links:
  Color: #FFFFFF
  Font: Inter Medium 16px
  Spacing: 32px between items
  Hover: Color changes to #FFD60A, underline appears
  Active: Voltage yellow with subtle glow
```

---

## **Hero Section (Landing Page)**

### **Layout:**
```
Height: 100vh (minus nav) or min 600px
Background: Radial gradient #0F0F0F → #1A1A1A
Overlay: Subtle noise texture (5% opacity)

Left Column (60%):
  Headline: 64px white + voltage yellow gradient on "ResQ"
  Tagline: 20px #A0A0A0 "The Uber for road and medical rescue"
  Service Grid: 6 service cards with category colors
  Primary CTA: Large voltage button (56px height) "Get Help Now"
  Stats Row: 3 stat cards, inline, voltage accents

Right Column (40%):
  Visual: Service vehicle mockup with voltage branding
  Treatment: Floating with subtle animation, voltage glow
```

---

## **Service Selection Cards**

### **Service Card Grid:**
```
Width: 100% (mobile) / 50% (tablet) / 33.33% (desktop)
Background: #1A1A1A
Border: 1px solid #2E2E2E
Border Radius: 16px
Padding: 24px
Hover: Lift + voltage glow effect

Icon Container:
  Size: 56px × 56px
  Background: Category-specific color (semi-transparent)
  Border: 2px solid category color
  Border Radius: 12px
  Icon: 28px white, centered

Service Name: 18px SemiBold white
Description: 14px Regular #A0A0A0
24/7 Badge: Small voltage pill badge
Spacing: 12px between elements

Selected State:
  Border: 2px solid #FFD60A
  Background: rgba(255, 214, 10, 0.05)
  Transform: scale(1.02)
  Voltage glow effect
```

---

## **Primary Action Button (Request Help)**

```
Size: Full width on mobile, fixed width desktop
Height: 56px (primary), 48px (secondary contexts)
Background: Linear gradient #FFD60A → #FFA800
Border Radius: 12px
Font: Inter SemiBold 18px
Text: "Request Help Now" / "Get Assistance"
Color: #0F0F0F (dark text on bright yellow)
Icon: Zap, 24px, dark, positioned left
Shadow: 0 8px 24px rgba(255, 214, 10, 0.3)

Hover:
  Transform: scale(1.02)
  Box Shadow intensifies with voltage glow
  
Active State (Service in Progress):
  Pulse animation (voltagePulse)
  Text changes to "Help is on the way..."
  Icon: animated pulse
  
Disabled:
  Opacity: 0.5
  No hover effects
  Cursor: not-allowed
```

---

## **Emergency SOS Component (Critical Use)**

```
Position: Fixed bottom-right (mobile), top-right (desktop)
Size: 64px × 64px circular button
Background: Solid #FF3D3D (no gradient for clarity)
Icon: AlertCircle, 32px, white
Border: 2px solid rgba(255, 255, 255, 0.3)
Shadow: 0 4px 16px rgba(255, 61, 61, 0.5)

Animation: Subtle emergencyPulse (slower, 2.5s)

Pressed State:
  Scale: 0.95
  Background: #E02020
  Trigger emergency protocol immediately

Usage Guidelines:
  - Always visible during active services
  - Hidden during normal browsing
  - Triggers immediate emergency contact + authorities
  - Confirmation modal: "Call Emergency Services?"
  - Never use for non-emergency actions
```

---

## **Feature Cards**

### **Standard Feature Card:**
```
Width: 100% (mobile) / 33.33% (desktop grid)
Background: #1A1A1A
Border: 1px solid #2E2E2E
Border Radius: 16px
Padding: 32px
Hover: Lift + voltage glow effect

Icon Container:
  Size: 48px × 48px
  Background: Linear gradient voltage
  Border Radius: 12px
  Icon: 24px white, centered

Title: 20px SemiBold white
Description: 16px Regular #A0A0A0
Spacing: 16px between elements
```

---

## **Testimonial/Review Cards**

### **Review Card:**
```
Background: #1A1A1A
Border: 1px solid #2E2E2E
Border Radius: 16px
Padding: 24px

Star Rating:
  Size: 16px each
  Color: #FFD60A (voltage yellow)
  Filled stars: solid voltage
  Empty stars: #2E2E2E

Quote Text:
  Font: 16px Regular
  Color: #FFFFFF
  Line Height: 1.6
  Italic optional

Author:
  Name: 16px SemiBold #FFFFFF
  Role: 14px Regular #A0A0A0
  Avatar: 48px circle, 2px border #2E2E2E
```

---

## **Modal/Dialog**

### **Modal Structure:**
```
Backdrop: rgba(0, 0, 0, 0.8) with blur
Container:
  Background: #1A1A1A
  Border: 1px solid #2E2E2E
  Border Radius: 16px
  Max Width: 480px
  Padding: 32px
  Shadow: 0 24px 80px rgba(0, 0, 0, 0.9)

Header:
  Close button: Top right, 24px, white
  Title: 24px SemiBold white
  
Body:
  Padding: 24px 0
  Text: 16px #A0A0A0
  
Footer:
  Button layout: Horizontal, gap 16px
  Primary voltage + Secondary ghost buttons
```

---

## **Form Elements**

### **Consistent Form Styling:**
```
Labels:
  Font: Inter Medium 14px
  Color: #FFFFFF
  Margin-bottom: 8px

Input Fields:
  Height: 48px
  Background: #252525
  Border: 1px solid #2E2E2E
  Border Radius: 8px
  Padding: 0 16px
  Font: Inter Regular 16px
  Color: #FFFFFF
  
  Focus:
    Border: #FFD60A
    Glow: 0 0 0 3px rgba(255, 214, 10, 0.1)
  
  Error:
    Border: #FF3D3D
    Helper text: 14px #FF3D3D below

Textarea:
  Same as input, but min-height 120px
  Padding: 12px 16px
  Resize: vertical

Checkbox/Radio:
  Size: 20px
  Border: 2px solid #2E2E2E
  Checked: Background #FFD60A, dark checkmark (#0F0F0F)
  Transition: 200ms ease
```

---

## **Progress Indicators**

### **Loading Bar:**
```
Height: 4px
Background: #2E2E2E
Progress Fill: Linear gradient #FFD60A → #FFA800
Border Radius: 2px
Animation: Indeterminate slide (for unknown duration)
```

### **Circular Progress:**
```
Size: 40px
Stroke Width: 3px
Background Circle: #2E2E2E
Progress Arc: Voltage gradient
Rotation: Smooth 360deg
```

### **Step Progress (Multi-step Forms):**
```
Steps: Horizontal dots or numbers
Inactive: #2E2E2E circle
Active: #FFD60A circle with glow
Complete: #00E676 circle with checkmark
Connector Line: 2px solid, follows same color logic
```

---

# 📐 **LAYOUT GRID SYSTEM**

## **Responsive Breakpoints**
```
Mobile: 320px - 767px (1 column)
Tablet: 768px - 1023px (2 columns)
Desktop: 1024px - 1439px (3-4 columns)
Wide: 1440px+ (4-6 columns)
```

## **Grid Structure**

### **12-Column Grid:**
```
Container Max Width: 1200px
Gutter: 24px (desktop), 16px (mobile)
Column Width: Fluid (calc based on container)

Margins:
  Mobile: 16px
  Tablet: 32px
  Desktop: 48px
```

### **Content Width Guidelines:**
```
Body Copy: Max 720px (optimal readability)
Headlines: Max 900px
Full-Width Sections: 100% container
Cards: Min 280px, Max 400px per card
```

---

# 🎯 **ACCESSIBILITY STANDARDS**

## **Color Contrast Ratios (WCAG AA Minimum)**
```
✅ White (#FFFFFF) on Dark (#0F0F0F): 20.35:1 (Excellent)
✅ Voltage (#FFD60A) on Dark (#0F0F0F): 12.8:1 (Excellent)
✅ Gray (#A0A0A0) on Dark (#0F0F0F): 7.2:1 (Good)
✅ Dark text (#0F0F0F) on Voltage (#FFD60A): 12.8:1 (Excellent)
⚠️ Medium Gray (#6B6B6B) on Dark: 4.5:1 (Minimum, use sparingly)
```

## **Interactive Element Requirements**
```
Touch Targets: Minimum 44px × 44px (iOS/Android standard)
Focus Indicators: 2px solid #FFD60A outline, 4px offset
Keyboard Navigation: Visible focus states on all interactive elements
Screen Reader: Proper ARIA labels, semantic HTML
```

## **Motion & Animation Accessibility**
```
Respect prefers-reduced-motion:
  Disable: Pulse effects, continuous animations
  Keep: Instant transitions, essential feedback
  Replace: Fade-in instead of slide, reduce duration to 150ms
```

---

# 🎨 **DARK MODE ONLY (No Light Mode)**

**Design Decision:**  
ResQ operates exclusively in dark mode. This is intentional:

**Reasons:**
1. **Brand Identity** — Dark = premium, voltage = energy
2. **Night Use** — Most emergencies happen evening/night
3. **Driver Safety** — Reduces glare when used in vehicles
4. **Focus** — Dark UI puts emphasis on content, not chrome
5. **Consistency** — Single theme = no design debt

**If users request light mode:**  
Politely explain the brand/UX reasoning. Offer "reduce brightness" option in settings.

---

# 📱 **PLATFORM-SPECIFIC ADAPTATIONS**

## **iOS Specific:**
```
Status Bar: Light content (white icons/text)
Safe Area: Respect notch/Dynamic Island spacing
Navigation: Use native iOS nav patterns (back button left)
Gestures: Support swipe-back, pull-to-refresh
Haptics: Use iOS haptic feedback engine
Font Rendering: -apple-system font stack fallback
Buttons: 44pt minimum (Apple HIG)
```

## **Android Specific:**
```
Status Bar: Transparent with gradient overlay
Navigation: Material Design patterns (bottom nav optional)
Buttons: 48dp minimum (Material Design)
Ripple Effects: Material ripple on button press (voltage color)
Gestures: Support Android back gesture
Font Rendering: Roboto fallback, system font preferred
```

## **Web Specific:**
```
Responsive: Mobile-first, fluid scaling
Cursor: Pointer on interactive elements
Hover States: Desktop only (not touch)
Keyboard: Tab navigation, Enter/Space activation
Performance: Optimize images (WebP), lazy load
SEO: Semantic HTML, meta tags, structured data
```

---

# 🎨 **BRAND VOICE IN VISUAL DESIGN**

## **What the Design Should Communicate:**

✅ **"Fast"** — Quick actions, instant response, voltage energy  
✅ **"Reliable"** — Consistent design, professional structure  
✅ **"Comprehensive"** — All services in one place  
✅ **"Professional"** — Premium quality, trusted providers  
✅ **"Accessible"** — 24/7, easy to use, always ready  

❌ **Not:** Chaotic, unprofessional, limited, complicated, overwhelming

---

# 🛠️ **DESIGN SYSTEM MAINTENANCE**

## **Component Library Structure:**
```
/foundations
  /colors
  /typography
  /spacing
  /shadows
  /animations

/components
  /buttons
  /inputs
  /cards
  /modals
  /navigation
  /icons

/patterns
  /hero-sections
  /service-grids
  /testimonials
  /forms
  /footers

/templates
  /landing-page
  /dashboard
  /service-request
  /tracking
  /profile
```

## **Version Control:**

- Document all design token changes
- Maintain changelog for updates
- Test accessibility on every change
- Review cross-platform consistency quarterly

---

# 🎯 **COLOR USAGE GUIDELINES**

## **Primary Voltage Yellow (#FFD60A) - Use For:**
- All primary CTAs ("Request Help", "Get Started")
- Active states and selections
- Brand presence (logo, accents)
- Navigation highlights
- Success indicators
- Loading states
- Links and interactive elements
- Service availability badges (24/7)

## **Emergency Red (#FF3D3D) - Use ONLY For:**
- SOS/Emergency button (fixed position button)
- Critical danger alerts
- Failed payment notifications
- Cancelled service alerts
- Ambulance-specific critical notifications
- System errors requiring immediate attention

**DO NOT use red for:**
- Regular buttons or CTAs
- Standard notifications
- Service category icons (use category colors)
- General navigation
- Standard form validation

## **Service Category Colors - Use For:**
- Service type icons
- Category badges
- Service-specific status indicators
- Feature highlights
- Filtering and sorting

---

# 🎯 **DESIGN DELIVERABLES CHECKLIST**

When implementing this system, ensure:
```
✅ Primary voltage yellow (#FFD60A) is dominant brand color
✅ Emergency red (#FF3D3D) used ONLY for critical SOS/alerts
✅ All primary buttons use voltage yellow gradient
✅ Service categories have distinct colors but yellow is primary
✅ Typography scale consistent across platforms
✅ Button states (default, hover, active, disabled) defined
✅ Card styles with voltage glow effects working
✅ Form validation states (error, success, focus) styled
✅ Loading states use voltage yellow animation
✅ Empty states designed with voltage accents
✅ Error messages use red only for critical issues
✅ Responsive breakpoints tested
✅ Accessibility contrast ratios verified
✅ Motion respects prefers-reduced-motion
✅ Icons consistent size/stroke
✅ Spacing follows 8pt grid
✅ All interactive elements have voltage yellow focus states
```

---

# 💡 **FINAL DESIGN PHILOSOPHY**

**"Every pixel serves the promise: Help arrives when you need it most."**

This design system exists to:

1. **Eliminate panic** through clarity
2. **Build trust** through consistency
3. **Communicate speed** through voltage energy
4. **Express premium** through restraint
5. **Deliver results** through usability

**The voltage yellow aesthetic is not decoration—it's instant energy and reliable help visualized.**

---

# 🚀 **YOU'RE READY TO BUILD**

This document contains everything needed to implement the ResQ visual identity consistently across:

- Mobile apps (iOS/Android)
- Web application
- Marketing materials
- Provider interface
- Admin dashboard

**Key Theme Summary:**
- **Primary Brand Color:** Voltage Yellow (#FFD60A) - represents energy, speed, reliability
- **Emergency Alert Color:** Red (#FF3D3D) - use ONLY for SOS and critical alerts
- **Base:** Dark charcoal (#0F0F0F, #1A1A1A)
- **Accent System:** Service-specific colors for categories

**Bookmark this. Reference it religiously. Build with confidence.**

When you're ready to start implementation, you have a complete design language that balances **voltage energy** with **professional trust**—exactly what an emergency services platform needs to succeed.

⚡ **Now go build something electrifying.** 🚨