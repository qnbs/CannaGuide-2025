import { describe, it, expect, beforeEach } from 'vitest'
import {
    detectLanguageHeuristic,
    resetLanguageDetectionPipeline,
} from './localAiLanguageDetectionService'

// We test the heuristic path since the model requires actual Transformers.js runtime
// which isn't available in unit tests.

describe('localAiLanguageDetectionService', () => {
    beforeEach(() => {
        resetLanguageDetectionPipeline()
    })

    describe('detectLanguageHeuristic', () => {
        it('detects German text', () => {
            const result = detectLanguageHeuristic(
                'Die Pflanze hat gelbe Blätter und der pH-Wert ist zu niedrig.',
            )
            expect(result.language).toBe('de')
            expect(result.confidence).toBeGreaterThan(0.5)
            expect(result.method).toBe('heuristic')
        })

        it('detects English text', () => {
            const result = detectLanguageHeuristic(
                'The plant has yellow leaves and the pH level is too low.',
            )
            expect(result.language).toBe('en')
            expect(result.confidence).toBeGreaterThan(0.5)
            expect(result.method).toBe('heuristic')
        })

        it('returns unknown for empty input', () => {
            const result = detectLanguageHeuristic('')
            expect(result.language).toBe('unknown')
            expect(result.confidence).toBe(0)
        })

        it('detects German via umlaut characters', () => {
            const result = detectLanguageHeuristic('Überwässerung führt zu Wurzelfäule')
            expect(result.language).toBe('de')
        })

        it('handles short ambiguous input gracefully', () => {
            const result = detectLanguageHeuristic('ok')
            expect(['en', 'de', 'unknown']).toContain(result.language)
        })

        it('strips HTML via DOMPurify', () => {
            const result = detectLanguageHeuristic(
                '<script>alert("xss")</script>The plant is healthy and growing well.',
            )
            expect(result.language).toBe('en')
        })

        it('caps confidence below 1.0', () => {
            const result = detectLanguageHeuristic(
                'Die Pflanze ist gesund und wächst gut mit Licht und Wasser und Dünger',
            )
            expect(result.confidence).toBeLessThanOrEqual(0.95)
        })
    })
})
