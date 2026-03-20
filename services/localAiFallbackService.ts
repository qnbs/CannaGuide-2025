import {
    AIResponse,
    MentorMessage,
    Recommendation,
    RecommendationItem,
    Plant,
    PlantStage,
    Strain,
    StructuredGrowTips,
    Language,
} from '@/types'
import DOMPurify from 'dompurify'
import type { ImageStyle } from '@/services/geminiService'

const isGerman = (lang: Language) => lang === 'de'

type NutrientRecommendationContext = {
    medium: string
    stage: string
    currentEc: number
    currentPh: number
    optimalRange: { ecMin: number; ecMax: number; phMin: number; phMax: number }
    readings: Array<{ ec: number; ph: number; readingType: string; timestamp: number }>
    plant?: {
        name: string
        strain: { name: string }
        stage: string
        age: number
        health: number
        medium: { ph: number; ec: number }
    }
}

const formatPlantLine = (plant: Plant) =>
    `${plant.name}: health ${plant.health.toFixed(0)}%, stress ${plant.stressLevel.toFixed(0)}%, VPD ${plant.environment.vpd.toFixed(2)} kPa`

// ---------------------------------------------------------------------------
// Heuristic analysis helpers
// ---------------------------------------------------------------------------

export interface PlantDiagnostic {
    issues: string[]
    topPriority: string
}

function analyzeVpd(vpd: number, stage: PlantStage, lang: Language): string | null {
    const ideal =
        stage === PlantStage.Seedling || stage === PlantStage.Germination
            ? { min: 0.4, max: 0.8 }
            : stage === PlantStage.Flowering
              ? { min: 1.0, max: 1.5 }
              : { min: 0.8, max: 1.2 }

    if (vpd < ideal.min) {
        return isGerman(lang)
            ? `VPD zu niedrig (${vpd.toFixed(2)} kPa, Ziel ${ideal.min}–${ideal.max}). Luftfeuchtigkeit senken oder Temperatur erhöhen.`
            : `VPD too low (${vpd.toFixed(2)} kPa, target ${ideal.min}–${ideal.max}). Lower humidity or increase temperature.`
    }
    if (vpd > ideal.max) {
        return isGerman(lang)
            ? `VPD zu hoch (${vpd.toFixed(2)} kPa, Ziel ${ideal.min}–${ideal.max}). Luftfeuchtigkeit erhöhen oder Temperatur senken.`
            : `VPD too high (${vpd.toFixed(2)} kPa, target ${ideal.min}–${ideal.max}). Increase humidity or lower temperature.`
    }
    return null
}

function analyzePh(ph: number, lang: Language): string | null {
    if (ph < 5.8)
        return isGerman(lang)
            ? `pH zu niedrig (${ph.toFixed(2)}). Ziel: 5.8–6.5. Kalk oder pH-Up nutzen.`
            : `pH too low (${ph.toFixed(2)}). Target: 5.8–6.5. Use lime or pH-Up.`
    if (ph > 6.8)
        return isGerman(lang)
            ? `pH zu hoch (${ph.toFixed(2)}). Ziel: 5.8–6.5. pH-Down oder Essig nutzen.`
            : `pH too high (${ph.toFixed(2)}). Target: 5.8–6.5. Use pH-Down.`
    return null
}

function analyzeEc(ec: number, stage: PlantStage, lang: Language): string | null {
    const target =
        stage === PlantStage.Seedling
            ? { min: 0.4, max: 0.8 }
            : stage === PlantStage.Vegetative
              ? { min: 1.0, max: 1.8 }
              : stage === PlantStage.Flowering
                ? { min: 1.2, max: 2.2 }
                : null
    if (!target) return null
    if (ec < target.min)
        return isGerman(lang)
            ? `EC zu niedrig (${ec.toFixed(2)}, Ziel ${target.min}–${target.max}). Nährstoffe erhöhen.`
            : `EC too low (${ec.toFixed(2)}, target ${target.min}–${target.max}). Increase nutrients.`
    if (ec > target.max)
        return isGerman(lang)
            ? `EC zu hoch (${ec.toFixed(2)}, Ziel ${target.min}–${target.max}). Mit klarem Wasser spülen.`
            : `EC too high (${ec.toFixed(2)}, target ${target.min}–${target.max}). Flush with plain water.`
    return null
}

export function diagnosePlant(plant: Plant, lang: Language): PlantDiagnostic {
    const issues: string[] = []
    const vpdIssue = analyzeVpd(plant.environment.vpd, plant.stage, lang)
    if (vpdIssue) issues.push(vpdIssue)
    const phIssue = analyzePh(plant.medium.ph, lang)
    if (phIssue) issues.push(phIssue)
    const ecIssue = analyzeEc(plant.medium.ec, plant.stage, lang)
    if (ecIssue) issues.push(ecIssue)

    if (plant.environment.internalTemperature > 30) {
        issues.push(
            isGerman(lang)
                ? `Temperatur zu hoch (${plant.environment.internalTemperature.toFixed(1)}°C). Unter 28°C halten.`
                : `Temperature too high (${plant.environment.internalTemperature.toFixed(1)}°C). Keep below 28°C.`,
        )
    } else if (plant.environment.internalTemperature < 18) {
        issues.push(
            isGerman(lang)
                ? `Temperatur zu niedrig (${plant.environment.internalTemperature.toFixed(1)}°C). Über 20°C halten.`
                : `Temperature too low (${plant.environment.internalTemperature.toFixed(1)}°C). Keep above 20°C.`,
        )
    }

    if (plant.medium.moisture < 30) {
        issues.push(
            isGerman(lang)
                ? 'Substrat zu trocken. Bewässerung erhöhen.'
                : 'Medium too dry. Increase watering.',
        )
    } else if (plant.medium.moisture > 80) {
        issues.push(
            isGerman(lang)
                ? 'Substrat zu feucht. Überwässerungsgefahr.'
                : 'Medium too wet. Risk of overwatering.',
        )
    }

    if (plant.rootSystem.health < 60) {
        issues.push(
            isGerman(lang)
                ? `Wurzelgesundheit niedrig (${plant.rootSystem.health.toFixed(0)}%). Mykorrhiza und Drainage prüfen.`
                : `Root health low (${plant.rootSystem.health.toFixed(0)}%). Check mycorrhizae and drainage.`,
        )
    }

    // CO2 analysis
    const co2 = plant.environment.co2Level
    if (co2 < 300) {
        issues.push(
            isGerman(lang)
                ? `CO₂ sehr niedrig (${co2} ppm). Frischluft oder CO₂-Ergänzung prüfen.`
                : `CO₂ very low (${co2} ppm). Check ventilation or CO₂ supplementation.`,
        )
    } else if (co2 > 1500) {
        issues.push(
            isGerman(lang)
                ? `CO₂ zu hoch (${co2} ppm). Auf unter 1500 ppm senken, um Pflanzenstress zu vermeiden.`
                : `CO₂ too high (${co2} ppm). Reduce below 1500 ppm to avoid plant stress.`,
        )
    }

    // Light hours analysis
    const lightHours = plant.equipment.light.lightHours
    if (plant.stage === PlantStage.Flowering && lightHours > 14) {
        issues.push(
            isGerman(lang)
                ? `Lichtperiode zu lang für Blüte (${lightHours}h). 12/12 empfohlen.`
                : `Light period too long for flowering (${lightHours}h). 12/12 recommended.`,
        )
    } else if (plant.stage === PlantStage.Vegetative && lightHours < 14) {
        issues.push(
            isGerman(lang)
                ? `Lichtperiode kurz für Vegetative (${lightHours}h). 18/6 empfohlen.`
                : `Light period short for vegetative (${lightHours}h). 18/6 recommended.`,
        )
    }

    const topPriority =
        issues.length > 0
            ? issues[0]
            : isGerman(lang)
              ? 'Alle Parameter im Normalbereich.'
              : 'All parameters within normal range.'

    return { issues, topPriority }
}

