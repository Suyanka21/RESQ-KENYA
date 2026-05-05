/**
 * Pure helper for normalising Kenyan mobile numbers into the M-Pesa
 * `2547XXXXXXXX` form. No firebase imports so it's directly unit-testable.
 */

export function normaliseKenyanPhone(input: string): string | null {
    const digits = input.replace(/\D/g, '');
    let formatted = digits;
    if (digits.startsWith('0')) {
        formatted = '254' + digits.slice(1);
    } else if (digits.startsWith('7') || digits.startsWith('1')) {
        formatted = '254' + digits;
    } else if (!digits.startsWith('254')) {
        formatted = '254' + digits;
    }
    if (!/^254(7|1)\d{8}$/.test(formatted)) return null;
    return formatted;
}
