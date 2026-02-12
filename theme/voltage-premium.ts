// ⚡ Voltage Premium Design System
// ResQ Kenya Emergency Services
// Complete aesthetic implementation from design philosophy
// Last Updated: January 30, 2026 - Phase 1.1 Semantic Token Overhaul

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ColorToken {
    primary: string;
    secondary: string;
    tertiary: string;
}

export interface TextColorToken extends ColorToken {
    disabled: string;
    onBrand: string;
}

export interface InteractiveColorToken {
    default: string;
    hover: string;
    pressed: string;
    disabled: string;
    focus: string;
}

export interface StatusColorToken {
    error: string;
    errorGlow: string;
    warning: string;
    warningGlow: string;
    success: string;
    successGlow: string;
    info: string;
    infoGlow: string;
}

export interface ServiceColorToken {
    towing: string;
    fuel: string;
    battery: string;
    tire: string;
    diagnostic: string;
    medical: string;
}

export interface ButtonToken {
    background: string;
    text: string;
    border?: string;
    shadow?: ShadowToken;
}

export interface ButtonVariants {
    primary: ButtonToken;
    secondary: ButtonToken;
    ghost: ButtonToken;
    danger: ButtonToken;
    disabled: ButtonToken;
}

export interface InputToken {
    background: string;
    border: string;
    borderFocused: string;
    text: string;
    placeholder: string;
    error: string;
}

export interface CardToken {
    background: string;
    backgroundElevated: string;
    border: string;
    borderActive: string;
}

export interface ShadowToken {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
}

export interface SpacingScale {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
}

export interface FontSizeScale {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
}

export interface FontWeightScale {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
    extrabold: string;
}

export interface DurationScale {
    instant: number;
    fast: number;
    normal: number;
    slow: number;
}

export interface EasingCurves {
    primary: string;
    emphasis: string;
    smooth: string;
    bounce: string;
}

// =============================================================================
// SEMANTIC COLOR TOKENS
// =============================================================================

export const colors = {
    // -------------------------------------------------------------------------
    // BACKGROUND (Layered Depth System)
    // -------------------------------------------------------------------------
    background: {
        primary: '#0F0F0F',    // Deepest layer - app background
        secondary: '#1A1A1A',  // Card/UI backgrounds
        tertiary: '#252525',   // Elevated surfaces, modals
        border: '#2E2E2E',     // Dividers, borders
    } as ColorToken & { border: string },

    // Legacy charcoal tokens (for backward compatibility)
    charcoal: {
        900: '#0F0F0F',
        800: '#1A1A1A',
        700: '#252525',
        600: '#2E2E2E',
        500: '#3D3D3D',  // Highway roads / elevated surfaces
    },

    // -------------------------------------------------------------------------
    // TEXT COLORS
    // -------------------------------------------------------------------------
    text: {
        primary: '#FFFFFF',      // High contrast for emergency visibility
        secondary: '#A0A0A0',    // Descriptions, supporting text
        tertiary: '#6B6B6B',     // Hints, timestamps
        muted: '#6B6B6B',        // Legacy alias for tertiary
        disabled: '#4A4A4A',     // Disabled elements
        onBrand: '#0F0F0F',      // Dark text on voltage/orange background
        // Opacity variants for overlays and subtle text
        opacity80: 'rgba(255, 255, 255, 0.8)',
        opacity60: 'rgba(255, 255, 255, 0.6)',
        opacity40: 'rgba(255, 255, 255, 0.4)',
        opacity30: 'rgba(255, 255, 255, 0.3)',
        opacity20: 'rgba(255, 255, 255, 0.2)',
    } as TextColorToken & { muted: string; opacity80: string; opacity60: string; opacity40: string; opacity30: string; opacity20: string },

    // Overlay colors for modals and backgrounds
    overlay: {
        dark: 'rgba(0, 0, 0, 0.85)',
        medium: 'rgba(0, 0, 0, 0.6)',
        light: 'rgba(0, 0, 0, 0.3)',
    },

    // -------------------------------------------------------------------------
    // INTERACTIVE STATES (Voltage Orange)
    // -------------------------------------------------------------------------
    interactive: {
        default: '#FFA500',      // Voltage Orange - primary brand
        hover: '#FFB733',        // Brighter on hover
        pressed: '#E69500',      // Deeper on press
        disabled: '#7A5000',     // Muted orange
        focus: 'rgba(255, 165, 0, 0.4)',  // Focus ring glow
    } as InteractiveColorToken,

    // Legacy voltage tokens (for backward compatibility)
    voltage: '#FFA500',
    voltageBright: '#FFB733',
    voltageDeep: '#E69500',
    voltageGlow: 'rgba(255, 165, 0, 0.4)',

    // -------------------------------------------------------------------------
    // STATUS COLORS (WCAG AA Compliant)
    // -------------------------------------------------------------------------
    status: {
        error: '#FF3D3D',        // SOS, critical alerts ONLY
        errorGlow: 'rgba(255, 61, 61, 0.2)',
        warning: '#FF9800',      // Vehicle issues, alerts
        warningGlow: 'rgba(255, 152, 0, 0.2)',
        success: '#00E676',      // Service complete, verification
        successGlow: 'rgba(0, 230, 118, 0.2)',
        info: '#29B6F6',         // GPS, tracking, location
        infoGlow: 'rgba(41, 182, 246, 0.2)',
    } as StatusColorToken,

    // Legacy status tokens (for backward compatibility)
    emergency: '#FF3D3D',
    emergencyGlow: 'rgba(255, 61, 61, 0.2)',
    success: '#00E676',
    successGlow: 'rgba(0, 230, 118, 0.2)',
    warning: '#FF9800',
    warningGlow: 'rgba(255, 152, 0, 0.2)',
    medical: '#DC143C',
    medicalGlow: 'rgba(220, 20, 60, 0.25)',
    info: '#29B6F6',
    infoGlow: 'rgba(41, 182, 246, 0.2)',

    // -------------------------------------------------------------------------
    // SERVICE CATEGORY COLORS
    // -------------------------------------------------------------------------
    service: {
        towing: '#FFA500',       // Voltage Orange
        fuel: '#4CAF50',         // Green
        battery: '#FFA500',      // Voltage Orange
        tire: '#9C27B0',         // Purple
        diagnostic: '#2196F3',   // Blue
        medical: '#DC143C',      // Medical Red
    } as ServiceColorToken,

    // Legacy service tokens (for backward compatibility)
    serviceTowing: '#FFA500',
    serviceTire: '#9C27B0',
    serviceBattery: '#FFA500',
    serviceFuel: '#4CAF50',
    serviceDiagnostics: '#2196F3',
    serviceAmbulance: '#DC143C',

    // -------------------------------------------------------------------------
    // GRADIENTS
    // -------------------------------------------------------------------------
    gradients: {
        voltage: ['#FFA500', '#FF8C00'],
        emergency: ['#FF3D3D', '#FF6259'],
        dark: ['#0F0F0F', '#1A1A1A'],
        success: ['#00E676', '#00C853'],
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

    // Semantic Font Sizes (4px base)
    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 24,
        xxl: 32,
        xxxl: 48,
    } as FontSizeScale,

    // Semantic Font Weights
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    } as FontWeightScale,

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

    // Legacy sizes (for backward compatibility)
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
// SPACING SYSTEM (4px base)
// =============================================================================