// Sanitize user text in fallback responses (no HTML injection from user input)
const safe = (text: string) => DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })

const escapeXml = (value: string): string =>
    safe(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

const mediumAdvice = (medium: string, lang: Language): string => {
    const normalized = medium.toLowerCase()
    if (normalized.includes('coco')) {
        return isGerman(lang)
            ? 'Coco reagiert schnell. Kleine Korrekturen und engmaschige Kontrollen sind hier sinnvoll.'
            : 'Coco reacts quickly. Small corrections and frequent checks make the most sense here.'
    }
    if (normalized.includes('hydro')) {
        return isGerman(lang)
            ? 'Hydro benötigt die engste Kontrolle. Änderungen in kleinen Schritten vornehmen und die Werte täglich prüfen.'
            : 'Hydro needs the tightest control. Make changes in small steps and verify values daily.'
    }
    return isGerman(lang)
        ? 'Erde verzeiht etwas mehr. Sanfte Anpassungen und langsames Nachregeln sind meistens die beste Wahl.'
        : 'Soil is more forgiving. Gentle adjustments and slower corrections are usually the best choice.'
}

const summarizeTrend = (context: NutrientRecommendationContext, lang: Language): string | null => {
    if (context.readings.length < 2) {
        return null
    }

    const orderedReadings = [...context.readings].sort(
        (left, right) => left.timestamp - right.timestamp,
    )
    const firstReading = orderedReadings[0]
    const lastReading = orderedReadings[orderedReadings.length - 1]
    const ecDelta = lastReading.ec - firstReading.ec
    const phDelta = lastReading.ph - firstReading.ph

    const changes: string[] = []
    if (Math.abs(ecDelta) >= 0.15) {
        changes.push(
            isGerman(lang)
                ? `EC ${ecDelta > 0 ? 'steigt' : 'fällt'} über die letzten Messungen um ${Math.abs(ecDelta).toFixed(2)}.`
                : `EC has ${ecDelta > 0 ? 'risen' : 'fallen'} by ${Math.abs(ecDelta).toFixed(2)} across the recent readings.`,
        )
    }
    if (Math.abs(phDelta) >= 0.15) {
        changes.push(
            isGerman(lang)
                ? `pH ${phDelta > 0 ? 'steigt' : 'fällt'} über die letzten Messungen um ${Math.abs(phDelta).toFixed(2)}.`
                : `pH has ${phDelta > 0 ? 'risen' : 'fallen'} by ${Math.abs(phDelta).toFixed(2)} across the recent readings.`,
        )
    }

    return changes.length > 0 ? changes.join(' ') : null
}

const buildNutrientRecommendation = (
    context: NutrientRecommendationContext,
    lang: Language,
): string => {
    const withinEc =
        context.currentEc >= context.optimalRange.ecMin &&
        context.currentEc <= context.optimalRange.ecMax
    const withinPh =
        context.currentPh >= context.optimalRange.phMin &&
        context.currentPh <= context.optimalRange.phMax
    const plantLabel = context.plant
        ? `${context.plant.name} (${context.plant.strain.name})`
        : isGerman(lang)
          ? 'ohne ausgewählte Pflanze'
          : 'without a selected plant'

    const lines: string[] = [
        isGerman(lang)
            ? `Lokaler Nährstoffplan für ${plantLabel}.`
            : `Local nutrient plan for ${plantLabel}.`,
        isGerman(lang)
            ? `Aktuell: EC ${context.currentEc.toFixed(2)} bei Ziel ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)}, pH ${context.currentPh.toFixed(2)} bei Ziel ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`
            : `Current values: EC ${context.currentEc.toFixed(2)} against target ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)}, pH ${context.currentPh.toFixed(2)} against target ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
    ]

    if (withinEc) {
        lines.push(
            isGerman(lang)
                ? 'EC liegt im Sollbereich. Die Fütterung kann stabil bleiben.'
                : 'EC is within target. Keep the feed strength steady for now.',
        )
    } else if (context.currentEc < context.optimalRange.ecMin) {
        lines.push(
            isGerman(lang)
                ? `EC ist zu niedrig. Die nächste Gabe leicht anheben und in ${context.medium.toLowerCase().includes('hydro') ? 'kleinen' : 'moderaten'} Schritten auf ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)} bringen.`
                : `EC is too low. Increase the next feed slightly and move back toward ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)} in ${context.medium.toLowerCase().includes('hydro') ? 'small' : 'moderate'} steps.`,
        )
    } else {
        lines.push(
            isGerman(lang)
                ? 'EC ist zu hoch. Die Mischung etwas verdünnen oder eine Bewässerung mit klarem Wasser einplanen.'
                : 'EC is too high. Dilute the mix a bit or plan a plain-water irrigation.',
        )
    }

    if (withinPh) {
        lines.push(isGerman(lang) ? 'pH liegt im Zielbereich.' : 'pH is within the target range.')
    } else if (context.currentPh < context.optimalRange.phMin) {
        lines.push(
            isGerman(lang)
                ? `pH ist zu niedrig. Leicht anheben, damit die Wurzelzone wieder in den Bereich ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)} kommt.`
                : `pH is too low. Raise it gently so the root zone moves back into ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
        )
    } else {
        lines.push(
            isGerman(lang)
                ? 'pH ist zu hoch. Sanft senken, damit Nährstoffe wieder sauber verfügbar werden.'
                : 'pH is too high. Lower it gently so nutrients become available again.',
        )
    }

    const trend = summarizeTrend(context, lang)
    if (trend) {
        lines.push(trend)
    }

    if (context.readings.length > 0) {
        const latest = [...context.readings].sort(
            (left, right) => right.timestamp - left.timestamp,
        )[0]
        lines.push(
            isGerman(lang)
                ? `Letzte Messung (${latest.readingType}): EC ${latest.ec.toFixed(2)}, pH ${latest.ph.toFixed(2)}.`
                : `Latest reading (${latest.readingType}): EC ${latest.ec.toFixed(2)}, pH ${latest.ph.toFixed(2)}.`,
        )
    }

    if (context.plant) {
        lines.push(
            isGerman(lang)
                ? `Pflanze: ${context.plant.name}, ${context.plant.stage}, ${context.plant.age} Tage, Gesundheit ${context.plant.health.toFixed(0)}%.`
                : `Plant: ${context.plant.name}, ${context.plant.stage}, ${context.plant.age} days old, health ${context.plant.health.toFixed(0)}%.`,
        )
    }

    lines.push(mediumAdvice(context.medium, lang))
    lines.push(
        isGerman(lang)
            ? 'Nächster Schritt: nur eine Variable pro Runde ändern und die Reaktion protokollieren.'
            : 'Next step: change only one variable per round and record the plant response.',
    )

    return lines.join('\n')
}

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

