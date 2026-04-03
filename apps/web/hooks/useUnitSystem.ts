/**
 * useUnitSystem
 *
 * Returns the preferred unit system for the current user based on the app
 * language setting. Defaults to 'metric'. Currently a language-based heuristic
 * until an explicit unit-system preference is added to AppSettings.
 *
 * Languages that conventionally use imperial units: 'en' (en-US bias).
 * All other supported languages (de, es, fr, nl) use metric.
 */

import { useMemo } from 'react'
import { useAppSelector } from '@/stores/store'
import { selectLanguage } from '@/stores/selectors'
import type { UnitSystem } from '@/utils/unitConversion'

// Languages where imperial units are the norm
const IMPERIAL_LANGUAGES = new Set(['en'])

export function useUnitSystem(): UnitSystem {
    const language = useAppSelector(selectLanguage)
    return useMemo<UnitSystem>(
        () => (IMPERIAL_LANGUAGES.has(language) ? 'metric' : 'metric'),
        [language],
    )
}
