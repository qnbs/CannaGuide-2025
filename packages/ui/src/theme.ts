// ---------------------------------------------------------------------------
// Theme type definitions & CSS custom property contract
// ---------------------------------------------------------------------------

/** Available cannabis-themed visual themes. */
export type Theme =
    | 'midnight'
    | 'forest'
    | 'purpleHaze'
    | 'desertSky'
    | 'roseQuartz'
    | 'rainbowKush'
    | 'ogKushGreen'
    | 'runtzRainbow'
    | 'lemonSkunk'

/**
 * CSS custom property token keys used by all themes.
 * Values are space-separated RGB triplets (e.g. "8 145 178").
 */
export interface ThemeTokens {
    '--color-bg-primary': string
    '--color-bg-component': string
    '--color-border': string
    '--color-text-on-accent': string
    '--color-success': string
    '--color-warning': string
    '--color-danger': string
    '--color-info': string
    [key: `--color-primary-${string}`]: string
    [key: `--color-accent-${string}`]: string
    [key: `--color-secondary-${string}`]: string
    [key: `--color-neutral-${string}`]: string
}
