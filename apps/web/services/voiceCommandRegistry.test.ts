/**
 * Unit tests for voiceCommandRegistry utilities.
 *
 * Covers the pure utility functions this file imports -- levenshtein and
 * matchVoiceCommand -- which form the matching engine behind every voice command.
 * The buildVoiceCommands factory itself is not exercised here.
 */
import { describe, it, expect, vi } from 'vitest'
import { levenshtein, matchVoiceCommand } from '@/services/voiceCommandRegistry'
import type { VoiceCommandDef } from '@/services/voiceCommandRegistry'

// ---------------------------------------------------------------------------
// Fixture: minimal command set for matching tests
// ---------------------------------------------------------------------------

const makeCmd = (id: string, aliases: string[], keywords: string): VoiceCommandDef => ({
    id,
    group: 'test',
    label: id,
    aliases,
    keywords,
    action: vi.fn(),
})

const navPlantsCmd = makeCmd(
    'nav.plants',
    ['go to plants', 'zeige pflanzen'],
    'navigate plants view',
)
const navStrainsCmd = makeCmd(
    'nav.strains',
    ['go to strains', 'zeige sorten'],
    'navigate strains library',
)
const waterAllCmd = makeCmd('water.all', ['water all', 'alle giessen'], 'water all plants watering')
const searchCmd = makeCmd(
    'strain.search',
    ['search for', 'suche nach'],
    'search strain find lookup',
)
const ecoCmd = makeCmd(
    'eco.toggle',
    ['enable eco mode', 'eco modus'],
    'eco mode battery save toggle',
)

const TEST_COMMANDS: VoiceCommandDef[] = [
    navPlantsCmd,
    navStrainsCmd,
    waterAllCmd,
    searchCmd,
    ecoCmd,
]

// ---------------------------------------------------------------------------
// levenshtein
// ---------------------------------------------------------------------------

describe('levenshtein', () => {
    it('returns 0 for identical strings', () => {
        expect(levenshtein('hello', 'hello')).toBe(0)
    })

    it('returns string length for empty vs non-empty', () => {
        expect(levenshtein('', 'abc')).toBe(3)
        expect(levenshtein('abc', '')).toBe(3)
    })

    it('returns 0 for two empty strings', () => {
        expect(levenshtein('', '')).toBe(0)
    })

    it('computes single substitution', () => {
        expect(levenshtein('cat', 'bat')).toBe(1)
    })

    it('computes single insertion', () => {
        expect(levenshtein('cat', 'cats')).toBe(1)
    })

    it('computes single deletion', () => {
        expect(levenshtein('cats', 'cat')).toBe(1)
    })

    it('handles multi-character edits', () => {
        expect(levenshtein('kitten', 'sitting')).toBe(3)
    })

    it('is symmetric', () => {
        expect(levenshtein('abc', 'xyz')).toBe(levenshtein('xyz', 'abc'))
    })

    it('handles unicode cannabis-related terms', () => {
        // Common ASR misrecognitions for "VPD"
        expect(levenshtein('vpd', 'vpd')).toBe(0)
        expect(levenshtein('vpd', 'vpp')).toBe(1)
    })
})

// ---------------------------------------------------------------------------
// matchVoiceCommand — Pass 1: exact alias
// ---------------------------------------------------------------------------

describe('matchVoiceCommand — exact alias match', () => {
    it('matches a command whose alias starts the transcript', () => {
        const result = matchVoiceCommand('go to plants now', TEST_COMMANDS)
        expect(result?.id).toBe('nav.plants')
    })

    it('matches a German alias', () => {
        const result = matchVoiceCommand('zeige sorten', TEST_COMMANDS)
        expect(result?.id).toBe('nav.strains')
    })

    it('matches with trailing words after the alias', () => {
        const result = matchVoiceCommand('water all my plants please', TEST_COMMANDS)
        expect(result?.id).toBe('water.all')
    })

    it('returns null for a transcript that matches no command', () => {
        const result = matchVoiceCommand('open the fridge', TEST_COMMANDS)
        expect(result).toBeNull()
    })

    it('returns null for an empty transcript', () => {
        const result = matchVoiceCommand('', TEST_COMMANDS)
        expect(result).toBeNull()
    })

    it('matches the first alias in a list (priority)', () => {
        const result = matchVoiceCommand('go to strains', TEST_COMMANDS)
        expect(result?.id).toBe('nav.strains')
    })
})

