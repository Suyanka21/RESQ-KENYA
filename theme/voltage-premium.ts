// ⚡ Voltage Premium Design System
// ResQ Kenya Emergency Services
// Complete aesthetic implementation from design philosophy

// =============================================================================
// COLOR SYSTEM
// =============================================================================

export const colors = {
    // Charcoal - Dark Theme Base (layered depth)
    charcoal: {
        900: '#0F0F0F', // Primary background (deepest)
        800: '#1A1A1A', // Card/UI backgrounds
        700: '#252525', // Elevated surfaces, modals
        600: '#2E2E2E', // Borders, dividers
    },

    // Voltage Yellow - Brand Primary Energy
    voltage: '#FFD60A',
    voltageBright: '#FFF455',  // Highlights, glow effects
    voltageDeep: '#E6B800',    // Pressed states, shadows
    voltageGlow: 'rgba(255, 214, 10, 0.3)', // Ambient light effects

    // Status Colors
    emergency: '#FF3D3D',      // SOS button, critical alerts ONLY
    emergencyGlow: 'rgba(255, 61, 61, 0.2)',
    success: '#00E676',        // Service complete, verification
    successGlow: 'rgba(0, 230, 118, 0.2)',
    warning: '#FF9800',        // Vehicle issues, alerts
    warningGlow: 'rgba(255, 152, 0, 0.2)',
    medical: '#DC143C',        // Ambulance services specifically
    medicalGlow: 'rgba(220, 20, 60, 0.25)',
    info: '#29B6F6',           // GPS, tracking, location
    infoGlow: 'rgba(41, 182, 246, 0.2)',

    // Service Category Colors
    serviceTowing: '#FF9800',      // Orange
    serviceTire: '#9C27B0',        // Purple
    serviceBattery: '#FFD60A',     // Voltage Yellow
    serviceFuel: '#4CAF50',        // Green
    serviceDiagnostics: '#2196F3', // Blue
    serviceAmbulance: '#DC143C',   // Medical Red

    // Text Colors
    text: {
        primary: '#FFFFFF',
        secondary: '#A0A0A0',
        muted: '#6B6B6B',
        onVoltage: '#0F0F0F', // Dark text on voltage background
    },

    // Gradients (as string values for use in styles)
    gradients: {
        voltage: ['#FFD60A', '#FFA800'],
        emergency: ['#FF3D3D', '#FF6259'],
        dark: ['#0F0F0F', '#1A1A1A'],
    },
};

// =============================================================================
// TYPOGRAPHY SYSTEM
// =============================================================================

export const typography = {
    fontFamily: {
        sans: 'Inter',
        mono: 'JetBrains Mono',
    },
    // Mobile Scale (375px base)
    mobile: {
        hero: { size: 40, lineHeight: 44, weight: '800' },
        section: { size: 28, lineHeight: 32, weight: '700' },
        subsection: { size: 20, lineHeight: 24, weight: '600' },
        bodyLarge: { size: 18, lineHeight: 26, weight: '400' },
        body: { size: 16, lineHeight: 24, weight: '400' },
        bodySmall: { size: 14, lineHeight: 20, weight: '400' },
        caption: { size: 12, lineHeight: 16, weight: '500' },
        button: { size: 16, lineHeight: 20, weight: '600' },
    },
    // Desktop Scale (1440px base)
    desktop: {
        hero: { size: 64, lineHeight: 72, weight: '800' },
        section: { size: 48, lineHeight: 56, weight: '700' },
        subsection: { size: 32, lineHeight: 40, weight: '600' },
        bodyLarge: { size: 20, lineHeight: 30, weight: '400' },
        body: { size: 18, lineHeight: 28, weight: '400' },
        bodySmall: { size: 16, lineHeight: 24, weight: '400' },
        caption: { size: 14, lineHeight: 20, weight: '500' },
        button: { size: 18, lineHeight: 24, weight: '600' },
    },
    sizes: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
        '6xl': 64,
    },
    weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },
};

// =============================================================================
// SPACING (8-Point Grid System)
// =============================================================================

export const spacing = {
    '0.5': 4,   // Tight elements
    '1': 8,     // Default small
    '2': 16,    // Default medium
    '3': 24,    // Section padding
    '4': 32,    // Large spacing
    '6': 48,    // Section breaks
    '8': 64,    // Major sections
    '12': 96,   // Hero spacing
    // Semantic shortcuts
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
};

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
};

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
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
        shadowColor: colors.voltage,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 8,
    },
    glow: {
        shadowColor: colors.voltage,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
    },
    emergencyGlow: {
        shadowColor: colors.emergency,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
    },
};

// =============================================================================
// ANIMATION TIMING
// =============================================================================

