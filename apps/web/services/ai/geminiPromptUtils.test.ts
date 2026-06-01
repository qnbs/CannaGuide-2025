import { describe, expect, it } from 'vitest'
import {
    createLocalizedPrompt,
    MAX_PROMPT_CHARS,
    summarizeJournalForPrompt,
    truncatePromptForModel,
} from '@/services/ai/geminiPromptUtils'

describe('truncatePromptForModel', () => {
    it('returns short prompts unchanged', () => {
        expect(truncatePromptForModel('hello')).toBe('hello')
    })

    it('truncates long prompts with marker', () => {
        const long = 'a'.repeat(MAX_PROMPT_CHARS + 100)
        const out = truncatePromptForModel(long)
        expect(out).toContain('[...context truncated to fit token window...]')
        expect(out.length).toBeLessThan(long.length)
    })
})

describe('createLocalizedPrompt', () => {
    it('includes German instruction for de', () => {
        const out = createLocalizedPrompt('Base prompt', 'de')
        expect(out).toContain('Deutsch')
        expect(out).toContain('Base prompt')
    })
})

describe('summarizeJournalForPrompt', () => {
    it('handles empty journal', () => {
        expect(summarizeJournalForPrompt([])).toBe('No journal entries available.')
    })
})
