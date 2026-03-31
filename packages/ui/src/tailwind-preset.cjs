// ---------------------------------------------------------------------------
// @cannaguide/ui — Tailwind CSS Preset
// ---------------------------------------------------------------------------
// Shared color palette, animations, and box-shadows consumed by both
// apps/web and apps/desktop.  Uses CSS custom properties (defined in
// tokens.css) so all 9 themes work via runtime class toggles.
//
// Usage in a consumer's tailwind.config.cjs:
//   presets: [require('@cannaguide/ui/tailwind-preset')],
// ---------------------------------------------------------------------------

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'bg-primary': 'rgb(var(--color-bg-primary))',
                'bg-component': 'rgb(var(--color-bg-component))',
                border: 'rgba(var(--color-border), 0.1)',
                'text-on-accent': 'rgb(var(--color-text-on-accent))',
                success: 'rgb(var(--color-success))',
                warning: 'rgb(var(--color-warning))',
                danger: 'rgb(var(--color-danger))',
                info: 'rgb(var(--color-info))',
                primary: Object.fromEntries(
                    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [
                        s,
                        `rgb(var(--color-primary-${s}))`,
                    ]),
                ),
                accent: Object.fromEntries(
                    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [
                        s,
                        `rgb(var(--color-accent-${s}))`,
                    ]),
                ),
                secondary: Object.fromEntries(
                    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [
                        s,
                        `rgb(var(--color-secondary-${s}))`,
                    ]),
                ),
                slate: Object.fromEntries(
                    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [
                        s,
                        `rgb(var(--color-neutral-${s}))`,
                    ]),
                ),
            },
            keyframes: {
                'slide-in-up': {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'fade-in-up': {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-down-fade-in': {
                    '0%': { opacity: 0, transform: 'translateY(-10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 0px rgb(var(--color-primary-400) / 0.7)' },
                    '50%': { boxShadow: '0 0 10px 2px rgb(var(--color-primary-400) / 0.7)' },
                },
            },
            animation: {
                'slide-in-up': 'slide-in-up 0.3s ease-out',
                'fade-in': 'fade-in 0.3s ease-out',
                'fade-in-up': 'fade-in-up 0.4s ease-out',
                'slide-down-fade-in': 'slide-down-fade-in 0.2s ease-out',
                'pulse-glow': 'pulse-glow 2s infinite ease-in-out',
            },
            boxShadow: {
                'glow-primary': '0 0 8px rgb(var(--color-primary-400) / 0.6)',
                'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
            },
        },
    },
}
