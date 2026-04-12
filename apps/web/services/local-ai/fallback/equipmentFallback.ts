// ---------------------------------------------------------------------------
// equipmentFallback.ts -- Heuristic equipment recommendation builder
// ---------------------------------------------------------------------------
// Extracted from fallbackService.ts to isolate equipment domain logic.
// ---------------------------------------------------------------------------

import type { Recommendation, RecommendationItem, Language } from '@/types'

const isGerman = (lang: Language): boolean => lang === 'de'

const makeRecommendationItem = (
    name: string,
    price: number,
    rationale: string,
    watts?: number,
): RecommendationItem => ({
    name,
    price,
    rationale,
    ...(typeof watts === 'number' ? { watts } : {}),
})

interface LocalizedItem {
    en: { name: string; price: number }
    de: { name: string; price: number }
}

const getTentConfig = (isLarge: boolean, isBudget: boolean): LocalizedItem => {
    if (isLarge) {
        return {
            en: { name: '120x120x200 cm grow tent', price: isBudget ? 150 : 220 },
            de: { name: '120x120x200 cm Grow-Zelt', price: isBudget ? 150 : 220 },
        }
    }

    return {
        en: { name: '100x100x200 cm grow tent', price: isBudget ? 110 : 180 },
        de: { name: '100x100x200 cm Grow-Zelt', price: isBudget ? 110 : 180 },
    }
}

const getVentilationName = (wantsSmellControl: boolean, isSilent: boolean): string => {
    if (wantsSmellControl) {
        return isSilent ? 'Silent inline fan with carbon filter' : 'Inline fan with carbon filter'
    }

    return isSilent ? 'Low-noise inline exhaust fan' : 'Inline exhaust fan'
}

const getVentilationRationale = (
    wantsSmellControl: boolean,
    isSilent: boolean,
    lang: Language,
): string => {
    if (wantsSmellControl) {
        return isGerman(lang)
            ? 'Geruchsmanagement ist wichtig, daher mit Aktivkohlefilter planen.'
            : 'Odor control matters here, so a carbon filter is included.'
    }

    if (isSilent) {
        return isGerman(lang)
            ? 'Leiser Luftaustausch reduziert St\u00f6rungen im Alltag.'
            : 'Low-noise extraction keeps the room manageable in daily use.'
    }

    return isGerman(lang)
        ? 'Solider Luftaustausch h\u00e4lt Temperatur und Feuchte stabil.'
        : 'Solid airflow keeps temperature and humidity stable.'
}

const getSoilName = (prefersCoco: boolean, prefersSoil: boolean, lang: Language): string => {
    if (prefersCoco) {
        return isGerman(lang) ? 'Coco-Blend Substrat' : 'Coco blend substrate'
    }

    if (prefersSoil) {
        return isGerman(lang) ? 'Lebendige Blumenerde' : 'Living soil mix'
    }

    return isGerman(lang) ? 'Hochwertige Grow-Erde' : 'Quality grow soil'
}

const getNutrientName = (prefersCoco: boolean, isAuto: boolean, lang: Language): string => {
    if (prefersCoco) {
        return isGerman(lang)
            ? 'Coco-geeigneter Basised\u00fcnger'
            : 'Coco-friendly base nutrient kit'
    }

    if (isAuto) {
        return isGerman(lang)
            ? 'Sanfte Bl\u00fcted\u00fcngung f\u00fcr Autos'
            : 'Gentle bloom nutrients for autos'
    }

    return isGerman(lang) ? 'Ausgewogener Basised\u00fcnger' : 'Balanced base nutrient kit'
}

const getExtraName = (wantsSmellControl: boolean, isBudget: boolean, lang: Language): string => {
    if (wantsSmellControl) {
        return isGerman(lang) ? 'Aktivkohlefilter-Upgrade' : 'Carbon filter upgrade'
    }

    if (isBudget) {
        return isGerman(lang)
            ? 'Thermo-Hygrometer mit Min/Max'
            : 'Thermo-hygrometer with min/max memory'
    }

    return isGerman(lang) ? 'pH- und EC-Messset' : 'pH and EC meter set'
}

interface EquipmentPromptFlags {
    isBudget: boolean
    isLarge: boolean
    isSilent: boolean
    wantsSmellControl: boolean
    prefersSoil: boolean
    prefersCoco: boolean
    isAuto: boolean
}

const parseEquipmentPromptFlags = (prompt: string): EquipmentPromptFlags => {
    const normalized = prompt.toLowerCase().slice(0, 2000)

    return {
        isBudget: /budget|cheap|starter|entry|einsteiger|g\u00fcnstig|preiswert/.test(normalized),
        isLarge: /4x4|5x5|gro\u00df|large|mehrere pflanzen|multiple plants/.test(normalized),
        isSilent: /silent|quiet|leise/.test(normalized),
        wantsSmellControl: /smell|odor|geruch|filter|carbon/.test(normalized),
        prefersSoil: /soil|erde|living soil|organic/.test(normalized),
        prefersCoco: /coco|kokos/.test(normalized),
        isAuto: /autoflower|autoflowering|autoflowern?/.test(normalized),
    }
}

