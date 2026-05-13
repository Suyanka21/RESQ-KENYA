// Phase 4 (audit-v3 §MOCK-SWEEP) — support contact details.
//
// The previous build hard-coded support@resq.co.ke and the Kenyan
// number +254 712 345 678 directly inside `app/(customer)/help.tsx`.
// Hard-coded customer-support contact info is a frequent source of
// production incidents (number changes, ops handoff, white-label
// deployments). Centralising here means a single edit ships across
// every screen, and white-label deployments can override via the
// EXPO_PUBLIC_SUPPORT_* env vars without touching app code.

// The defaults below are placeholders intended for development. They
// MUST be overridden via EXPO_PUBLIC_SUPPORT_EMAIL and
// EXPO_PUBLIC_SUPPORT_PHONE in `.env` for any non-dev build —
// `scripts/check-env-keys.js` (or equivalent) should be updated to
// fail CI if these are missing for production builds.
const DEFAULT_SUPPORT_EMAIL = 'support@resq.co.ke';
const DEFAULT_SUPPORT_PHONE_E164 = '+254712345678';

export const SUPPORT_EMAIL: string =
    process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL;

// Phone number in E.164 ("+254712345678") — used in tel:/wa.me links.
export const SUPPORT_PHONE_E164: string =
    process.env.EXPO_PUBLIC_SUPPORT_PHONE?.trim() || DEFAULT_SUPPORT_PHONE_E164;

// Human-readable formatted version of the support phone, e.g.
// "+254 712 345 678". Returns the raw value unchanged for any phone
// that isn't a 12-digit Kenyan +254 number.
export function formatSupportPhoneDisplay(e164: string = SUPPORT_PHONE_E164): string {
    const digits = e164.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('254')) {
        return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
    }
    return e164;
}