export const spacing: SpacingScale & Record<string, number> = {
    // Semantic scale
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,

    // Numeric scale (8-point grid)
    '0.5': 4,
    '1': 8,
    '2': 16,
    '3': 24,
    '4': 32,
    '6': 48,
    '8': 64,
    '12': 96,

    // Legacy shortcuts
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
// SHADOWS (Dark Theme Optimized)
// =============================================================================

export const shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 8,
    } as ShadowToken,

    cardElevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 32,
        elevation: 12,
    } as ShadowToken,

    button: {
        shadowColor: colors.voltage,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 8,
    } as ShadowToken,

    glow: {
        shadowColor: colors.voltage,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
    } as ShadowToken,

    emergencyGlow: {
        shadowColor: colors.emergency,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
    } as ShadowToken,

    // Focus ring shadow
    focusRing: {
        shadowColor: colors.voltageGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 0,
    } as ShadowToken,
};

// =============================================================================
// ANIMATION TOKENS
// =============================================================================

export const animation = {
    duration: {
        instant: 100,    // Micro-feedback
        fast: 150,       // Quick interactions
        normal: 300,     // Standard transitions
        slow: 500,       // Page transitions
    } as DurationScale,

    easing: {
        primary: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Material ease-out
        emphasis: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Back-out bounce
        smooth: 'cubic-bezier(0.4, 0, 0.6, 1)',       // Smooth ease
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Elastic
    } as EasingCurves,

    // Legacy aliases
    timing: {
        instant: 150,
        fast: 250,
        standard: 350,
        slow: 500,
    },
};

// =============================================================================
// COMPONENT TOKENS
// =============================================================================

export const button: ButtonVariants = {
    primary: {
        background: colors.interactive.default,
        text: colors.text.onBrand,
        shadow: shadows.button,
    },
    secondary: {
        background: 'transparent',
        text: colors.text.primary,
        border: colors.interactive.default,
    },
    ghost: {
        background: 'transparent',
        text: colors.interactive.default,
    },
    danger: {
        background: colors.status.error,
        text: colors.text.primary,
        shadow: shadows.emergencyGlow,
    },
    disabled: {
        background: colors.background.tertiary,
        text: colors.text.disabled,
    },
};

export const input: InputToken = {
    background: colors.background.tertiary,
    border: colors.background.border,
    borderFocused: colors.interactive.default,
    text: colors.text.primary,
    placeholder: colors.text.tertiary,
    error: colors.status.error,
};

export const card: CardToken = {
    background: colors.background.secondary,
    backgroundElevated: colors.background.tertiary,
    border: colors.background.border,
    borderActive: `${colors.voltage}33`,
};

// =============================================================================
// TOUCH TARGETS (Accessibility)
// =============================================================================

export const touchTargets = {
    minimum: 44,    // iOS HIG minimum
    standard: 48,   // Recommended
    large: 56,      // Prominent actions
    sos: 80,        // Emergency button
};