const resolveLightSetup = (flags: EquipmentPromptFlags): { watts: number; name: string } => {
    let watts = 300
    if (flags.isLarge) {
        watts = flags.isBudget ? 320 : 450
    } else if (flags.isBudget) {
        watts = 200
    }

    return {
        watts,
        name: flags.isBudget
            ? `${watts}W full-spectrum LED`
            : `${watts}W dimmable full-spectrum LED`,
    }
}

const resolveVentilationPrice = (flags: EquipmentPromptFlags): number => {
    if (flags.wantsSmellControl) {
        return flags.isBudget ? 170 : 260
    }

    return flags.isBudget ? 120 : 190
}

const bilingual = (lang: Language, de: string, en: string): string => (isGerman(lang) ? de : en)

export const buildEquipmentRecommendation = (prompt: string, lang: Language): Recommendation => {
    const flags = parseEquipmentPromptFlags(prompt)
    const tent = getTentConfig(flags.isLarge, flags.isBudget)
    const lightSetup = resolveLightSetup(flags)
    const ventilationName = getVentilationName(flags.wantsSmellControl, flags.isSilent)
    const ventilationRationale = getVentilationRationale(
        flags.wantsSmellControl,
        flags.isSilent,
        lang,
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const tentItem = tent[lang as 'en' | 'de'] ?? tent['en']

    return {
        tent: makeRecommendationItem(
            tentItem.name,
            tentItem.price,
            bilingual(
                lang,
                'Ein Zelt in dieser Gr\u00f6\u00dfe gibt genug Platz f\u00fcr Klima, Licht und Wartung.',
                'This tent size gives enough room for climate control, lighting, and maintenance.',
            ),
        ),
        light: makeRecommendationItem(
            lightSetup.name,
            flags.isBudget ? 180 : 320,
            bilingual(
                lang,
                'Vollspektrum-LED ist effizient, dimmbar und f\u00fcr die meisten Setups flexibel.',
                'A full-spectrum LED is efficient, dimmable, and flexible for most grows.',
            ),
            lightSetup.watts,
        ),
        ventilation: makeRecommendationItem(
            ventilationName,
            resolveVentilationPrice(flags),
            ventilationRationale,
        ),
        circulationFan: makeRecommendationItem(
            bilingual(lang, 'Clip-Ventilator', 'Clip-on circulation fan'),
            flags.isBudget ? 25 : 45,
            bilingual(
                lang,
                'Ein kleiner Umluftventilator verhindert stehende Luft und st\u00e4rkt die St\u00e4ngel.',
                'A small circulation fan prevents stale pockets and strengthens stems.',
            ),
        ),
        pots: makeRecommendationItem(
            bilingual(lang, 'Stofft\u00f6pfe 11 L', '11 L fabric pots'),
            flags.isBudget ? 30 : 45,
            bilingual(
                lang,
                'Stofft\u00f6pfe verbessern die Bel\u00fcftung im Wurzelraum und reduzieren \u00dcberw\u00e4sserungsrisiken.',
                'Fabric pots improve root-zone aeration and reduce overwatering risk.',
            ),
        ),
        soil: makeRecommendationItem(
            getSoilName(flags.prefersCoco, flags.prefersSoil, lang),
            flags.isBudget ? 35 : 55,
            flags.prefersCoco
                ? bilingual(
                      lang,
                      'Coco ist schnell reagierend und eignet sich gut f\u00fcr pr\u00e4zise F\u00fctterung.',
                      'Coco responds quickly and suits precise feeding.',
                  )
                : bilingual(
                      lang,
                      'Eine gute Erde verzeiht Fehler und ist f\u00fcr gemischte Setups am einfachsten.',
                      'A good soil mix is forgiving and easiest for mixed setups.',
                  ),
        ),
        nutrients: makeRecommendationItem(
            getNutrientName(flags.prefersCoco, flags.isAuto, lang),
            flags.isBudget ? 35 : 70,
            bilingual(
                lang,
                'Beginne mit einem soliden Basised\u00fcnger und erh\u00f6he nur nach messbaren Reaktionen.',
                'Start with a solid base nutrient kit and increase only after measurable response.',
            ),
        ),
        extra: makeRecommendationItem(
            getExtraName(flags.wantsSmellControl, flags.isBudget, lang),
            flags.isBudget ? 35 : 85,
            bilingual(
                lang,
                'Kleine Mess- und Kontrollwerkzeuge liefern den gr\u00f6\u00dften Nutzen pro investiertem Euro.',
                'Small measurement and control tools deliver the best return per dollar spent.',
            ),
        ),
        proTip: bilingual(
            lang,
            'Erst Klima und Licht stabilisieren, dann erst D\u00fcnger und Training schrittweise anpassen.',
            'Stabilize climate and light first, then adjust nutrients and training in small steps.',
        ),
    }
}
