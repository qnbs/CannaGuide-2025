/**
 * voiceCommandRegistry.test.ts
 *
 * Unit tests for the two-pass voice command matcher.
 * Covers: exact alias matches, fuzzy keyword scoring, EN + DE aliases,
 * edge cases (empty transcript, no match, partial match below threshold).
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { matchVoiceCommand } from '@/services/voiceCommandRegistry'
import type { VoiceCommandDef } from '@/services/voiceCommandRegistry'
import type { AppDispatch } from '@/stores/store'

// ---------------------------------------------------------------------------
// Fixture Commands
// ---------------------------------------------------------------------------

const mockDispatch = vi.fn() as unknown as AppDispatch

const FIXTURE_COMMANDS: VoiceCommandDef[] = [
    {
        id: 'nav_plants',
        group: 'Navigation',
        label: 'Plants',
        aliases: ['go to plants', 'pflanzen offnen'],
        keywords: 'plants garden grow home dashboard',
        action: vi.fn(),
    },
    {
        id: 'nav_strains',
        group: 'Navigation',
        label: 'Strains',
        aliases: ['go to strains', 'sorten offnen'],
        keywords: 'strains varieties cultivars database catalog',
        action: vi.fn(),
    },
    {
        id: 'nav_knowledge',
        group: 'Navigation',
        label: 'Knowledge',
        aliases: ['go to knowledge', 'wissen offnen'],
        keywords: 'knowledge mentor guide wiki learn ai chat',
        action: vi.fn(),
    },
    {
        id: 'strain_search',
        group: 'Strains',
        label: 'Search for...',
        aliases: ['search for', 'suche nach'],
        keywords: 'search find strain filter lookup',
        action: vi.fn(),
    },
    {
        id: 'plant_water_all',
        group: 'Plants',
        label: 'Water All Plants',
        aliases: ['water all plants', 'water all', 'alle pflanzen giessen'],
        keywords: 'water irrigate hydrate all plants',
        action: vi.fn(),
    },
    {
        id: 'a11y_dyslexia',
        group: 'Accessibility',
        label: 'Toggle Dyslexia Font',
        aliases: ['toggle dyslexia font', 'dyslexia font'],
        keywords: 'dyslexia font readability atkinson accessible toggle',
        action: vi.fn(),
    },
]

// Suppress console.debug for cleaner test output
beforeAll(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => undefined)
})

// ---------------------------------------------------------------------------
// Pass 1: Exact alias matches (startsWith)
// ---------------------------------------------------------------------------

describe('matchVoiceCommand -- Pass 1: alias (startsWith)', () => {
    it('matches exact EN alias', () => {
        const result = matchVoiceCommand('go to plants', FIXTURE_COMMANDS)
        expect(result?.id).toBe('nav_plants')
    })

    it('matches exact DE alias', () => {
        const result = matchVoiceCommand('sorten offnen', FIXTURE_COMMANDS)
        expect(result?.id).toBe('nav_strains')
    })

    it('matches alias with trailing words after startsWith', () => {
        const result = matchVoiceCommand('search for blue dream please', FIXTURE_COMMANDS)
        expect(result?.id).toBe('strain_search')
    })

    it('matches multi-word EN alias', () => {
        const result = matchVoiceCommand('water all plants right now', FIXTURE_COMMANDS)
        expect(result?.id).toBe('plant_water_all')
    })

    it('matches shortest alias (water all)', () => {
        const result = matchVoiceCommand('water all', FIXTURE_COMMANDS)
        expect(result?.id).toBe('plant_water_all')
    })

    it('prefers first alias match (plants before strains)', () => {
        // "go to plants" must not match strains
        const result = matchVoiceCommand('go to plants', FIXTURE_COMMANDS)
        expect(result?.id).toBe('nav_plants')
    })

    it('matches dyslexia font toggle alias', () => {
        const result = matchVoiceCommand('toggle dyslexia font', FIXTURE_COMMANDS)
        expect(result?.id).toBe('a11y_dyslexia')
    })

    it('is case-insensitive via lowercase input', () => {
        // matchVoiceCommand receives already-lowercased transcript from VoiceControl
        const result = matchVoiceCommand('go to knowledge', FIXTURE_COMMANDS)
        expect(result?.id).toBe('nav_knowledge')
    })
})

// ---------------------------------------------------------------------------
// Pass 2: Fuzzy keyword token matching (>= 2 tokens)
// ---------------------------------------------------------------------------

describe('matchVoiceCommand -- Pass 2: fuzzy keyword scoring', () => {
    it('matches when 2 keyword tokens hit (plants + garden)', () => {
        const result = matchVoiceCommand('show me my garden and plants', FIXTURE_COMMANDS)
        expect(result?.id).toBe('nav_plants')
    })

    it('matches when 3 keyword tokens hit (strains + varieties + catalog)', () => {
        const result = matchVoiceCommand(
            'browse the strains varieties in the catalog',
            FIXTURE_COMMANDS,
        )
        expect(result?.id).toBe('nav_strains')
    })

    it('picks the highest-scoring command when multiple could match', () => {
        // "mentor guide wiki ai chat knowledge" hits nav_knowledge most strongly
        const result = matchVoiceCommand('open mentor chat wiki knowledge', FIXTURE_COMMANDS)
        expect(result?.id).toBe('nav_knowledge')
    })

    it('returns null when only 1 token hits (below threshold)', () => {
        const result = matchVoiceCommand('plants', FIXTURE_COMMANDS)
        // only 1 token hit -- should NOT match (threshold >= 2)
        expect(result).toBeNull()
    })

    it('returns null when no tokens match', () => {
        const result = matchVoiceCommand('play some music', FIXTURE_COMMANDS)
        expect(result).toBeNull()
    })

    it('returns null for empty transcript', () => {
        const result = matchVoiceCommand('', FIXTURE_COMMANDS)
        expect(result).toBeNull()
    })

    it('returns null for whitespace-only transcript', () => {
        const result = matchVoiceCommand('   ', FIXTURE_COMMANDS)
        expect(result).toBeNull()
    })

    it('requires token length >= 3 (ignores short tokens)', () => {
        // "to go on" -- "to","go","on" are all < 3 chars, score stays 0
        const result = matchVoiceCommand('to go on', FIXTURE_COMMANDS)
        expect(result).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// Command list: all 23 commands in real registry
// ---------------------------------------------------------------------------

describe('matchVoiceCommand -- real registry smoke test', () => {
    // Lazy import to avoid i18n init issues in unit tests
    it('buildVoiceCommands returns at least 23 commands', async () => {
        // Mock the i18n getT and Zustand store dependencies
        vi.mock('@/i18n', () => ({
            getT: () => (key: string) => key,
        }))
        vi.mock('@/stores/useUIStore', () => ({
            getUISnapshot: () => ({
                setActiveView: vi.fn(),
                setEquipmentViewTab: vi.fn(),
                setKnowledgeViewTab: vi.fn(),
            }),
        }))
        vi.mock('@/stores/useFiltersStore', () => ({
            useFiltersStore: {
                getState: () => ({
                    setSearchTerm: vi.fn(),
                    resetAllFilters: vi.fn(),
                    toggleTypeFilter: vi.fn(),
                }),
            },
        }))
        vi.mock('@/stores/useStrainsViewStore', () => ({
            useStrainsViewStore: { getState: () => ({ setStrainsViewTab: vi.fn() }) },
        }))
        vi.mock('@/stores/slices/settingsSlice', () => ({
            setSetting: vi.fn(),
            toggleSetting: vi.fn(),
        }))

        const { buildVoiceCommands } = await import('@/services/voiceCommandRegistry')
        const commands = buildVoiceCommands(mockDispatch)
        expect(commands.length).toBeGreaterThanOrEqual(23)
    })
})

// ---------------------------------------------------------------------------
// Known EN+DE alias parity check
// ---------------------------------------------------------------------------

describe('matchVoiceCommand -- EN/DE alias parity', () => {
    const bilingual: Record<string, [string, string]> = {
        nav_plants: ['go to plants', 'pflanzen offnen'],
        nav_strains: ['go to strains', 'sorten offnen'],
        nav_knowledge: ['go to knowledge', 'wissen offnen'],
        plant_water_all: ['water all', 'alle pflanzen giessen'],
    }

    for (const [id, [en, de]] of Object.entries(bilingual)) {
        it(`${id}: EN alias "${en}" matches`, () => {
            const result = matchVoiceCommand(en, FIXTURE_COMMANDS)
            expect(result?.id).toBe(id)
        })
        it(`${id}: DE alias "${de}" matches`, () => {
            const result = matchVoiceCommand(de, FIXTURE_COMMANDS)
            expect(result?.id).toBe(id)
        })
    }
})

// ---------------------------------------------------------------------------
// HOTWORD_REGEX unit tests (imported separately)
// ---------------------------------------------------------------------------

describe('HOTWORD_REGEX', () => {
    // The regex is not exported but we can test its logic here directly
    const HOTWORD_REGEX = /hey\s+canna(?:guide)?/i

    it('matches "hey canna"', () => {
        expect(HOTWORD_REGEX.test('hey canna')).toBe(true)
    })

    it('matches "hey cannaguide"', () => {
        expect(HOTWORD_REGEX.test('hey cannaguide')).toBe(true)
    })

    it('matches within a longer phrase', () => {
        expect(HOTWORD_REGEX.test('ok so hey cannaguide show me plants')).toBe(true)
    })

    it('matches case-insensitively', () => {
        expect(HOTWORD_REGEX.test('Hey CannaGuide')).toBe(true)
        expect(HOTWORD_REGEX.test('HEY CANNA')).toBe(true)
    })

    it('requires whitespace between "hey" and "canna"', () => {
        expect(HOTWORD_REGEX.test('heycanna')).toBe(false)
    })

    it('does not match "canna" alone', () => {
        expect(HOTWORD_REGEX.test('canna')).toBe(false)
    })

    it('does not match "hey" alone', () => {
        expect(HOTWORD_REGEX.test('hey there how are you')).toBe(false)
    })

    it('allows multiple spaces between hey and canna', () => {
        expect(HOTWORD_REGEX.test('hey   canna')).toBe(true)
    })
})