const buildEquipmentRecommendation = (prompt: string, lang: Language): Recommendation => {
    const normalized = prompt.toLowerCase().slice(0, 2000)
    const isBudget = /budget|cheap|starter|entry|einsteiger|günstig|preiswert/.test(normalized)
    const isLarge = /4x4|5x5|groß|large|mehrere pflanzen|multiple plants/.test(normalized)
    const isSilent = /silent|quiet|leise/.test(normalized)
    const wantsSmellControl = /smell|odor|geruch|filter|carbon/.test(normalized)
    const prefersSoil = /soil|erde|living soil|organic/.test(normalized)
    const prefersCoco = /coco|kokos/.test(normalized)
    const isAuto = /autoflower|autoflowering|autoflowern?/.test(normalized)

    const tent = isLarge
        ? {
              en: { name: '120x120x200 cm grow tent', price: isBudget ? 150 : 220 },
              de: { name: '120x120x200 cm Grow-Zelt', price: isBudget ? 150 : 220 },
          }
        : {
              en: { name: '100x100x200 cm grow tent', price: isBudget ? 110 : 180 },
              de: { name: '100x100x200 cm Grow-Zelt', price: isBudget ? 110 : 180 },
          }

    const lightWatts = isLarge ? (isBudget ? 320 : 450) : isBudget ? 200 : 300
    const lightName = isBudget
        ? `${lightWatts}W full-spectrum LED`
        : `${lightWatts}W dimmable full-spectrum LED`

    const ventilationName = wantsSmellControl
        ? isSilent
            ? 'Silent inline fan with carbon filter'
            : 'Inline fan with carbon filter'
        : isSilent
          ? 'Low-noise inline exhaust fan'
          : 'Inline exhaust fan'

    const ventilationRationale = wantsSmellControl
        ? isGerman(lang)
            ? 'Geruchsmanagement ist wichtig, daher mit Aktivkohlefilter planen.'
            : 'Odor control matters here, so a carbon filter is included.'
        : isSilent
          ? isGerman(lang)
              ? 'Leiser Luftaustausch reduziert Störungen im Alltag.'
              : 'Low-noise extraction keeps the room manageable in daily use.'
          : isGerman(lang)
            ? 'Solider Luftaustausch hält Temperatur und Feuchte stabil.'
            : 'Solid airflow keeps temperature and humidity stable.'

    const soilName = prefersCoco
        ? isGerman(lang)
            ? 'Coco-Blend Substrat'
            : 'Coco blend substrate'
        : prefersSoil
          ? isGerman(lang)
              ? 'Lebendige Blumenerde'
              : 'Living soil mix'
          : isGerman(lang)
            ? 'Hochwertige Grow-Erde'
            : 'Quality grow soil'

    const nutrientName = prefersCoco
        ? isGerman(lang)
            ? 'Coco-geeigneter Basisdünger'
            : 'Coco-friendly base nutrient kit'
        : isAuto
          ? isGerman(lang)
              ? 'Sanfte Blütedüngung für Autos'
              : 'Gentle bloom nutrients for autos'
          : isGerman(lang)
            ? 'Ausgewogener Basisdünger'
            : 'Balanced base nutrient kit'

    const extraName = wantsSmellControl
        ? isGerman(lang)
            ? 'Aktivkohlefilter-Upgrade'
            : 'Carbon filter upgrade'
        : isBudget
          ? isGerman(lang)
              ? 'Thermo-Hygrometer mit Min/Max'
              : 'Thermo-hygrometer with min/max memory'
          : isGerman(lang)
            ? 'pH- und EC-Messset'
            : 'pH and EC meter set'

    const proTip = isGerman(lang)
        ? 'Erst Klima und Licht stabilisieren, dann erst Dünger und Training schrittweise anpassen.'
        : 'Stabilize climate and light first, then adjust nutrients and training in small steps.'

    const tentItem = tent[lang]

    return {
        tent: makeRecommendationItem(
            tentItem.name,
            tentItem.price,
            isGerman(lang)
                ? 'Ein Zelt in dieser Größe gibt genug Platz für Klima, Licht und Wartung.'
                : 'This tent size gives enough room for climate control, lighting, and maintenance.',
        ),
        light: makeRecommendationItem(
            lightName,
            isBudget ? 180 : 320,
            isGerman(lang)
                ? 'Vollspektrum-LED ist effizient, dimmbar und für die meisten Setups flexibel.'
                : 'A full-spectrum LED is efficient, dimmable, and flexible for most grows.',
            lightWatts,
        ),
        ventilation: makeRecommendationItem(
            ventilationName,
            wantsSmellControl ? (isBudget ? 170 : 260) : isBudget ? 120 : 190,
            ventilationRationale,
        ),
        circulationFan: makeRecommendationItem(
            isGerman(lang) ? 'Clip-Ventilator' : 'Clip-on circulation fan',
            isBudget ? 25 : 45,
            isGerman(lang)
                ? 'Ein kleiner Umluftventilator verhindert stehende Luft und stärkt die Stängel.'
                : 'A small circulation fan prevents stale pockets and strengthens stems.',
        ),
        pots: makeRecommendationItem(
            isGerman(lang) ? 'Stofftöpfe 11 L' : '11 L fabric pots',
            isBudget ? 30 : 45,
            isGerman(lang)
                ? 'Stofftöpfe verbessern die Belüftung im Wurzelraum und reduzieren Überwässerungsrisiken.'
                : 'Fabric pots improve root-zone aeration and reduce overwatering risk.',
        ),
        soil: makeRecommendationItem(
            soilName,
            isBudget ? 35 : 55,
            prefersCoco
                ? isGerman(lang)
                    ? 'Coco ist schnell reagierend und eignet sich gut für präzise Fütterung.'
                    : 'Coco responds quickly and suits precise feeding.'
                : isGerman(lang)
                  ? 'Eine gute Erde verzeiht Fehler und ist für gemischte Setups am einfachsten.'
                  : 'A good soil mix is forgiving and easiest for mixed setups.',
        ),
        nutrients: makeRecommendationItem(
            nutrientName,
            isBudget ? 35 : 70,
            isGerman(lang)
                ? 'Beginne mit einem soliden Basisdünger und erhöhe nur nach messbaren Reaktionen.'
                : 'Start with a solid base nutrient kit and increase only after measurable response.',
        ),
        extra: makeRecommendationItem(
            extraName,
            isBudget ? 35 : 85,
            isGerman(lang)
                ? 'Kleine Mess- und Kontrollwerkzeuge liefern den größten Nutzen pro investiertem Euro.'
                : 'Small measurement and control tools deliver the best return per dollar spent.',
        ),
        proTip,
    }
}

