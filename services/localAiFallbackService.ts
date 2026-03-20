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

const buildStylePalette = (
    style: ImageStyle,
): { a: string; b: string; c: string; accent: string } => {
    switch (style) {
        case 'fantasy':
            return { a: '#1b1333', b: '#35215f', c: '#7c3aed', accent: '#f9a8d4' }
        case 'botanical':
            return { a: '#071a12', b: '#0f3d2e', c: '#34d399', accent: '#86efac' }
        case 'psychedelic':
            return { a: '#1f0f2f', b: '#6d28d9', c: '#ec4899', accent: '#fde047' }
        case 'macro':
            return { a: '#101820', b: '#243b53', c: '#60a5fa', accent: '#f8fafc' }
        case 'cyberpunk':
            return { a: '#05111d', b: '#0f172a', c: '#22d3ee', accent: '#fb7185' }
        default:
            return { a: '#09131f', b: '#13253a', c: '#34d399', accent: '#e2e8f0' }
    }
}

/** Build a type-specific cannabis leaf SVG shape (Indica=broad, Sativa=narrow, Hybrid=blend). */
const buildLeafPath = (strainType: string): string => {
    const t = strainType.toLowerCase()
    if (t.includes('indica')) {
        // Broad, rounded indica leaf
        return 'M0 -240 C80 -170 160 -80 150 20 C144 90 80 170 0 280 C-80 170 -144 90 -150 20 C-160 -80 -80 -170 0 -240Z'
    }
    if (t.includes('sativa')) {
        // Tall, narrow sativa leaf
        return 'M0 -320 C40 -250 75 -140 72 -20 C70 60 50 180 0 310 C-50 180 -70 60 -72 -20 C-75 -140 -40 -250 0 -320Z'
    }
    // Hybrid — balanced shape
    return 'M0 -290 C60 -210 120 -130 128 -30 C132 40 88 120 0 250 C-88 120 -132 40 -128 -30 C-120 -130 -60 -210 0 -290Z'
}

/** Render a horizontal data bar at the given y position. */
const svgDataBar = (
    x: number,
    y: number,
    label: string,
    value: number,
    maxVal: number,
    barColor: string,
): string => {
    const barWidth = Math.min(1, Math.max(0, value / maxVal)) * 380
    return `<text x="${x}" y="${y}" font-size="20" fill="#94a3b8" font-family="Inter, Arial, sans-serif">${escapeXml(label)}</text>
    <rect x="${x + 120}" y="${y - 14}" width="380" height="16" rx="8" fill="#1e293b" opacity="0.7"/>
    <rect x="${x + 120}" y="${y - 14}" width="${barWidth}" height="16" rx="8" fill="${barColor}" opacity="0.85"/>
    <text x="${x + 510}" y="${y}" font-size="18" fill="#e2e8f0" font-family="Inter, Arial, sans-serif">${value}%</text>`
}

/** Render terpene dots (colored circles for up to 5 dominant terpenes). */
const svgTerpeneDots = (x: number, y: number, terpenes: string[], accent: string): string => {
    const terpeneColors: Record<string, string> = {
        myrcene: '#86efac',
        limonene: '#fde047',
        caryophyllene: '#f97316',
        pinene: '#34d399',
        linalool: '#c084fc',
        terpinolene: '#22d3ee',
        ocimene: '#fb923c',
        humulene: '#a78bfa',
        bisabolol: '#f9a8d4',
    }
    const shown = terpenes.slice(0, 5)
    return shown
        .map((t, i) => {
            const color = terpeneColors[t.toLowerCase()] ?? accent
            const cx = x + i * 40
            return `<circle cx="${cx}" cy="${y}" r="12" fill="${color}" opacity="0.9"/>
        <text x="${cx}" y="${y + 28}" font-size="11" fill="#94a3b8" font-family="Inter, Arial, sans-serif" text-anchor="middle">${escapeXml(t.slice(0, 4))}</text>`
        })
        .join('\n    ')
}