// =============================================================================
// NAIROBI SERVICE PRICES (KES) - PRESERVED
// =============================================================================

export const PRICES = {
    FUEL_PETROL: 182.52,
    FUEL_DIESEL: 170.47,
    TOWING_BASE: 5000,
    AMBULANCE_BASE: 3500,
    JUMPSTART_BASE: 1500,
    TIRE_BASE: 2000,
    DIAGNOSTICS_BASE: 2500,
    TOWING_PER_KM: 150,
    PLATFORM_FEE_PERCENT: 10,
};

// =============================================================================
// SERVICE TYPES (with category colors) - PRESERVED
// =============================================================================

export const SERVICE_TYPES = {
    towing: {
        name: 'Flatbed Towing',
        icon: 'truck',
        emoji: '🚛',
        color: colors.service.towing,
        basePrice: PRICES.TOWING_BASE,
        description: 'Professional flatbed towing for any vehicle',
    },
    tire: {
        name: 'Tire Repair',
        icon: 'circle-dot',
        emoji: '🔧',
        color: colors.service.tire,
        basePrice: PRICES.TIRE_BASE,
        description: 'Flat tire repair or spare replacement',
    },
    battery: {
        name: 'Battery Jumpstart',
        icon: 'zap',
        emoji: '⚡',
        color: colors.service.battery,
        basePrice: PRICES.JUMPSTART_BASE,
        description: 'Dead battery? Get a quick jumpstart',
    },
    fuel: {
        name: 'Fuel Delivery',
        icon: 'droplet',
        emoji: '⛽',
        color: colors.service.fuel,
        basePrice: 0,
        description: 'Emergency fuel delivered to you',
    },
    diagnostics: {
        name: 'Diagnostics',
        icon: 'activity',
        emoji: '🔍',
        color: colors.service.diagnostic,
        basePrice: PRICES.DIAGNOSTICS_BASE,
        description: 'On-site vehicle diagnostic check',
    },
    ambulance: {
        name: 'Ambulance',
        icon: 'heart-pulse',
        emoji: '🚑',
        color: colors.service.medical,
        basePrice: PRICES.AMBULANCE_BASE,
        description: 'Emergency medical response',
    },
} as const;

export type ServiceType = keyof typeof SERVICE_TYPES;

// =============================================================================
// MEMBERSHIP TIERS - PRESERVED
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
// COMPONENT STYLE HELPERS (Backward Compatible)
// =============================================================================

export const componentStyles = {
    card: {
        standard: {
            backgroundColor: colors.background.secondary,
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.background.border,
            padding: spacing.lg,
            ...shadows.card,
        },
        elevated: {
            backgroundColor: colors.background.tertiary,
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: card.borderActive,
            padding: spacing.lg,
            ...shadows.cardElevated,
        },
        service: {
            backgroundColor: colors.background.secondary,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.background.border,
            borderLeftWidth: 3,
            borderLeftColor: colors.voltage,
            padding: spacing.md,
        },
    },

    button: {
        primary: {
            backgroundColor: colors.interactive.default,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xl,
            minHeight: touchTargets.standard,
            ...shadows.button,
        },
        secondary: {
            backgroundColor: 'transparent',
            borderRadius: borderRadius.lg,
            borderWidth: 2,
            borderColor: colors.interactive.default,
            paddingVertical: spacing.md - 2,
            paddingHorizontal: spacing.xl - 2,
            minHeight: touchTargets.standard,
        },
        emergency: {
            backgroundColor: colors.status.error,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xl,
            minHeight: touchTargets.sos,
            ...shadows.emergencyGlow,
        },
    },

    input: {
        default: {
            backgroundColor: input.background,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: input.border,
            paddingVertical: 14,
            paddingHorizontal: spacing.md,
            color: input.text,
            fontSize: typography.fontSize.base,
            minHeight: touchTargets.standard,
        },
        focused: {
            borderColor: input.borderFocused,
            ...shadows.focusRing,
        },
        error: {
            borderColor: input.error,
        },
    },
};

// =============================================================================
// CONVENIENCE EXPORTS (for admin dashboards) - PRESERVED
// =============================================================================

export const voltageColors = {
    primary: colors.voltage,
    background: colors.background.primary,
    backgroundDark: colors.background.secondary,
    surface: colors.background.tertiary,
    surfaceLight: colors.background.border,
    textPrimary: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.tertiary,
    success: colors.success,
    warning: colors.warning,
    error: colors.emergency,
    accent: colors.info,
    voltage: colors.voltage,
    // Opacity variants for admin dashboards
    textOpacity80: colors.text.opacity80,
    textOpacity60: colors.text.opacity60,
    textOpacity40: colors.text.opacity40,
    textOpacity30: colors.text.opacity30,
    textOpacity20: colors.text.opacity20,
};

export const voltageSpacing = spacing;

// =============================================================================
// THEME OBJECT (Complete Export)
// =============================================================================

export const theme = {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animation,
    button,
    input,
    card,
    touchTargets,
    componentStyles,
};

export type Theme = typeof theme;
export default theme;
