import type { ImageStyle } from '@/types/aiProvider'
import DOMPurify from 'dompurify'
import { secureRandom } from '@/utils/random'

/**
 * Text for SVG: markup stripped, then XML-escaped exactly once. DOMPurify returns a string
 * without `<` as it is but serializes any other with entities, so escaping its string output
 * double-escaped `8<9` to `8&amp;lt;9`; reading the sanitized text avoids that.
 */
const sanitizedText = (value: string): string =>
    DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [], RETURN_DOM_FRAGMENT: true })
        .textContent ?? ''

export const escapeXml = (value: string): string =>
    sanitizedText(value)
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
