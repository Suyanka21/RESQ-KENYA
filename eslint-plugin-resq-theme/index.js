/**
 * ESLint Plugin: resq-theme
 * Enforces theme token usage and prevents hardcoded colors/spacing
 */

module.exports = {
    rules: {
        'no-hardcoded-colors': require('./rules/no-hardcoded-colors'),
        'no-hardcoded-spacing': require('./rules/no-hardcoded-spacing'),
    },
    configs: {
        recommended: {
            plugins: ['resq-theme'],
            rules: {
                'resq-theme/no-hardcoded-colors': 'error',
                'resq-theme/no-hardcoded-spacing': 'warn',
            },
        },
    },
};
