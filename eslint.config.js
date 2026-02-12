// @ts-check

/**
 * ResQ Kenya ESLint Configuration (Flat Config - ESLint v9+)
 * Enforces theme token usage to prevent hardcoded styles
 */

const typescriptParser = require('@typescript-eslint/parser');
const resqThemePlugin = require('./eslint-plugin-resq-theme');

module.exports = [
    {
        // Global ignores
        ignores: [
            'node_modules/**',
            'coverage/**',
            'dist/**',
            '.expo/**',
            'functions/**',
            'eslint-plugin-resq-theme/**',
            '*.config.js',
            '*.config.ts',
            '*.config.mjs',
            'metro.config.js',
            'babel.config.js',
            'eslint.config.js',
        ],
    },
    {
        // TypeScript/React files
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            'resq-theme': resqThemePlugin,
        },
        rules: {
            // Theme enforcement rules
            'resq-theme/no-hardcoded-colors': 'error',
            'resq-theme/no-hardcoded-spacing': 'warn',

            // Disable rules that conflict with TypeScript
            'no-unused-vars': 'off',
            'no-undef': 'off',
        },
    },
];