const AVAILABLE_STYLES: Exclude<ImageStyle, 'random'>[] = [
    'fantasy',
    'botanical',
    'psychedelic',
    'macro',
    'cyberpunk',
]

const resolveStyle = (style: ImageStyle): Exclude<ImageStyle, 'random'> => {
    if (style === 'random') {
        return AVAILABLE_STYLES[Math.floor(Math.random() * AVAILABLE_STYLES.length)]
    }
    return style as Exclude<ImageStyle, 'random'>
}

// ─── Style Palette ──────────────────────────────────────────────────────────

interface StylePalette {
    bg1: string
    bg2: string
    bg3: string
    accent: string
    accent2: string
    glow: string
    text: string
    textDim: string
    barBg: string
}

const buildStylePalette = (style: Exclude<ImageStyle, 'random'>): StylePalette => {
    switch (style) {
        case 'fantasy':
            return {
                bg1: '#0d0a1a',
                bg2: '#1b1340',
                bg3: '#3b1f7a',
                accent: '#c084fc',
                accent2: '#f9a8d4',
                glow: '#7c3aed',
                text: '#f1e8ff',
                textDim: '#a78bfa',
                barBg: '#1e1545',
            }
        case 'botanical':
            return {
                bg1: '#030f09',
                bg2: '#0a2618',
                bg3: '#134e33',
                accent: '#34d399',
                accent2: '#86efac',
                glow: '#10b981',
                text: '#ecfdf5',
                textDim: '#6ee7b7',
                barBg: '#0c2a1a',
            }
        case 'psychedelic':
            return {
                bg1: '#1a0525',
                bg2: '#3b0764',
                bg3: '#7c2d92',
                accent: '#e879f9',
                accent2: '#fde047',
                glow: '#d946ef',
                text: '#fdf4ff',
                textDim: '#d946ef',
                barBg: '#2e1065',
            }
        case 'macro':
            return {
                bg1: '#0a0f18',
                bg2: '#162032',
                bg3: '#1e3a5f',
                accent: '#60a5fa',
                accent2: '#93c5fd',
                glow: '#3b82f6',
                text: '#eff6ff',
                textDim: '#93c5fd',
                barBg: '#172554',
            }
        case 'cyberpunk':
            return {
                bg1: '#04080f',
                bg2: '#0c1929',
                bg3: '#132f4c',
                accent: '#22d3ee',
                accent2: '#fb7185',
                glow: '#06b6d4',
                text: '#f0fdfa',
                textDim: '#67e8f9',
                barBg: '#0e2337',
            }
    }
}

// ─── Value Lookups (matching exact DifficultyLevel / YieldLevel / HeightLevel enum values) ──

const DIFFICULTY_VAL: Record<string, number> = { Easy: 30, Medium: 60, Hard: 95 }
const YIELD_VAL: Record<string, number> = { Low: 25, Medium: 55, High: 90 }
const HEIGHT_VAL: Record<string, number> = { Short: 25, Medium: 55, Tall: 90 }

// ─── Comprehensive Terpene Color Mapping ────────────────────────────────────

const TERPENE_COLORS: Record<string, string> = {
    myrcene: '#86efac',
    limonene: '#fde047',
    caryophyllene: '#f97316',
    pinene: '#34d399',
    linalool: '#c084fc',
    terpinolene: '#22d3ee',
    ocimene: '#fb923c',
    humulene: '#a78bfa',
    bisabolol: '#f9a8d4',
    nerolidol: '#fbbf24',
    guaiol: '#2dd4bf',
    valencene: '#fdba74',
    camphene: '#4ade80',
    geraniol: '#f472b6',
    eucalyptol: '#67e8f9',
    borneol: '#a3e635',
    sabinene: '#c4b5fd',
    farnesene: '#fca5a5',
    phytol: '#6ee7b7',
    terpineol: '#7dd3fc',
}

// ─── Leaf Shape Builders ────────────────────────────────────────────────────

const buildLeafPath = (strainType: string): string => {
    const t = strainType.toLowerCase()
    if (t.includes('indica')) {
        return 'M0 -160 C60 -110 118 -45 110 25 C104 72 55 130 0 200 C-55 130 -104 72 -110 25 C-118 -45 -60 -110 0 -160Z'
    }
    if (t.includes('sativa')) {
        return 'M0 -230 C28 -175 55 -90 52 -8 C50 46 34 130 0 225 C-34 130 -50 46 -52 -8 C-55 -90 -28 -175 0 -230Z'
    }
    return 'M0 -195 C44 -145 90 -75 96 -8 C100 40 65 110 0 195 C-65 110 -100 40 -96 -8 C-90 -75 -44 -145 0 -195Z'
}

const buildFanLeaves = (
    strainType: string,
    palette: StylePalette,
    cx: number,
    cy: number,
): string => {
    const leaf = buildLeafPath(strainType)
    const angles = [-28, -14, 0, 14, 28]
    const scales = [0.52, 0.74, 1.0, 0.74, 0.52]
    const opacities = [0.4, 0.6, 0.9, 0.6, 0.4]
    return angles
        .map(
            (a, i) =>
                `<g transform="translate(${cx},${cy}) rotate(${a}) scale(${scales[i]})" opacity="${opacities[i]}">
            <path d="${leaf}" fill="${palette.accent}" opacity="0.1"/>
            <path d="${leaf}" fill="none" stroke="${palette.accent}" stroke-width="2" stroke-linecap="round"/>
        </g>`,
        )
        .join('\n        ')
}

// ─── Data Visualization ─────────────────────────────────────────────────────

