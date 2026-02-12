/**
 * Rule: no-hardcoded-spacing
 * Prevents hardcoded numeric spacing values in style objects
 * 
 * Bad:  padding: 16, margin: 24
 * Good: padding: spacing.md, margin: spacing.lg
 */

module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow hardcoded spacing values. Use theme spacing tokens instead.',
            category: 'Style Enforcement',
            recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
            noHardcodedSpacing:
                'Hardcoded spacing value {{value}} for "{{property}}". Use theme tokens instead.\n' +
                '  Suggested: spacing.xs(4), spacing.sm(8), spacing.md(16), spacing.lg(24), spacing.xl(32)',
        },
    },

    create(context) {
        const filename = context.getFilename();

        // Skip theme files
        const allowedFiles = [
            'voltage-premium.ts',
            'voltage-premium.js',
            'theme/',
            'tailwind.config',
            '.eslintrc',
            'eslint-plugin-resq-theme',
        ];

        if (allowedFiles.some(f => filename.includes(f))) {
            return {};
        }

        // Properties that typically use spacing
        const spacingProperties = [
            'padding',
            'paddingTop',
            'paddingBottom',
            'paddingLeft',
            'paddingRight',
            'paddingHorizontal',
            'paddingVertical',
            'margin',
            'marginTop',
            'marginBottom',
            'marginLeft',
            'marginRight',
            'marginHorizontal',
            'marginVertical',
            'gap',
            'rowGap',
            'columnGap',
            'top',
            'bottom',
            'left',
            'right',
        ];

        // Values that are commonly acceptable (flex, opacity, etc.)
        const allowedValues = [0, 1, 2, -1, -2, 0.5, 0.7, 0.8, 0.9];

        // Common spacing values from the theme (4px grid) - only flag these
        // Values NOT in this list (like 10, 12, 14, 18, 100, 120) will be ignored
        const themeSpacingValues = [4, 8, 16, 24, 32, 48, 64];

        return {
            Property(node) {
                // Check if this is a style property with a numeric value
                if (
                    node.key &&
                    node.key.type === 'Identifier' &&
                    spacingProperties.includes(node.key.name) &&
                    node.value &&
                    node.value.type === 'Literal' &&
                    typeof node.value.value === 'number'
                ) {
                    const value = node.value.value;

                    // Skip allowed values
                    if (allowedValues.includes(value)) {
                        return;
                    }

                    // Only flag values that EXACTLY match theme spacing values
                    // These should use tokens like spacing.xs, spacing.sm, etc.
                    if (themeSpacingValues.includes(value)) {
                        context.report({
                            node: node.value,
                            messageId: 'noHardcodedSpacing',
                            data: {
                                value,
                                property: node.key.name,
                            },
                        });
                    }
                    // Other values (10, 12, 14, 18, 20, etc.) are considered
                    // intentional custom values and will not be flagged
                }
            },
        };
    },
};
