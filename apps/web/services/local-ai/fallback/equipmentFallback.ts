// ---------------------------------------------------------------------------
// equipmentFallback.ts -- Heuristic equipment recommendation builder
// ---------------------------------------------------------------------------
// Extracted from fallbackService.ts to isolate equipment domain logic.
// ---------------------------------------------------------------------------

import type { Recommendation, RecommendationItem, Language } from '@/types'
import { localizeStr } from './localeHelpers'

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
    es: { name: string; price: number }
    fr: { name: string; price: number }
    nl: { name: string; price: number }
}

const getTentConfig = (isLarge: boolean, isBudget: boolean): LocalizedItem => {
    const price = isLarge ? (isBudget ? 150 : 220) : isBudget ? 110 : 180
    const size = isLarge ? '120x120x200' : '100x100x200'
    return {
        en: { name: `${size} cm grow tent`, price },
        de: { name: `${size} cm Grow-Zelt`, price },
        es: { name: `Carpa de cultivo ${size} cm`, price },
        fr: { name: `Tente de culture ${size} cm`, price },
        nl: { name: `Kweektent ${size} cm`, price },
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
        return localizeStr(lang, {
            en: 'Odor control matters here, so a carbon filter is included.',
            de: 'Geruchsmanagement ist wichtig, daher mit Aktivkohlefilter planen.',
            es: 'El control de olores es importante, por eso se incluye un filtro de carbon.',
            fr: 'Le controle des odeurs est important, un filtre a charbon est donc inclus.',
            nl: 'Geurbeheersing is belangrijk, daarom is een koolstoffilter inbegrepen.',
        })
    }

    if (isSilent) {
        return localizeStr(lang, {
            en: 'Low-noise extraction keeps the room manageable in daily use.',
            de: 'Leiser Luftaustausch reduziert St\u00f6rungen im Alltag.',
            es: 'La extraccion silenciosa mantiene la sala manejable en el uso diario.',
            fr: "L'extraction silencieuse rend la piece gerant au quotidien.",
            nl: 'Stille afzuiging houdt de ruimte beheersbaar in dagelijks gebruik.',
        })
    }

    return localizeStr(lang, {
        en: 'Solid airflow keeps temperature and humidity stable.',
        de: 'Solider Luftaustausch h\u00e4lt Temperatur und Feuchte stabil.',
        es: 'Un flujo de aire solido mantiene la temperatura y humedad estables.',
        fr: "Un bon flux d'air maintient la temperature et l'humidite stables.",
        nl: 'Goede luchtstroom houdt temperatuur en vochtigheid stabiel.',
    })
}

const getSoilName = (prefersCoco: boolean, prefersSoil: boolean, lang: Language): string => {
    if (prefersCoco) {
        return localizeStr(lang, {
            en: 'Coco blend substrate',
            de: 'Coco-Blend Substrat',
            es: 'Sustrato mezcla de coco',
            fr: 'Substrat melange coco',
            nl: 'Kokos-blend substraat',
        })
    }

    if (prefersSoil) {
        return localizeStr(lang, {
            en: 'Living soil mix',
            de: 'Lebendige Blumenerde',
            es: 'Mezcla de tierra viva',
            fr: 'Terreau vivant',
            nl: 'Levende grondmix',
        })
    }

    return localizeStr(lang, {
        en: 'Quality grow soil',
        de: 'Hochwertige Grow-Erde',
        es: 'Tierra de cultivo de calidad',
        fr: 'Terreau de culture de qualite',
        nl: 'Kwaliteits kweekgrond',
    })
}

const getNutrientName = (prefersCoco: boolean, isAuto: boolean, lang: Language): string => {
    if (prefersCoco) {
        return localizeStr(lang, {
            en: 'Coco-friendly base nutrient kit',
            de: 'Coco-geeigneter Basised\u00fcnger',
            es: 'Kit de nutrientes base para coco',
            fr: 'Kit nutritif de base pour coco',
            nl: 'Kokos-vriendelijk basisvoedingspakket',
        })
    }

    if (isAuto) {
        return localizeStr(lang, {
            en: 'Gentle bloom nutrients for autos',
            de: 'Sanfte Bl\u00fcted\u00fcngung f\u00fcr Autos',
            es: 'Nutrientes suaves de floracion para automaticas',
            fr: 'Nutriments de floraison doux pour autos',
            nl: 'Zachte bloeivoeding voor automaten',
        })
    }

    return localizeStr(lang, {
        en: 'Balanced base nutrient kit',
        de: 'Ausgewogener Basised\u00fcnger',
        es: 'Kit de nutrientes base equilibrado',
        fr: 'Kit nutritif de base equilibre',
        nl: 'Uitgebalanceerd basisvoedingspakket',
    })
}

