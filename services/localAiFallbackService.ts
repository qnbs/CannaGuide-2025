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

const isGerman = (lang: Language) => lang === 'de'

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
    const normalized = prompt.toLowerCase()
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
