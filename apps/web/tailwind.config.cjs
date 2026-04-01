/** @type {import('tailwindcss').Config} */
module.exports = {
    presets: [require('@cannaguide/ui/tailwind-preset')],
    darkMode: 'class',
    content: [
        './index.html',
        './index.tsx',
        './components/**/*.{ts,tsx}',
        './hooks/**/*.{ts,tsx}',
        './services/**/*.{ts,tsx}',
        './stores/**/*.{ts,tsx}',
        './workers/**/*.{ts,tsx}',
        './data/**/*.{ts,tsx}',
        './utils/**/*.{ts,tsx}',
        './lib/**/*.{ts,tsx}',
        '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    ],
    plugins: [require('@tailwindcss/typography')],
}
