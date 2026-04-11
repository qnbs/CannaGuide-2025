// ---------------------------------------------------------------------------
// Voice Worker -- Off-Main-Thread Processing (v1.8 CannaVoice Pro)
// ---------------------------------------------------------------------------
// Handles CPU-intensive voice tasks: command matching (Levenshtein),
// transcript normalization, and waveform computation.
// Registered with WorkerBus as 'voice' worker.
// ---------------------------------------------------------------------------

import { initAbortHandler } from '@/utils/workerAbort'

/** Serializable command definition for off-main-thread matching. */
interface SerializedCommand {
    id: string
    aliases: string[]
    keywords: string
}

interface ParseCommandPayload {
    transcript: string
    commands: SerializedCommand[]
}

interface ParseCommandResult {
    commandId: string | null
    confidence: number
    matchType: 'exact' | 'fuzzy' | 'keyword' | 'none'
}

interface ProcessTranscriptPayload {
    transcript: string
    lang: string
}

interface ProcessTranscriptResult {
    cleaned: string
    detectedLang: string
}

interface ComputeWaveformPayload {
    samples: Float32Array
    barCount: number
}

interface ComputeWaveformResult {
    amplitudes: Uint8Array
}

// ---------------------------------------------------------------------------
// Levenshtein distance (DP, O(n*m))
// ---------------------------------------------------------------------------
function levenshtein(a: string, b: string): number {
    const la = a.length
    const lb = b.length
    if (la === 0) return lb
    if (lb === 0) return la

    const dp: number[][] = []
    for (let i = 0; i <= la; i++) {
        dp[i] = [i]
    }
    for (let j = 0; j <= lb; j++) {
        const row = dp[0]
        if (row) row[j] = j
    }

    for (let i = 1; i <= la; i++) {
        for (let j = 1; j <= lb; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            const prevRow = dp[i - 1]
            const currRow = dp[i]
            if (prevRow && currRow) {
                currRow[j] = Math.min(
                    (prevRow[j] ?? 0) + 1, // deletion
                    (currRow[j - 1] ?? 0) + 1, // insertion
                    (prevRow[j - 1] ?? 0) + cost, // substitution
                )
            }
        }
    }

    return dp[la]?.[lb] ?? Math.max(la, lb)
}

// ---------------------------------------------------------------------------
// Command matching (3-pass: exact alias, fuzzy alias, keyword scoring)
// ---------------------------------------------------------------------------
function parseCommand(payload: ParseCommandPayload): ParseCommandResult {
    const transcript = payload.transcript.toLowerCase().trim()
    if (!transcript) return { commandId: null, confidence: 0, matchType: 'none' }

    // Pass 1: Exact alias match (startsWith)
    for (const cmd of payload.commands) {
        for (const alias of cmd.aliases) {
            if (transcript.startsWith(alias.toLowerCase())) {
                return { commandId: cmd.id, confidence: 1.0, matchType: 'exact' }
            }
        }
    }

    // Pass 2: Fuzzy alias match (Levenshtein <= 2)
    let bestFuzzy: ParseCommandResult = { commandId: null, confidence: 0, matchType: 'none' }
    let bestDistance = 3 // threshold

    for (const cmd of payload.commands) {
        for (const alias of cmd.aliases) {
            const dist = levenshtein(transcript, alias.toLowerCase())
            if (dist < bestDistance) {
                bestDistance = dist
                bestFuzzy = {
                    commandId: cmd.id,
                    confidence: 1.0 - dist * 0.3,
                    matchType: 'fuzzy',
                }
            }
        }
    }

    if (bestFuzzy.commandId) return bestFuzzy

    // Pass 3: Keyword scoring (>= 2 tokens match)
    let bestKeyword: ParseCommandResult = { commandId: null, confidence: 0, matchType: 'none' }
    let bestScore = 0

    for (const cmd of payload.commands) {
        const tokens = cmd.keywords
            .toLowerCase()
            .split(/\s+/)
            .filter((t) => t.length >= 3)
        let score = 0
        for (const token of tokens) {
            if (transcript.includes(token)) score++
        }
        if (score >= 2 && score > bestScore) {
            bestScore = score
            bestKeyword = {
                commandId: cmd.id,
                confidence: Math.min(1.0, score / tokens.length),
                matchType: 'keyword',
            }
        }
    }

    return bestKeyword
}

// ---------------------------------------------------------------------------
// Transcript processing (filler word removal, normalization)
// ---------------------------------------------------------------------------
const FILLER_WORDS: Record<string, string[]> = {
    en: ['um', 'uh', 'er', 'ah', 'like', 'you know', 'basically', 'so yeah'],
    de: ['aehm', 'aeh', 'hm', 'also', 'halt', 'sozusagen', 'quasi', 'irgendwie'],
    es: ['eh', 'pues', 'bueno', 'este', 'o sea'],
    fr: ['euh', 'ben', 'bah', 'genre', 'quoi'],
    nl: ['ehm', 'uh', 'nou', 'zeg maar', 'eigenlijk'],
}