const getExtraName = (wantsSmellControl: boolean, isBudget: boolean, lang: Language): string => {
    if (wantsSmellControl) {
        return localizeStr(lang, {
            en: 'Carbon filter upgrade',
            de: 'Aktivkohlefilter-Upgrade',
            es: 'Mejora con filtro de carbon',
            fr: 'Amelioration filtre a charbon',
            nl: 'Koolstoffilter upgrade',
        })
    }

    if (isBudget) {
        return localizeStr(lang, {
            en: 'Thermo-hygrometer with min/max memory',
            de: 'Thermo-Hygrometer mit Min/Max',
            es: 'Termo-higrometro con memoria min/max',
            fr: 'Thermo-hygrometre avec memoire min/max',
            nl: 'Thermo-hygrometer met min/max geheugen',
        })
    }

    return localizeStr(lang, {
        en: 'pH and EC meter set',
        de: 'pH- und EC-Messset',
        es: 'Set de medidores pH y EC',
        fr: 'Kit de mesure pH et EC',
        nl: 'pH- en EC-meterset',
    })
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
    const tentItem = tent[lang] ?? tent['en']

    return {
        tent: makeRecommendationItem(
            tentItem.name,
            tentItem.price,
            localizeStr(lang, {
                en: 'This tent size gives enough room for climate control, lighting, and maintenance.',
                de: 'Ein Zelt in dieser Gr\u00f6\u00dfe gibt genug Platz f\u00fcr Klima, Licht und Wartung.',
                es: 'Este tamano de carpa ofrece suficiente espacio para clima, luz y mantenimiento.',
                fr: "Cette taille de tente offre assez d'espace pour le climat, l'eclairage et l'entretien.",
                nl: 'Deze tentmaat geeft genoeg ruimte voor klimaat, licht en onderhoud.',
            }),
        ),
        light: makeRecommendationItem(
            lightSetup.name,
            flags.isBudget ? 180 : 320,
            localizeStr(lang, {
                en: 'A full-spectrum LED is efficient, dimmable, and flexible for most grows.',
                de: 'Vollspektrum-LED ist effizient, dimmbar und f\u00fcr die meisten Setups flexibel.',
                es: 'Un LED de espectro completo es eficiente, regulable y flexible para la mayoria de cultivos.',
                fr: 'Une LED spectre complet est efficace, dimmable et flexible pour la plupart des cultures.',
                nl: 'Een fullspectrum LED is efficient, dimbaar en flexibel voor de meeste kweek.',
            }),
            lightSetup.watts,
        ),
        ventilation: makeRecommendationItem(
            ventilationName,
            resolveVentilationPrice(flags),
            ventilationRationale,
        ),
        circulationFan: makeRecommendationItem(
            localizeStr(lang, {
                en: 'Clip-on circulation fan',
                de: 'Clip-Ventilator',
                es: 'Ventilador de clip',
                fr: 'Ventilateur a clip',
                nl: 'Clip-ventilator',
            }),
            flags.isBudget ? 25 : 45,
            localizeStr(lang, {
                en: 'A small circulation fan prevents stale pockets and strengthens stems.',
                de: 'Ein kleiner Umluftventilator verhindert stehende Luft und st\u00e4rkt die St\u00e4ngel.',
                es: 'Un ventilador pequeno evita zonas de aire estancado y fortalece los tallos.',
                fr: "Un petit ventilateur de circulation empeche l'air stagnant et renforce les tiges.",
                nl: 'Een kleine circulatieventilator voorkomt stilstaande lucht en versterkt de stengels.',
            }),
        ),
        pots: makeRecommendationItem(
            localizeStr(lang, {
                en: '11 L fabric pots',
                de: 'Stofft\u00f6pfe 11 L',
                es: 'Macetas de tela 11 L',
                fr: 'Pots en tissu 11 L',
                nl: 'Stoffen potten 11 L',
            }),
            flags.isBudget ? 30 : 45,
            localizeStr(lang, {
                en: 'Fabric pots improve root-zone aeration and reduce overwatering risk.',
                de: 'Stofft\u00f6pfe verbessern die Bel\u00fcftung im Wurzelraum und reduzieren \u00dcberw\u00e4sserungsrisiken.',
                es: 'Las macetas de tela mejoran la aireacion de las raices y reducen el riesgo de riego excesivo.',
                fr: "Les pots en tissu ameliorent l'aeration racinaire et reduisent le risque de sur-arrosage.",
                nl: 'Stoffen potten verbeteren de wortelbeluchting en verminderen het risico op overbewatering.',
            }),
        ),
        soil: makeRecommendationItem(
            getSoilName(flags.prefersCoco, flags.prefersSoil, lang),
            flags.isBudget ? 35 : 55,
            flags.prefersCoco
                ? localizeStr(lang, {
                      en: 'Coco responds quickly and suits precise feeding.',
                      de: 'Coco ist schnell reagierend und eignet sich gut f\u00fcr pr\u00e4zise F\u00fctterung.',
                      es: 'El coco responde rapido y es ideal para alimentacion precisa.',
                      fr: 'Le coco reagit vite et convient a une alimentation precise.',
                      nl: 'Kokos reageert snel en is geschikt voor nauwkeurige voeding.',
                  })
                : localizeStr(lang, {
                      en: 'A good soil mix is forgiving and easiest for mixed setups.',
                      de: 'Eine gute Erde verzeiht Fehler und ist f\u00fcr gemischte Setups am einfachsten.',
                      es: 'Una buena mezcla de tierra es indulgente y la mas facil para configuraciones mixtas.',
                      fr: 'Un bon terreau est indulgent et le plus facile pour les configurations mixtes.',
                      nl: 'Een goede grondmix is vergevingsgezind en het makkelijkst voor gemengde setups.',
                  }),
        ),
        nutrients: makeRecommendationItem(
            getNutrientName(flags.prefersCoco, flags.isAuto, lang),
            flags.isBudget ? 35 : 70,
            localizeStr(lang, {
                en: 'Start with a solid base nutrient kit and increase only after measurable response.',
                de: 'Beginne mit einem soliden Basised\u00fcnger und erh\u00f6he nur nach messbaren Reaktionen.',
                es: 'Empezar con un kit de nutrientes base solido y aumentar solo tras respuestas medibles.',
                fr: 'Commencer avec un kit nutritif de base solide et augmenter seulement apres une reponse mesurable.',
                nl: 'Begin met een degelijk basisvoedingspakket en verhoog alleen na meetbare reactie.',
            }),
        ),
        extra: makeRecommendationItem(
            getExtraName(flags.wantsSmellControl, flags.isBudget, lang),
            flags.isBudget ? 35 : 85,
            localizeStr(lang, {
                en: 'Small measurement and control tools deliver the best return per dollar spent.',
                de: 'Kleine Mess- und Kontrollwerkzeuge liefern den gr\u00f6\u00dften Nutzen pro investiertem Euro.',
                es: 'Herramientas pequenas de medicion ofrecen el mejor retorno por euro invertido.',
                fr: 'Les petits outils de mesure offrent le meilleur retour par euro investi.',
                nl: 'Kleine meet- en regelgereedschappen leveren het beste rendement per geinvesteerde euro.',
            }),
        ),
        proTip: localizeStr(lang, {
            en: 'Stabilize climate and light first, then adjust nutrients and training in small steps.',
            de: 'Erst Klima und Licht stabilisieren, dann erst D\u00fcnger und Training schrittweise anpassen.',
            es: 'Estabilizar clima y luz primero, luego ajustar nutrientes y entrenamiento en pequenos pasos.',
            fr: "Stabiliser le climat et la lumiere d'abord, puis ajuster nutriments et palissage par petites etapes.",
            nl: 'Stabiliseer eerst klimaat en licht, pas daarna voeding en training in kleine stappen aan.',
        }),
    }
}
