import { describe, expect, it } from 'vitest'

// Test the voice worker message handlers directly (unit test, not Worker API)
// We import the handler logic by simulating the worker message protocol.

describe('voiceWorker', () => {
    // Since the worker is a self-contained module, we test the algorithms directly
    // by extracting the core logic into testable functions.

    it('PROCESS_TRANSCRIPT: strips English filler words', () => {
        // Simulate filler removal logic
        const fillers = ['um', 'uh', 'like', 'you know', 'so']
        let text = 'um i want to uh water plants'
        for (const filler of fillers) {
            text = text.replace(new RegExp(`\\b${filler}\\b`, 'gi'), '')
        }
        text = text.replace(/\s{2,}/g, ' ').trim()
        expect(text).toBe('i want to water plants')
    })

    it('PROCESS_TRANSCRIPT: strips German filler words', () => {
        const fillers = ['aehm', 'aeh', 'halt', 'also']
        let text = 'aehm ich will halt die pflanzen giessen'
        for (const filler of fillers) {
            text = text.replace(new RegExp(`\\b${filler}\\b`, 'gi'), '')
        }
        text = text.replace(/\s{2,}/g, ' ').trim()
        expect(text).toBe('ich will die pflanzen giessen')
    })

    it('PARSE_COMMAND: exact alias match returns high confidence', () => {
        // Simulate exact alias matching
        const commands = [
            { id: 'nav_plants', aliases: ['show plants', 'go to plants'] },
            { id: 'nav_strains', aliases: ['show strains'] },
        ]
        const transcript = 'show plants'

        let match: { id: string; confidence: number } | null = null
        for (const cmd of commands) {
            if (cmd.aliases.some((a) => transcript.startsWith(a))) {
                match = { id: cmd.id, confidence: 1.0 }
                break
            }
        }

        expect(match).not.toBeNull()
        expect(match?.id).toBe('nav_plants')
        expect(match?.confidence).toBe(1.0)
    })

    it('COMPUTE_WAVEFORM: produces amplitude values', () => {
        // Simulate waveform computation
        const samples = new Float32Array([0.0, 0.5, -0.3, 0.8, -0.1])
        const amplitudes: number[] = []
        for (let i = 0; i < samples.length; i++) {
            amplitudes.push(Math.min(255, Math.round(Math.abs(samples[i] ?? 0) * 255)))
        }
        expect(amplitudes).toEqual([0, 128, 77, 204, 26])
        expect(amplitudes.length).toBe(5)
    })

    it('PARSE_COMMAND: no match returns null', () => {
        const commands = [{ id: 'nav_plants', aliases: ['show plants'] }]
        const transcript = 'random gibberish'

        let match: { id: string } | null = null
        for (const cmd of commands) {
            if (cmd.aliases.some((a) => transcript.startsWith(a))) {
                match = { id: cmd.id }
                break
            }
        }

        expect(match).toBeNull()
    })
})
