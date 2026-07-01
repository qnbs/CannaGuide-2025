import type { ImageStyle } from '@/types/aiProvider'

export interface StylePalette {
    bg1: string
    bg2: string
    bg3: string
    accent: string
    accent2: string
    glow: string
    text: string
    textDim: string
    barBg: string
}

export const buildStylePalette = (style: Exclude<ImageStyle, 'random'>): StylePalette => {
    switch (style) {
        case 'fantasy':
            return {
                bg1: '#0d0a1a',
                bg2: '#1b1340',
                bg3: '#3b1f7a',
                accent: '#c084fc',
                accent2: '#f9a8d4',
                glow: '#7c3aed',
                text: '#f1e8ff',
                textDim: '#a78bfa',
                barBg: '#1e1545',
            }
        case 'botanical':
            return {
                bg1: '#030f09',
                bg2: '#0a2618',
                bg3: '#134e33',
                accent: '#34d399',
                accent2: '#86efac',
                glow: '#10b981',
                text: '#ecfdf5',
                textDim: '#6ee7b7',
                barBg: '#0c2a1a',
            }
        case 'psychedelic':
            return {
                bg1: '#1a0525',
                bg2: '#3b0764',
                bg3: '#7c2d92',
                accent: '#e879f9',
                accent2: '#fde047',
                glow: '#d946ef',
                text: '#fdf4ff',
                textDim: '#d946ef',
                barBg: '#2e1065',
            }
        case 'macro':
            return {
                bg1: '#0a0f18',
                bg2: '#162032',
                bg3: '#1e3a5f',
                accent: '#60a5fa',
                accent2: '#93c5fd',
                glow: '#3b82f6',
                text: '#eff6ff',
                textDim: '#93c5fd',
                barBg: '#172554',
            }
        case 'cyberpunk':
            return {
                bg1: '#04080f',
                bg2: '#0c1929',
                bg3: '#132f4c',
                accent: '#22d3ee',
                accent2: '#fb7185',
                glow: '#06b6d4',
                text: '#f0fdfa',
                textDim: '#67e8f9',
                barBg: '#0e2337',
            }
    }
}

export const DIFFICULTY_VAL: Record<string, number> = { Easy: 30, Medium: 60, Hard: 95 }
export const YIELD_VAL: Record<string, number> = { Low: 25, Medium: 55, High: 90 }
export const HEIGHT_VAL: Record<string, number> = { Short: 25, Medium: 55, Tall: 90 }

export const TERPENE_COLORS: Record<string, string> = {
    myrcene: '#86efac',
    limonene: '#fde047',
    caryophyllene: '#f97316',
    pinene: '#34d399',
    linalool: '#c084fc',
    terpinolene: '#22d3ee',
    ocimene: '#fb923c',
    humulene: '#a78bfa',
    bisabolol: '#f9a8d4',
    nerolidol: '#fbbf24',
    guaiol: '#2dd4bf',
    valencene: '#fdba74',
    camphene: '#4ade80',
    geraniol: '#f472b6',
    eucalyptol: '#67e8f9',
    borneol: '#a3e635',
    sabinene: '#c4b5fd',
    farnesene: '#fca5a5',
    phytol: '#6ee7b7',
    terpineol: '#7dd3fc',
}
