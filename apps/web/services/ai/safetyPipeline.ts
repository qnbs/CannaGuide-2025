/**
 * Central AI input safety pipeline (S-01).
 * Used by geminiService and other cloud AI entry points.
 */
import DOMPurify from 'dompurify'

const ALLOWED_INPUT_CHARS = /[^a-zA-Z0-9\s.,;:!?'"()\-/@#%&*+=\n\u00C0-\u00FF\u0100-\u017F]/g

const normalizeInputStructure = (input: string): string => {
    let s = input.normalize('NFC')
    s = normalizeHomoglyphs(s)
    s = s.replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD\u180E]/g, '')
    // eslint-disable-next-line no-control-regex
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, ' ')
    s = s.replace(/\n{4,}/g, '\n\n')
    return s
}

const HOMOGLYPH_MAP: Record<string, string> = {
    '\u0410': 'A',
    '\u0430': 'a',
    '\u0412': 'B',
    '\u0432': 'b',
    '\u0421': 'C',
    '\u0441': 'c',
    '\u0415': 'E',
    '\u0435': 'e',
    '\u041D': 'H',
    '\u043D': 'h',
    '\u041A': 'K',
    '\u043A': 'k',
    '\u041C': 'M',
    '\u043C': 'm',
    '\u041E': 'O',
    '\u043E': 'o',
    '\u0420': 'P',
    '\u0440': 'p',
    '\u0422': 'T',
    '\u0442': 't',
    '\u0425': 'X',
    '\u0445': 'x',
    '\u0423': 'Y',
    '\u0443': 'y',
    '\u0391': 'A',
    '\u03B1': 'a',
    '\u0392': 'B',
    '\u03B2': 'b',
    '\u0395': 'E',
    '\u03B5': 'e',
    '\u0397': 'H',
    '\u03B7': 'h',
    '\u0399': 'I',
    '\u03B9': 'i',
    '\u039A': 'K',
    '\u03BA': 'k',
    '\u039C': 'M',
    '\u03BC': 'm',
    '\u039D': 'N',
    '\u03BD': 'n',
    '\u039F': 'O',
    '\u03BF': 'o',
    '\u03A1': 'P',
    '\u03C1': 'p',
    '\u03A4': 'T',
    '\u03C4': 't',
    '\u03A7': 'X',
    '\u03C7': 'x',
    '\uFF21': 'A',
    '\uFF41': 'a',
    '\uFF25': 'E',
    '\uFF45': 'e',
    '\uFF29': 'I',
    '\uFF49': 'i',
    '\uFF2F': 'O',
    '\uFF4F': 'o',
    '\uFF35': 'U',
    '\uFF55': 'u',
    '\u2010': '-',
    '\u2011': '-',
    '\u2012': '-',
    '\u2013': '-',
    '\u2014': '-',
    '\u2018': "'",
    '\u2019': "'",
    '\u201C': '"',
    '\u201D': '"',
}

const HOMOGLYPH_REGEX = new RegExp('[' + Object.keys(HOMOGLYPH_MAP).join('') + ']', 'g')

const normalizeHomoglyphs = (input: string): string =>
    input.replace(HOMOGLYPH_REGEX, (ch) => HOMOGLYPH_MAP[ch] ?? ch)

const INJECTION_PATTERNS: RegExp[] = [
    /ignore\s+(previous|all\s+previous|prior)\s+(instructions?|prompts?|context)/gi,
    /disregard\s+(previous|all|the|your|prior)/gi,
    /forget\s+(everything|all|the\s+above|previous)/gi,
    /override\s+(all|your|the|previous)\s+(instructions?|rules?|guidelines?)/gi,
    /new\s+instructions?\s*:/gi,
    /you\s+are\s+now\s+(a|an|the)\s+/gi,
    /act\s+as\s+(if|though)\s+you\s+(have\s+)?no\s+(rules|restrictions|guidelines)/gi,
    /enter\s+(developer|debug|admin|god)\s+mode/gi,
    /<\|.*?\|>/g,
    /\[\/?INST\]/gi,
    /<<\/?SYS>>/gi,
    /<\/?(?:system|user|assistant|human|function|tool)>/gi,
    /^(system|assistant|human|user)\s*:/gim,
    /^(###?\s*(system|assistant|human|user))\s*$/gim,
    /repeat\s+(the|your|all|above|previous)\s+(prompt|instructions?|system)/gi,
    /print\s+(the|your)\s+(system\s+)?prompt/gi,
    /show\s+(me\s+)?(the|your)\s+(system|hidden|internal)\s+(prompt|instructions?)/gi,
    /what\s+(are|were)\s+(your|the)\s+(system\s+)?(instructions?|prompt|rules)/gi,
    /data:\s{0,10}[a-z]+\/[a-z0-9.+-]+\s{0,10};?\s{0,10}base64\s{0,10},/gi,
    /\\u[0-9a-f]{4}/gi,
    /\\x[0-9a-f]{2}/gi,
    /<!\[CDATA\[/gi,
    /&#x?[0-9a-f]+;/gi,
    /```\s*(system|prompt|instructions?|config)/gi,
]

const ALLOWED_TOPIC_PATTERNS: RegExp[] = [
    /\b(cannabis|marijuana|hemp|weed|grow|plant|seed|strain|bud|flower|trichome)\b/i,
    /\b(seedling|vegetative|veg|flowering|bloom|harvest|clone|cutting|germination|curing|drying)\b/i,
    /\b(light|led|hps|cfl|temperature|temp|humidity|vpd|co2|ventilation|fan|air|soil|coco|hydro|perlite|medium|substrate|indoor|outdoor|greenhouse|tent)\b/i,
    /\b(nutrient|fertilizer|npk|nitrogen|phosphorus|potassium|calcium|magnesium|iron|ph|ec|ppm|feed|water|flush|compost|organic|amendment)\b/i,
    /\b(pest|mold|mildew|rot|deficiency|toxicity|overwater|underwater|stress|lollipop|top|prune|train|lst|hst|scrog|sog|defoliat)\b/i,
    /\b(indica|sativa|hybrid|autoflower|photoperiod|thc|cbd|terpene|yield|potency|aroma|flavor|breeder|genetics|phenotype)\b/i,
    /\b(pot|container|fabric|timer|pump|reservoir|dripper|trellis|net|filter|carbon|exhaust|intake|ballast|driver|dimmer|sensor|meter|scope)\b/i,
    /\b(root|leaf|leaves|stem|branch|node|internode|pistil|calyx|resin|trichome|amber|milky|clear)\b/i,
    /\b(hello|hi|help|what|how|why|when|where|which|can|should|recommend|suggest|advice|tip|guide|best|compare)\b/i,
]

/**
 * Sanitize user text before LLM prompt interpolation (5-layer defense).
 */
export const sanitizeForPrompt = (input: string, maxLength = 500): string => {
    const stripped = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    const normalized = normalizeInputStructure(stripped)
    let clean = normalized.replace(ALLOWED_INPUT_CHARS, '')
    for (const pattern of INJECTION_PATTERNS) {
        clean = clean.replace(pattern, '[redacted]')
    }
    return clean.slice(0, maxLength).trim()
}

/** Soft topic guard — off-topic prompts get redirect, not hard block. */
export const isTopicRelevant = (input: string): boolean => {
    if (input.length < 20) return true
    return ALLOWED_TOPIC_PATTERNS.some((pattern) => pattern.test(input))
}