/** Simple language detection from transcript content. */
function detectLanguage(text: string): string {
    const lower = text.toLowerCase()
    const deMarkers = ['der', 'die', 'das', 'und', 'ist', 'ein', 'ich', 'nicht']
    const esMarkers = ['el', 'los', 'las', 'una', 'que', 'por', 'como']
    const frMarkers = ['le', 'les', 'une', 'des', 'que', 'pour', 'avec']
    const nlMarkers = ['de', 'het', 'een', 'van', 'dat', 'voor', 'maar']

    const words = lower.split(/\s+/)
    let deScore = 0,
        esScore = 0,
        frScore = 0,
        nlScore = 0

    for (const w of words) {
        if (deMarkers.includes(w)) deScore++
        if (esMarkers.includes(w)) esScore++
        if (frMarkers.includes(w)) frScore++
        if (nlMarkers.includes(w)) nlScore++
    }

    const max = Math.max(deScore, esScore, frScore, nlScore)
    if (max === 0) return 'en'
    if (max === deScore) return 'de'
    if (max === esScore) return 'es'
    if (max === frScore) return 'fr'
    return 'nl'
}

function processTranscript(payload: ProcessTranscriptPayload): ProcessTranscriptResult {
    let cleaned = payload.transcript.trim()

    // Remove filler words for detected/specified language
    const lang = payload.lang || detectLanguage(cleaned)
    const fillers = FILLER_WORDS[lang] ?? FILLER_WORDS.en ?? []

    for (const filler of fillers) {
        // Word-boundary removal (case-insensitive)
        const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
        cleaned = cleaned.replace(regex, '')
    }

    // Normalize whitespace
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim()

    return {
        cleaned,
        detectedLang: lang,
    }
}

// ---------------------------------------------------------------------------
// Waveform computation (audio samples -> bar amplitudes)
// ---------------------------------------------------------------------------
function computeWaveform(payload: ComputeWaveformPayload): ComputeWaveformResult {
    const { samples, barCount } = payload
    const amplitudes = new Uint8Array(barCount)

    if (samples.length === 0) return { amplitudes }

    const samplesPerBar = Math.floor(samples.length / barCount)
    if (samplesPerBar === 0) return { amplitudes }

    for (let i = 0; i < barCount; i++) {
        let sum = 0
        const offset = i * samplesPerBar
        for (let j = 0; j < samplesPerBar; j++) {
            const sample = samples[offset + j]
            sum += sample !== undefined ? Math.abs(sample) : 0
        }
        // Normalize to 0-255 range
        const avg = sum / samplesPerBar
        amplitudes[i] = Math.min(255, Math.round(avg * 255 * 4))
    }

    return { amplitudes }
}

// ---------------------------------------------------------------------------
// Security: origin check
// ---------------------------------------------------------------------------

const isTrustedWorkerMessage = (event: MessageEvent<unknown>): boolean => {
    return !event.origin || event.origin === self.location.origin
}

// ---------------------------------------------------------------------------
// Message handler (WorkerBus protocol)
// ---------------------------------------------------------------------------
interface WorkerMessage {
    messageId: string
    type: string
    payload: unknown
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    // Security: reject messages from untrusted origins
    if (!isTrustedWorkerMessage(event)) return

    // Security: ignore messages without expected structure
    const { messageId, type, payload } = event.data
    if (!messageId || !type) return

    try {
        let data: unknown

        /* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- worker message dispatch requires payload narrowing */
        switch (type) {
            case 'PARSE_COMMAND':
                data = parseCommand(payload as ParseCommandPayload)
                break
            case 'PROCESS_TRANSCRIPT':
                data = processTranscript(payload as ProcessTranscriptPayload)
                break
            case 'COMPUTE_WAVEFORM': {
                const waveformResult = computeWaveform(payload as ComputeWaveformPayload)
                // Transfer the Uint8Array buffer back (zero-copy)
                self.postMessage(
                    { messageId, success: true, data: waveformResult },
                    {
                        transfer: [waveformResult.amplitudes.buffer],
                    },
                )
                return
            }
            default:
                self.postMessage({
                    messageId,
                    success: false,
                    error: `Unknown message type: ${type}`,
                    errorCode: 'INVALID_PAYLOAD',
                })
                return
        }
        /* eslint-enable @typescript-eslint/no-unsafe-type-assertion */

        self.postMessage({ messageId, success: true, data })
    } catch (err) {
        self.postMessage({
            messageId,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            errorCode: 'EXECUTION_ERROR',
        })
    }
}

// W-02.1: Install cooperative abort handler (must be after self.onmessage)
initAbortHandler()