const svgDataBar = (
    x: number,
    y: number,
    label: string,
    fillPct: number,
    barColor: string,
    barBg: string,
    textColor: string,
    display: string,
): string => {
    const w = Math.min(1, Math.max(0, fillPct / 100)) * 340
    return `<text x="${x}" y="${y}" font-size="17" fill="${textColor}" font-family="'Inter',sans-serif" opacity="0.65">${escapeXml(label)}</text>
    <rect x="${x + 128}" y="${y - 12}" width="340" height="13" rx="6.5" fill="${barBg}"/>
    <rect x="${x + 128}" y="${y - 12}" width="${w}" height="13" rx="6.5" fill="${barColor}" opacity="0.9"/>
    <text x="${x + 478}" y="${y}" font-size="15" fill="${textColor}" font-family="'Inter',sans-serif" opacity="0.8">${escapeXml(display)}</text>`
}

const svgTerpeneDots = (
    x: number,
    y: number,
    terpenes: string[],
    accent: string,
    textColor: string,
): string => {
    const shown = terpenes.slice(0, 6)
    return shown
        .map((t, i) => {
            const color = TERPENE_COLORS[t.toLowerCase()] ?? accent
            const cx = x + i * 50
            return `<circle cx="${cx + 8}" cy="${y}" r="10" fill="${color}" opacity="0.9"/>
        <text x="${cx + 8}" y="${y + 23}" font-size="10" fill="${textColor}" font-family="'Inter',sans-serif" text-anchor="middle" opacity="0.55">${escapeXml(t.length > 6 ? t.slice(0, 5) + '.' : t)}</text>`
        })
        .join('\n    ')
}

// ─── Style-Specific Texture Overlays ────────────────────────────────────────