export const animation = {
    duration: {
        instant: 150,
        fast: 250,
        standard: 350,
        slow: 500,
    },
    easing: {
        primary: 'cubic-bezier(0.4, 0, 0.2, 1)',   // ease-out
        emphasis: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // back-out bounce
        smooth: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
};

// =============================================================================
// NAIROBI SERVICE PRICES (KES)
// =============================================================================

export const PRICES = {
    FUEL_PETROL: 180.66,
    FUEL_DIESEL: 168.06,
    TOWING_BASE: 5000,
    AMBULANCE_BASE: 3500,
    JUMPSTART_BASE: 1500,
    TIRE_BASE: 2000,
    DIAGNOSTICS_BASE: 2500,
    TOWING_PER_KM: 150,
    PLATFORM_FEE_PERCENT: 10,
};

// =============================================================================
// SERVICE TYPES (with category colors)
// =============================================================================

export const SERVICE_TYPES = {
    towing: {
        name: 'Flatbed Towing',
        icon: 'truck',
        emoji: '🚛',
        color: colors.serviceTowing,
        basePrice: PRICES.TOWING_BASE,
        description: 'Professional flatbed towing for any vehicle',
    },
    tire: {
        name: 'Tire Repair',
        icon: 'circle-dot',
        emoji: '🔧',
        color: colors.serviceTire,
        basePrice: PRICES.TIRE_BASE,
        description: 'Flat tire repair or spare replacement',
    },
    battery: {
        name: 'Battery Jumpstart',
        icon: 'zap',
        emoji: '⚡',
        color: colors.serviceBattery,
        basePrice: PRICES.JUMPSTART_BASE,
        description: 'Dead battery? Get a quick jumpstart',
    },
    fuel: {
        name: 'Fuel Delivery',
        icon: 'droplet',
        emoji: '⛽',
        color: colors.serviceFuel,
        basePrice: 0,
        description: 'Emergency fuel delivered to you',
    },
    diagnostics: {
        name: 'Diagnostics',
        icon: 'activity',
        emoji: '🔍',
        color: colors.serviceDiagnostics,
        basePrice: PRICES.DIAGNOSTICS_BASE,
        description: 'On-site vehicle diagnostic check',
    },
    ambulance: {
        name: 'Ambulance',
        icon: 'heart-pulse',
        emoji: '🚑',
        color: colors.serviceAmbulance,
        basePrice: PRICES.AMBULANCE_BASE,
        description: 'Emergency medical response',
    },
} as const;

export type ServiceType = keyof typeof SERVICE_TYPES;

// =============================================================================
// MEMBERSHIP TIERS
// =============================================================================

export const MEMBERSHIPS = {
    basic: {
        name: 'Basic',
        monthlyFee: 0,
        discount: 0,
        features: ['Standard response time', 'Pay-per-service'],
    },
    gold: {
        name: 'Gold',
        monthlyFee: 2500,
        discount: 10,
        features: ['Priority dispatch', '10% off all services', 'Free diagnostics'],
    },
    platinum: {
        name: 'Platinum',
        monthlyFee: 5000,
        discount: 20,
        features: ['Fastest response', '20% off all services', 'Free towing (5km)', '24/7 premium support'],
    },
};

// =============================================================================
// COMPONENT STYLE HELPERS
// =============================================================================

export const componentStyles = {
    // Card Styles
    card: {
        standard: {
            backgroundColor: colors.charcoal[800],
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.charcoal[600],
            padding: spacing.lg,
            ...shadows.card,
        },
        elevated: {
            backgroundColor: colors.charcoal[700],
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: `${colors.voltage}33`,
            padding: spacing.lg,
            ...shadows.cardElevated,
        },
        service: {
            backgroundColor: colors.charcoal[800],
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.charcoal[600],
            borderLeftWidth: 3,
            borderLeftColor: colors.voltage,
            padding: spacing.md,
        },
    },

    // Button Styles
    button: {
        primary: {
            backgroundColor: colors.voltage,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xl,
            ...shadows.button,
        },
        secondary: {
            backgroundColor: 'transparent',
            borderRadius: borderRadius.lg,
            borderWidth: 2,
            borderColor: colors.voltage,
            paddingVertical: spacing.md - 2,
            paddingHorizontal: spacing.xl - 2,
        },
        emergency: {
            backgroundColor: colors.emergency,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xl,
            ...shadows.emergencyGlow,
        },
    },

    // Input Styles
    input: {
        default: {
            backgroundColor: colors.charcoal[700],
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.charcoal[600],
            paddingVertical: 14,
            paddingHorizontal: spacing.md,
            color: colors.text.primary,
            fontSize: typography.sizes.base,
        },
        focused: {
            borderColor: colors.voltage,
            shadowColor: colors.voltageGlow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
        },
    },
};
