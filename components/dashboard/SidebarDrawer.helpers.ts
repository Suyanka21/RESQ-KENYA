/**
 * Phase 4 (audit-v2 §N-HIGH-5) — pure helpers extracted from
 * `SidebarDrawer.tsx` so they can be unit-tested without bootstrapping
 * the React Native runtime.
 *
 * Imported by the sidebar component AND by
 * `__tests__/components/SidebarDrawer.helpers.test.ts`.
 *
 * Skills: Code-Simplification (split pure logic from JSX so each can
 * evolve independently), Test-Driven-Development (single-responsibility
 * pure functions are trivial to test).
 */

/**
 * Derive two-letter initials from the user's display name.
 *
 * Examples:
 *   "John Mwangi"          → "JM"
 *   "Brayan"               → "BR"  (first two letters as a fallback)
 *   "  "                   → "??"  (whitespace-only name → placeholder)
 *   "Brayan Yobra Mwangi"  → "BM"  (first + last word)
 */
export function deriveInitials(displayName?: string | null): string {
    const trimmed = (displayName ?? '').trim();
    if (trimmed.length === 0) return '??';
    const words = trimmed.split(/\s+/);
    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Format a wallet balance in whole KES with comma thousands separators.
 * Matches the convention from `services/payment.service.ts:formatAmount`.
 */
export function formatWalletBalance(balance: number): string {
    if (!Number.isFinite(balance) || balance < 0) return 'KES 0';
    return `KES ${Math.floor(balance).toLocaleString('en-KE')}`;
}