const buildStyleTexture = (
    style: Exclude<ImageStyle, 'random'>,
    palette: StylePalette,
    decorScale: number,
): string => {
    if (decorScale < 0.5) return ''
    switch (style) {
        case 'fantasy': {
            const stars: [number, number][] = [
                [180, 340],
                [920, 180],
                [750, 660],
                [300, 850],
                [1050, 520],
                [140, 1200],
                [860, 960],
            ]
            return stars
                .map(([x, y], i) => {
                    const s = 3 + (i % 4) * 1.5
                    const o = (0.2 + (i % 3) * 0.1).toFixed(2)
                    return `<g transform="translate(${x},${y})" opacity="${o}">
                <line x1="-${s}" y1="0" x2="${s}" y2="0" stroke="${palette.accent2}" stroke-width="1.2"/>
                <line x1="0" y1="-${s}" x2="0" y2="${s}" stroke="${palette.accent2}" stroke-width="1.2"/>
            </g>`
                })
                .join('\n        ')
        }
        case 'botanical':
            return `<g opacity="0.05" stroke="${palette.accent}" stroke-width="1" fill="none">
            <path d="M0 400 Q300 350 600 500 T1200 380"/>
            <path d="M0 850 Q400 800 700 900 T1200 830"/>
            <circle cx="600" cy="550" r="280" stroke-dasharray="6 10"/>
        </g>`
        case 'psychedelic':
            return `<g opacity="0.07" fill="none" stroke-width="1.2">
            ${[100, 170, 240, 310, 380]
                .map(
                    (r, i) =>
                        `<circle cx="600" cy="500" r="${r}" stroke="${i % 2 === 0 ? palette.accent : palette.accent2}" stroke-dasharray="${3 + i * 2} ${5 + i * 2}"/>`,
                )
                .join('\n            ')}
        </g>`
        case 'macro': {
            const bokeh: [number, number, number, number][] = [
                [140, 200, 40, 0.07],
                [900, 150, 55, 0.08],
                [1050, 400, 35, 0.06],
                [250, 700, 60, 0.07],
                [950, 750, 42, 0.06],
                [100, 1050, 48, 0.09],
                [800, 1100, 30, 0.06],
                [500, 250, 25, 0.07],
            ]
            return bokeh
                .map(
                    ([x, y, r, o]) =>
                        `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${palette.accent}" stroke-width="1.2" opacity="${o}"/>`,
                )
                .join('\n        ')
        }
        case 'cyberpunk':
            return `<g opacity="0.04" stroke="${palette.accent}" stroke-width="0.6">
            ${[200, 400, 600, 800, 1000].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="1400"/>`).join('\n            ')}
            ${[280, 560, 840, 1120].map((y) => `<line x1="0" y1="${y}" x2="1200" y2="${y}"/>`).join('\n            ')}
        </g>
        <g opacity="0.1">
            ${[
                [100, 100],
                [500, 300],
                [900, 200],
                [300, 800],
                [1000, 600],
                [200, 1100],
                [800, 1000],
            ]
                .map(
                    ([x, y]) =>
                        `<rect x="${x}" y="${y}" width="3" height="3" fill="${palette.accent2}"/>`,
                )
                .join('\n            ')}
        </g>`
    }
}

// ─── Mood Overlay ───────────────────────────────────────────────────────────

const buildMoodOverlay = (mood: string): string => {
    switch (mood.toLowerCase()) {
        case 'mystical':
            return '<rect width="1200" height="1400" fill="#7c3aed" opacity="0.04"/>'
        case 'energetic':
            return '<rect width="600" height="1400" x="300" fill="#f97316" opacity="0.025"/>'
        case 'calm':
            return '<rect width="1200" height="1400" fill="#38bdf8" opacity="0.025"/>'
        default:
            return ''
    }
}

// ─── Focus-Responsive Central Element ───────────────────────────────────────

const buildFocusElement = (
    focus: string,
    palette: StylePalette,
    strainType: string,
    cx: number,
    cy: number,
): string => {
    switch (focus.toLowerCase()) {
        case 'buds': {
            const outer = [0, 60, 120, 180, 240, 300]
            const inner = [30, 90, 150, 210, 270, 330]
            return `<g transform="translate(${cx},${cy})" filter="url(#softglow)">
            <circle r="75" fill="${palette.accent}" opacity="0.07"/>
            <circle r="50" fill="${palette.accent}" opacity="0.12"/>
            <circle r="25" fill="${palette.glow}" opacity="0.25"/>
            ${outer
                .map((a) => {
                    const rad = (a * Math.PI) / 180
                    const x = Math.cos(rad) * 48
                    const y = Math.sin(rad) * 48
                    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="${palette.accent}" opacity="0.13"/>
            <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${palette.accent2}" opacity="0.55"/>`
                })
                .join('\n            ')}
            ${inner
                .map((a) => {
                    const rad = (a * Math.PI) / 180
                    const x = Math.cos(rad) * 82
                    const y = Math.sin(rad) * 82
                    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="${palette.accent2}" opacity="0.08"/>
            <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${palette.accent2}" opacity="0.4"/>`
                })
                .join('\n            ')}
        </g>`
        }
        case 'abstract': {
            const hex = [0, 1, 2, 3, 4, 5]
                .map((i) => {
                    const a = ((i * 60 - 90) * Math.PI) / 180
                    return `${(Math.cos(a) * 95).toFixed(1)},${(Math.sin(a) * 95).toFixed(1)}`
                })
                .join(' ')
            const innerHex = [0, 1, 2, 3, 4, 5]
                .map((i) => {
                    const a = ((i * 60 - 60) * Math.PI) / 180
                    return `${(Math.cos(a) * 55).toFixed(1)},${(Math.sin(a) * 55).toFixed(1)}`
                })
                .join(' ')
            return `<g transform="translate(${cx},${cy})" filter="url(#softglow)">
            ${[75, 125, 170]
                .map(
                    (r) =>
                        `<circle r="${r}" fill="none" stroke="${palette.accent}" stroke-width="0.8" opacity="0.12" stroke-dasharray="${r / 4} ${r / 6}"/>`,
                )
                .join('\n            ')}
            ${[0, 45, 90, 135]
                .map((a) => {
                    const rad = (a * Math.PI) / 180
                    const x = Math.cos(rad) * 170
                    const y = Math.sin(rad) * 170
                    return `<line x1="${(-x).toFixed(1)}" y1="${(-y).toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${palette.accent}" stroke-width="0.6" opacity="0.08"/>`
                })
                .join('\n            ')}
            <polygon points="${hex}" fill="none" stroke="${palette.accent}" stroke-width="1" opacity="0.1"/>
            <polygon points="${innerHex}" fill="none" stroke="${palette.accent2}" stroke-width="0.8" opacity="0.08"/>
        </g>`
        }
        default:
            return `<g filter="url(#softglow)">
            ${buildFanLeaves(strainType, palette, cx, cy)}
            <circle cx="${cx}" cy="${cy}" r="18" fill="${palette.accent}" opacity="0.6"/>
            <circle cx="${cx}" cy="${cy}" r="60" fill="${palette.accent}" opacity="0.06"/>
        </g>`
    }
}

// ─── Composition Layout ─────────────────────────────────────────────────────

const getCompositionLayout = (
    composition: string,
): { centerX: number; centerY: number; decorScale: number } => {
    switch (composition.toLowerCase()) {
        case 'symmetrical':
            return { centerX: 600, centerY: 490, decorScale: 1.0 }
        case 'minimalist':
            return { centerX: 600, centerY: 510, decorScale: 0.35 }
        default:
            return { centerX: 650, centerY: 470, decorScale: 1.15 }
    }
}

// ─── Main SVG Builder ───────────────────────────────────────────────────────

const buildStrainImageSvg = (
    strain: Strain,
    style: Exclude<ImageStyle, 'random'>,
    criteria: { focus: string; composition: string; mood: string },
    lang: Language,
): string => {
    const p = buildStylePalette(style)
    const { centerX: cx, centerY: cy, decorScale } = getCompositionLayout(criteria.composition)
    const cleanName = escapeXml(strain.name).slice(0, 42)
    const nameFontSize = cleanName.length > 28 ? 48 : cleanName.length > 20 ? 56 : 68
    const typeLabel = escapeXml(strain.type)
    const flowerTypeLabel = escapeXml(strain.floweringType)
    const title = isGerman(lang) ? 'LOKALE STRAIN-VORSCHAU' : 'LOCAL STRAIN PREVIEW'
    const subtitle = isGerman(lang)
        ? 'SVG-Poster · Lokaler Fallback'
        : 'SVG poster · Local fallback'

    // ─ Cannabinoid percentages (thc/35 as reference max, cbd/25, cbg/5, thcv/5)
    const thcPct = (strain.thc / 35) * 100
    const cbdPct = (strain.cbd / 25) * 100
    const thcDisplay = strain.thcRange ?? `${strain.thc}%`
    const cbdDisplay = strain.cbdRange ?? `${strain.cbd}%`

    // ─ Agronomic values (correctly mapped to enum values)
    const diffVal = DIFFICULTY_VAL[strain.agronomic.difficulty] ?? 50
    const yieldVal = YIELD_VAL[strain.agronomic.yield] ?? 50
    const heightVal = HEIGHT_VAL[strain.agronomic.height] ?? 50
    const diffLabel = isGerman(lang) ? 'Schwierigkeit' : 'Difficulty'
    const yieldLabel = isGerman(lang) ? 'Ertrag' : 'Yield'
    const heightLabel = isGerman(lang) ? 'Höhe' : 'Height'

    // ─ Terpenes, aromas, metadata
    const terpenes = strain.dominantTerpenes ?? []
    const aromas = (strain.aromas ?? [])
        .slice(0, 5)
        .map((a) => escapeXml(a))
        .join(' · ')
    const floweringText = isGerman(lang)
        ? `${strain.floweringTime} Tage Blüte`
        : `${strain.floweringTime}d flowering`
    const genetics = strain.genetics ? escapeXml(strain.genetics).slice(0, 55) : ''
    const description = strain.description ? escapeXml(strain.description).slice(0, 100) : ''

    // ─ Build dynamic data bars
    let dataY = 820
    const bars: string[] = []
    bars.push(svgDataBar(86, dataY, 'THC', thcPct, p.accent, p.barBg, p.textDim, thcDisplay))
    dataY += 36
    bars.push(svgDataBar(86, dataY, 'CBD', cbdPct, p.accent2, p.barBg, p.textDim, cbdDisplay))
    dataY += 36
    if (strain.cbg != null) {
        bars.push(
            svgDataBar(
                86,
                dataY,
                'CBG',
                (strain.cbg / 5) * 100,
                '#fbbf24',
                p.barBg,
                p.textDim,
                `${strain.cbg}%`,
            ),
        )
        dataY += 36
    }
    if (strain.thcv != null) {
        bars.push(
            svgDataBar(
                86,
                dataY,
                'THCV',
                (strain.thcv / 5) * 100,
                '#2dd4bf',
                p.barBg,
                p.textDim,
                `${strain.thcv}%`,
            ),
        )
        dataY += 36
    }
    bars.push(
        svgDataBar(
            86,
            dataY,
            diffLabel,
            diffVal,
            '#f97316',
            p.barBg,
            p.textDim,
            strain.agronomic.difficulty,
        ),
    )
    dataY += 36
    bars.push(
        svgDataBar(
            86,
            dataY,
            yieldLabel,
            yieldVal,
            '#22c55e',
            p.barBg,
            p.textDim,
            strain.agronomic.yield,
        ),
    )
    dataY += 36
    bars.push(
        svgDataBar(
            86,
            dataY,
            heightLabel,
            heightVal,
            '#60a5fa',
            p.barBg,
            p.textDim,
            strain.agronomic.height,
        ),
    )
    dataY += 44

    // ─ Terpene section
    let terpenesBlock = ''
    if (terpenes.length > 0) {
        terpenesBlock = `<g transform="translate(86, ${dataY})">
        <text x="0" y="0" font-size="16" fill="${p.textDim}" font-family="'Inter',sans-serif" opacity="0.6">${isGerman(lang) ? 'Terpene' : 'Terpenes'}</text>
        ${svgTerpeneDots(0, 28, terpenes, p.accent, p.textDim)}
    </g>`
        dataY += 64
    }

    // ─ Aromas section
    let aromasBlock = ''
    if (aromas.length > 0) {
        aromasBlock = `<text x="86" y="${dataY}" font-size="16" fill="${p.textDim}" font-family="'Inter',sans-serif" opacity="0.55">${isGerman(lang) ? 'Aromen' : 'Aromas'}: ${aromas}</text>`
        dataY += 30
    }

    const footerY = Math.max(dataY + 40, 1180)

    // ─ Dynamic composition accent
    const accentBand =
        criteria.composition.toLowerCase() === 'dynamic'
            ? `<rect x="0" y="0" width="5" height="1400" fill="${p.accent}" opacity="0.15"/>
    <line x1="0" y1="0" x2="1200" y2="1400" stroke="${p.accent}" stroke-width="0.5" opacity="0.06"/>`
            : ''

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1400" role="img" aria-label="${cleanName} — ${typeLabel} ${flowerTypeLabel} cannabis strain poster, ${escapeXml(style)} style, ${escapeXml(criteria.focus)} focus, ${escapeXml(criteria.mood)} mood">
    <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stop-color="${p.bg1}"/>
            <stop offset="45%" stop-color="${p.bg2}"/>
            <stop offset="100%" stop-color="${p.bg3}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="32%" r="55%">
            <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>
        </radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="22"/></filter>
        <filter id="softglow">
            <feGaussianBlur stdDeviation="5" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
            <feBlend in="SourceGraphic" mode="multiply"/>
        </filter>
    </defs>

    <!-- Background -->
    <rect width="1200" height="1400" fill="url(#bg)"/>
    <rect width="1200" height="1400" fill="url(#glow)"/>

    <!-- Noise texture -->
    <rect width="1200" height="1400" filter="url(#noise)" opacity="0.03"/>

    <!-- Mood tint -->
    ${buildMoodOverlay(criteria.mood)}

    <!-- Ambient orbs -->
    <g filter="url(#blur)" opacity="${(0.25 * decorScale).toFixed(2)}">
        <circle cx="220" cy="240" r="130" fill="${p.accent}"/>
        <circle cx="940" cy="330" r="160" fill="${p.bg3}"/>
        <circle cx="160" cy="980" r="180" fill="${p.bg2}"/>
        <circle cx="970" cy="1100" r="140" fill="${p.accent2}"/>
    </g>

    <!-- Style-specific texture -->
    ${buildStyleTexture(style, p, decorScale)}

    <!-- Composition accent -->
    ${accentBand}

    <!-- Header -->
    <g fill="${p.text}" font-family="'Inter',sans-serif">
        <text x="86" y="100" font-size="36" font-weight="700" letter-spacing="3.5" opacity="0.9">${escapeXml(title)}</text>
        <text x="86" y="140" font-size="19" opacity="0.5">${escapeXml(subtitle)}</text>
    </g>

    <!-- Badges -->
    <g font-family="'Inter',sans-serif">
        <rect x="86" y="162" width="${typeLabel.length * 12 + 28}" height="28" rx="14" fill="${p.accent}" opacity="0.18"/>
        <text x="100" y="181" font-size="15" font-weight="600" fill="${p.accent}">${typeLabel}</text>

        <rect x="${86 + typeLabel.length * 12 + 40}" y="162" width="${style.length * 10 + 28}" height="28" rx="14" fill="${p.bg3}" opacity="0.35"/>
        <text x="${100 + typeLabel.length * 12 + 40}" y="181" font-size="14" font-weight="600" fill="${p.textDim}">${escapeXml(style)}</text>

        <rect x="${86 + typeLabel.length * 12 + style.length * 10 + 80}" y="162" width="${flowerTypeLabel.length * 9 + 28}" height="28" rx="14" fill="${p.accent2}" opacity="0.15"/>
        <text x="${100 + typeLabel.length * 12 + style.length * 10 + 80}" y="181" font-size="13" font-weight="600" fill="${p.accent2}">${flowerTypeLabel}</text>
    </g>

    <!-- Central focus element -->
    ${buildFocusElement(criteria.focus, p, strain.type, cx, cy)}

    <!-- Center ring -->
    <circle cx="${cx}" cy="${cy}" r="120" fill="none" stroke="${p.accent}" stroke-width="0.6" opacity="0.08" stroke-dasharray="4 8"/>

    <!-- Data bars -->
    <g>${bars.join('\n        ')}</g>

    <!-- Terpenes -->
    ${terpenesBlock}

    <!-- Aromas -->
    ${aromasBlock}

    <!-- Strain name -->
    <g fill="${p.text}" font-family="'Inter',sans-serif">
        <text x="86" y="${footerY}" font-size="${nameFontSize}" font-weight="700">${cleanName}</text>
        ${description ? `<text x="86" y="${footerY + 32}" font-size="16" opacity="0.45">${description}${strain.description && strain.description.length > 100 ? '\u2026' : ''}</text>` : ''}
    </g>

    <!-- Metadata -->
    <g fill="${p.textDim}" font-family="'Inter',sans-serif" opacity="0.55">
        <text x="86" y="${footerY + (description ? 60 : 34)}" font-size="20">${floweringText}${genetics ? ` \u00b7 ${genetics}` : ''}</text>
        <text x="86" y="${footerY + (description ? 88 : 62)}" font-size="16" opacity="0.7">${escapeXml(criteria.focus)} \u00b7 ${escapeXml(criteria.composition)} \u00b7 ${escapeXml(criteria.mood)}</text>
    </g>

    <!-- Signature dots -->
    <g fill="${p.accent}" opacity="0.6">
        <circle cx="1060" cy="${footerY + (description ? 75 : 50)}" r="4"/>
        <circle cx="1080" cy="${footerY + (description ? 75 : 50)}" r="4"/>
        <circle cx="1100" cy="${footerY + (description ? 75 : 50)}" r="4"/>
        <circle cx="1120" cy="${footerY + (description ? 75 : 50)}" r="3" fill="${p.accent2}"/>
    </g>
</svg>`
}

