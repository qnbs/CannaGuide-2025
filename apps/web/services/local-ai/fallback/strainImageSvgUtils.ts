import type { ImageStyle } from '@/types/aiProvider'
import DOMPurify from 'dompurify'
import { secureRandom } from '@/utils/random'

export const escapeXml = (value: string): string =>
    DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

const AVAILABLE_STYLES: Exclude<ImageStyle, 'random'>[] = [
    'fantasy',
    'botanical',
    'psychedelic',
    'macro',
    'cyberpunk',
]

export const resolveStyle = (style: ImageStyle): Exclude<ImageStyle, 'random'> => {
    if (style === 'random') {
        return AVAILABLE_STYLES[Math.floor(secureRandom() * AVAILABLE_STYLES.length)] ?? 'botanical'
    }
    return style as Exclude<ImageStyle, 'random'>
}