// ---------------------------------------------------------------------------
// matchVoiceCommand — Pass 2: fuzzy alias (Levenshtein <= 2)
// ---------------------------------------------------------------------------

describe('matchVoiceCommand — fuzzy alias match', () => {
    it('matches a command with one typo in the alias prefix', () => {
        // "go to plnts" is distance 1 from "go to plants"
        const result = matchVoiceCommand('go to plnts', TEST_COMMANDS)
        expect(result?.id).toBe('nav.plants')
    })

    it('matches a command with two deletions in the alias prefix', () => {
        // "go to strain" (missing final 's') — distance 1 from "go to strains"
        const result = matchVoiceCommand('go to strain', TEST_COMMANDS)
        expect(result?.id).toBe('nav.strains')
    })

    it('does not match if edit distance exceeds 2', () => {
        // "xyz xyz" is far from all aliases
        const result = matchVoiceCommand('xyz xyz', TEST_COMMANDS)
        expect(result).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// matchVoiceCommand — Pass 3: keyword token match (2+ tokens required)
// ---------------------------------------------------------------------------

describe('matchVoiceCommand — keyword token match', () => {
    it('matches via keyword tokens when two or more tokens appear', () => {
        // "eco" and "battery" and "save" are in ecoCmd.keywords
        const result = matchVoiceCommand('please save battery in eco mode', TEST_COMMANDS)
        expect(result?.id).toBe('eco.toggle')
    })

    it('does not match when only one keyword token matches', () => {
        // "strains" alone is only 1 token for nav.strains (needs 2)
        const result = matchVoiceCommand('strains', TEST_COMMANDS)
        // single token match → null (threshold is 2)
        expect(result).toBeNull()
    })

    it('prefers the command with the most keyword matches', () => {
        // "navigate plants view" matches navPlantsCmd with 3 tokens
        // "navigate strains library" matches navStrainsCmd with 3 tokens
        // "navigate plants" should prefer navPlantsCmd since "plants" is unique to it
        const result = matchVoiceCommand('navigate to the plants view now', TEST_COMMANDS)
        expect(result?.id).toBe('nav.plants')
    })
})

// ---------------------------------------------------------------------------
// matchVoiceCommand — empty command registry
// ---------------------------------------------------------------------------

describe('matchVoiceCommand — edge cases', () => {
    it('returns null when command registry is empty', () => {
        expect(matchVoiceCommand('go to plants', [])).toBeNull()
    })

    it('handles commands with no keywords gracefully', () => {
        const cmdNoKeywords = makeCmd('bare', ['bare command'], '')
        expect(matchVoiceCommand('some random text', [cmdNoKeywords])).toBeNull()
    })

    it('handles commands with short keyword tokens (< 3 chars) gracefully', () => {
        // Tokens < 3 chars are filtered, so no match
        const cmdShortKw = makeCmd('short', ['short phrase'], 'a b c')
        expect(matchVoiceCommand('a b c d e', [cmdShortKw])).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// matchVoiceCommand — confirmation flag preserved
// ---------------------------------------------------------------------------

describe('matchVoiceCommand — requiresConfirmation passthrough', () => {
    it('returns a command that requires confirmation intact', () => {
        const confirmCmd: VoiceCommandDef = {
            ...makeCmd('danger', ['delete grow', 'delete plant'], 'delete remove grow plant'),
            requiresConfirmation: true,
        }
        const result = matchVoiceCommand('delete grow', [confirmCmd])
        expect(result?.requiresConfirmation).toBe(true)
        expect(result?.id).toBe('danger')
    })
})