const buildStrainImageSvg = (
    strain: Strain,
    style: Exclude<ImageStyle, 'random'>,
    criteria: { focus: string; composition: string; mood: string },
    lang: Language,
): string => {
    const palette = buildStylePalette(style)
    const cleanName = escapeXml(strain.name).slice(0, 42)
    const cleanFocus = escapeXml(criteria.focus)
    const cleanComposition = escapeXml(criteria.composition)
    const cleanMood = escapeXml(criteria.mood)
    const title = isGerman(lang) ? 'Lokale Strain-Vorschau' : 'Local Strain Preview'
    const subtitle = isGerman(lang)
        ? 'SVG-Poster aus dem lokalen Fallback'
        : 'SVG poster from local fallback'
    const leafPath = buildLeafPath(strain.type)
    const typeLabel = escapeXml(strain.type)
    const thcLabel = isGerman(lang) ? 'THC' : 'THC'
    const cbdLabel = isGerman(lang) ? 'CBD' : 'CBD'
    const diffLabel = isGerman(lang) ? 'Schwierigkeit' : 'Difficulty'
    const yieldLabel = isGerman(lang) ? 'Ertrag' : 'Yield'

    const difficultyMap: Record<string, number> = {
        easy: 25,
        moderate: 50,
        difficult: 75,
        expert: 100,
    }
    const yieldMap: Record<string, number> = { low: 25, medium: 50, high: 75, 'very high': 100 }
    const diffVal = difficultyMap[strain.agronomic.difficulty] ?? 50
    const yieldVal = yieldMap[strain.agronomic.yield] ?? 50

    const terpenes = strain.dominantTerpenes ?? []
    const aromas = (strain.aromas ?? [])
        .slice(0, 4)
        .map((a) => escapeXml(a))
        .join(' · ')
    const floweringText = isGerman(lang)
        ? `${strain.floweringTime} Tage Blüte`
        : `${strain.floweringTime}d flowering`

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1400" role="img" aria-label="${cleanName} — ${typeLabel} cannabis strain poster">
    <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${palette.a}" />
            <stop offset="55%" stop-color="${palette.b}" />
            <stop offset="100%" stop-color="${palette.c}" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="35%" r="50%">
            <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.45" />
            <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0" />
        </radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="18" /></filter>
        <filter id="softglow">
            <feGaussianBlur stdDeviation="6" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
    </defs>

    <!-- Background -->
    <rect width="1200" height="1400" fill="url(#bg)" />
    <rect width="1200" height="1400" fill="url(#glow)" />

    <!-- Ambient shapes -->
    <g filter="url(#blur)" opacity="0.32">
        <circle cx="250" cy="260" r="140" fill="${palette.accent}" />
        <circle cx="920" cy="350" r="180" fill="${palette.c}" />
        <circle cx="180" cy="1050" r="200" fill="${palette.b}" />
        <circle cx="950" cy="1150" r="160" fill="${palette.accent}" />
    </g>

    <!-- Header -->
    <g fill="#e2e8f0" font-family="Inter, Arial, sans-serif">
        <text x="86" y="110" font-size="40" font-weight="700" letter-spacing="4">${escapeXml(title.toUpperCase())}</text>
        <text x="86" y="154" font-size="22" opacity="0.75">${escapeXml(subtitle)}</text>
    </g>

    <!-- Type badge -->
    <rect x="86" y="178" width="${typeLabel.length * 13 + 36}" height="32" rx="16" fill="${palette.accent}" opacity="0.2"/>
    <text x="104" y="200" font-size="18" font-weight="600" fill="${palette.accent}" font-family="Inter, Arial, sans-serif">${typeLabel}</text>

    <!-- Style badge -->
    <rect x="${86 + typeLabel.length * 13 + 52}" y="178" width="${style.length * 11 + 36}" height="32" rx="16" fill="${palette.c}" opacity="0.2"/>
    <text x="${104 + typeLabel.length * 13 + 52}" y="200" font-size="16" font-weight="600" fill="${palette.c}" font-family="Inter, Arial, sans-serif">${escapeXml(style)}</text>

    <!-- Leaf (type-specific shape) -->
    <g transform="translate(600 560)" filter="url(#softglow)">
        <path d="${leafPath}" fill="none" stroke="${palette.accent}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
        <path d="${leafPath}" fill="${palette.accent}" opacity="0.06"/>
        <circle cx="0" cy="0" r="80" fill="${palette.accent}" opacity="0.1" />
        <circle cx="0" cy="0" r="30" fill="${palette.accent}" opacity="0.8" />
        <line x1="0" y1="-100" x2="0" y2="100" stroke="${palette.accent}" stroke-width="2" opacity="0.4"/>
    </g>

    <!-- Data section: THC / CBD bars -->
    <g>
        ${svgDataBar(86, 900, thcLabel, strain.thc, 35, palette.accent)}
        ${svgDataBar(86, 940, cbdLabel, strain.cbd, 25, palette.c)}
        ${svgDataBar(86, 980, diffLabel, diffVal, 100, '#f97316')}
        ${svgDataBar(86, 1020, yieldLabel, yieldVal, 100, '#22c55e')}
    </g>

    <!-- Terpene indicators -->
    ${
        terpenes.length > 0
            ? `<g transform="translate(86, 1070)">
        <text x="0" y="0" font-size="18" fill="#94a3b8" font-family="Inter, Arial, sans-serif">${isGerman(lang) ? 'Terpene' : 'Terpenes'}</text>
        ${svgTerpeneDots(0, 30, terpenes, palette.accent)}
    </g>`
            : ''
    }

    <!-- Aromas -->
    ${aromas.length > 0 ? `<text x="86" y="${terpenes.length > 0 ? 1150 : 1080}" font-size="18" fill="#94a3b8" font-family="Inter, Arial, sans-serif">${isGerman(lang) ? 'Aromen' : 'Aromas'}: ${aromas}</text>` : ''}

    <!-- Strain name & metadata -->
    <g fill="#e2e8f0" font-family="Inter, Arial, sans-serif">
        <text x="86" y="1230" font-size="68" font-weight="700">${cleanName}</text>
        <text x="86" y="1282" font-size="26" opacity="0.85">${cleanFocus} · ${cleanComposition} · ${cleanMood}</text>
        <text x="86" y="1320" font-size="22" opacity="0.6">${floweringText}${strain.genetics ? ` · ${escapeXml(strain.genetics).slice(0, 50)}` : ''}</text>
    </g>

    <!-- Decorative dots -->
    <g fill="${palette.accent}" opacity="0.8">
        <circle cx="1060" cy="1280" r="5" />
        <circle cx="1085" cy="1280" r="5" />
        <circle cx="1110" cy="1280" r="5" />
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