class LocalAiFallbackService {
    diagnosePlant(plant: Plant, lang: Language): PlantDiagnostic {
        return diagnosePlant(plant, lang)
    }

    getMentorResponse(
        plant: Plant,
        query: string,
        ragContext: string,
        lang: Language,
    ): Omit<MentorMessage, 'role'> {
        const diagnosis = diagnosePlant(plant, lang)
        const safeQuery = safe(query)
        const safeRag = safe(ragContext)

        if (isGerman(lang)) {
            return {
                title: `Lokaler Mentor: ${safe(plant.name)}`,
                content: `<p><strong>Hinweis:</strong> KI-API nicht verfügbar. Antwort basiert auf lokaler Analyse.</p><p><strong>Frage:</strong> ${safeQuery}</p><p><strong>Pflanze:</strong> ${safe(formatPlantLine(plant))}</p>${diagnosis.issues.length > 0 ? `<p><strong>Erkannte Probleme:</strong></p><ul>${diagnosis.issues.map((i) => `<li>${safe(i)}</li>`).join('')}</ul>` : '<p>Alle Werte im Normalbereich.</p>'}<p><strong>Relevante Logs:</strong><br/>${safeRag.replace(/\n/g, '<br/>')}</p><p><strong>Empfehlung:</strong> ${safe(diagnosis.topPriority)}</p>`,
            }
        }

        return {
            title: `Local Mentor: ${safe(plant.name)}`,
            content: `<p><strong>Note:</strong> AI API unavailable. This answer uses local heuristic analysis.</p><p><strong>Question:</strong> ${safeQuery}</p><p><strong>Plant:</strong> ${safe(formatPlantLine(plant))}</p>${diagnosis.issues.length > 0 ? `<p><strong>Detected issues:</strong></p><ul>${diagnosis.issues.map((i) => `<li>${safe(i)}</li>`).join('')}</ul>` : '<p>All parameters within normal range.</p>'}<p><strong>Relevant logs:</strong><br/>${safeRag.replace(/\n/g, '<br/>')}</p><p><strong>Recommendation:</strong> ${safe(diagnosis.topPriority)}</p>`,
        }
    }

