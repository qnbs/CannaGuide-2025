// ESLint 9 flat config – replaces .eslintrc.json
import js from '@eslint/js'
import antiTrojanSourcePlugin from 'eslint-plugin-anti-trojan-source'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default [
    // ── Globally ignored paths ──────────────────────────────────────────────
    {
        ignores: [
            'dist/**',
            '**/dist/**',
            'node_modules/**',
            'public/sw.js',
            'public/sw.mjs',
            'apps/web/public/sw.js',
            'apps/web/public/sw.mjs',
            'src-tauri/**',
            '**/*.cjs',
            'scripts/**',
            'docker/**',
            'docker/iot-mocks/**',
            'apps/desktop/**',
            'types/**/*.d.ts',
        ],
    },

    // ── Base JS recommended ─────────────────────────────────────────────────
    js.configs.recommended,

    // ── Unicode / Trojan Source protection ──────────────────────────────────
    {
        files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
        plugins: {
            'anti-trojan-source': antiTrojanSourcePlugin,
        },
        rules: {
            'anti-trojan-source/no-bidi': 'error',
        },
    },

    // ── TypeScript + React source files ────────────────────────────────────
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.es2021,
                ...globals.node,
                ...globals.worker,
                __APP_VERSION__: 'readonly',
                IDBTransactionMode: 'readonly',
                IDBValidKey: 'readonly',
                NotificationPermission: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            // TypeScript recommended
            ...tsPlugin.configs.recommended.rules,
            // React recommended (no JSX import required for React 17+)
            ...reactPlugin.configs.recommended.rules,
            'react/display-name': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            // Custom tuning
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            // TypeScript strictness (total-typescript inspired)
            '@typescript-eslint/no-unsafe-type-assertion': 'warn',
            '@typescript-eslint/no-unnecessary-type-arguments': 'warn',
            // React Hooks
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            // Package boundary enforcement (K-01)
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['**/packages/*/src/*'],
                            message:
                                'Import from package entry point (e.g. @cannaguide/ai-core) instead of deep src/ paths.',
                        },
                    ],
                },
            ],
        },
    },

    // ── Test files – relax strict rules ────────────────────────────────────
    {
        files: ['**/*.test.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
        },
    },

    // ── Prettier integration (disables conflicting formatting rules) ────────
    prettierConfig,
]
