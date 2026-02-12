/**
 * Rule: no-hardcoded-colors
 * Prevents hardcoded hex colors outside of theme files
 * 
 * Bad:  color: '#FFA500'
 * Good: color: colors.voltage
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow hardcoded hex color values. Use theme tokens instead.',
            category: 'Style Enforcement',
            recommended: true,
        },
        fixable: null, // Cannot auto-fix without knowing the semantic meaning
        schema: [],
        messages: {
            noHardcodedColor:
                'Hardcoded color "{{color}}" detected. Use theme tokens from voltage-premium.ts instead.\n' +
                '  Examples: colors.voltage, colors.background.primary, colors.text.secondary',
        },
    },

    create(context) {
        const filename = context.getFilename();

        // Skip theme files - they are allowed to define colors
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

        // Regex for hex colors: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
        const hexColorRegex = /#(?:[0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\b/g;

        // Also match rgb/rgba patterns
        const rgbaRegex = /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g;

        function checkForHardcodedColors(node, value) {
            if (typeof value !== 'string') return;

            // Check for hex colors
            const hexMatches = value.match(hexColorRegex);
            if (hexMatches) {
                hexMatches.forEach(color => {
                    context.report({
                        node,
                        messageId: 'noHardcodedColor',
                        data: { color },
                    });
                });
            }

            // Check for rgb/rgba (but allow if coming from theme via template literal)
            const rgbaMatches = value.match(rgbaRegex);
            if (rgbaMatches && !value.includes('${')) {
                rgbaMatches.forEach(color => {
                    context.report({
                        node,
                        messageId: 'noHardcodedColor',
                        data: { color: color + '...)' },
                    });
                });
            }
        }

        return {
            // Check string literals
            Literal(node) {
                if (typeof node.value === 'string') {
                    checkForHardcodedColors(node, node.value);
                }
            },

            // Check template literals
            TemplateLiteral(node) {
                node.quasis.forEach(quasi => {
                    checkForHardcodedColors(node, quasi.value.raw);
                });
            },
        };
    },
};