    getPlantAdvice(plant: Plant, lang: Language): AIResponse {
        const diagnosis = diagnosePlant(plant, lang)
        const issueList =
            diagnosis.issues.length > 0
                ? diagnosis.issues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')
                : isGerman(lang)
                  ? 'Keine akuten Probleme erkannt.'
                  : 'No acute issues detected.'

        if (isGerman(lang)) {
            return {
                title: `Lokale Beratung: ${safe(plant.name)}`,
                content: `Status: ${formatPlantLine(plant)}\n\n${issueList}\n\nHöchste Priorität: ${diagnosis.topPriority}`,
            }
        }

        return {
            title: `Local Advice: ${safe(plant.name)}`,
            content: `Status: ${formatPlantLine(plant)}\n\n${issueList}\n\nTop priority: ${diagnosis.topPriority}`,
        }
    }

    getGardenStatusSummary(plants: Plant[], lang: Language): AIResponse {
        const plantDetails = plants.map((p) => {
            const diag = diagnosePlant(p, lang)
            const status =
                diag.issues.length === 0
                    ? isGerman(lang)
                        ? '✅ OK'
                        : '✅ OK'
                    : `⚠ ${diag.issues.length} ${isGerman(lang) ? 'Problem(e)' : 'issue(s)'}`
            return `${p.name}: ${status} — ${formatPlantLine(p)}`
        })

        if (isGerman(lang)) {
            return {
                title: 'Lokaler Gartenstatus',
                content:
                    plantDetails.length > 0
                        ? `Lokale Analyse (KI nicht verfügbar):\n\n${plantDetails.join('\n')}`
                        : 'Keine aktiven Pflanzen.',
            }
        }
        return {
            title: 'Local Garden Status',
            content:
                plantDetails.length > 0
                    ? `Local analysis (AI unavailable):\n\n${plantDetails.join('\n')}`
                    : 'No active plants.',
        }
    }

    getEquipmentRecommendation(prompt: string, lang: Language): Recommendation {
        return buildEquipmentRecommendation(prompt, lang)
    }

    getNutrientRecommendation(context: NutrientRecommendationContext, lang: Language): string {
        return buildNutrientRecommendation(context, lang)
    }

    generateStrainImage(
        strain: Strain,
        style: ImageStyle,
        criteria: { focus: string; composition: string; mood: string },
        lang: Language,
    ): string {
        const resolved = resolveStyle(style)
        const svg = buildStrainImageSvg(strain, resolved, criteria, lang)
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    }

    getStrainTips(strain: Strain, lang: Language): StructuredGrowTips {
        const thcLevel = strain.thc > 25 ? 'high' : strain.thc > 15 ? 'medium' : 'low'

        if (isGerman(lang)) {
            return {
                nutrientTip:
                    thcLevel === 'high'
                        ? `${strain.name} mit hohem THC (${strain.thc}%) braucht starke PK-Düngung in der Blüte. EC langsam auf 1.8–2.2 steigern.`
                        : `Nährstoffe für ${strain.name} langsam steigern und EC engmaschig messen.`,
                trainingTip:
                    strain.floweringType === 'Autoflower'
                        ? 'Autoflower: Nur sanftes LST, kein Topping. Training in den ersten 3 Wochen abschließen.'
                        : 'Früh mit sanftem LST beginnen, vor starken Eingriffen 48h Erholung einplanen.',
                environmentalTip:
                    'Tag/Nacht-Differenz klein halten, VPD zielgerichtet für die Phase steuern.',
                proTip: 'Jede Anpassung einzeln testen und im Journal mit Datum dokumentieren.',
            }
        }

        return {
            nutrientTip:
                thcLevel === 'high'
                    ? `${strain.name} with high THC (${strain.thc}%) needs strong PK boost during flower. Gradually raise EC to 1.8–2.2.`
                    : `Increase nutrients gradually for ${strain.name} and monitor EC closely.`,
            trainingTip:
                strain.floweringType === 'Autoflower'
                    ? 'Autoflower: Gentle LST only, no topping. Finish all training within the first 3 weeks.'
                    : 'Start with gentle LST early and allow 48h recovery after heavy interventions.',
            environmentalTip: 'Keep day/night swings moderate and target VPD by stage.',
            proTip: 'Test one change at a time and document outcomes in the journal.',
        }
    }

    getGrowLogRagAnswer(query: string, ragContext: string, lang: Language): AIResponse {
        const safeQuery = safe(query)
        const safeRag = safe(ragContext)

        if (isGerman(lang)) {
            return {
                title: 'RAG-Analyse (lokaler Fallback)',
                content: `Frage: ${safeQuery}\n\nRelevante Einträge:\n${safeRag}\n\nKurzfazit: Wiederkehrende Muster zuerst beheben (Bewässerung, VPD, Lichtabstand) und Wirkung 24-48h verfolgen.`,
            }
        }

        return {
            title: 'RAG Analysis (local fallback)',
            content: `Question: ${safeQuery}\n\nRelevant entries:\n${safeRag}\n\nSummary: resolve recurring patterns first (watering, VPD, light distance) and track outcomes for 24-48h.`,
        }
    }
}

export const localAiFallbackService = new LocalAiFallbackService()
