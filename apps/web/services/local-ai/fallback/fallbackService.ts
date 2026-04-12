// ---------------------------------------------------------------------------
// fallbackService.ts -- Slim orchestrator for heuristic AI fallbacks
// ---------------------------------------------------------------------------
// Domain logic has been extracted into focused modules:
//   - diagnosisFallback.ts  (plant analysis heuristics)
//   - equipmentFallback.ts  (equipment recommendation builder)
//   - nutrientFallback.ts   (nutrient recommendation builder)
//   - strainImageFallback.ts (SVG strain poster generation)
// This file retains the LocalAiFallbackService class that delegates to them.
// ---------------------------------------------------------------------------

import type {
    AIResponse,
    MentorMessage,
    Recommendation,
    Plant,
    Strain,
    StructuredGrowTips,
    Language,
} from '@/types'
import DOMPurify from 'dompurify'
import type { ImageStyle, NutrientContext } from '@/types/aiProvider'
import { recordFallbackEvent } from '../telemetry/telemetryService'
import { diagnosePlant, type PlantDiagnostic } from './diagnosisFallback'
import { buildEquipmentRecommendation } from './equipmentFallback'
import { buildNutrientRecommendation } from './nutrientFallback'
import { buildStrainImage } from './strainImageFallback'

// Re-export for backward compatibility
export { diagnosePlant, type PlantDiagnostic } from './diagnosisFallback'

type NutrientRecommendationContext = NutrientContext

const isGerman = (lang: Language): boolean => lang === 'de'

/** Resolve a localized string with English fallback. */
const localizeStr = (lang: Language, texts: Record<string, string>): string =>
    texts[lang] ?? texts['en'] ?? ''

const formatPlantLine = (plant: Plant): string =>
    `${plant.name}: health ${plant.health.toFixed(0)}%, stress ${plant.stressLevel.toFixed(0)}%, VPD ${plant.environment.vpd.toFixed(2)} kPa`

const safe = (text: string): string =>
    DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })

class LocalAiFallbackService {
    private track(method: string): void {
        recordFallbackEvent('heuristic', method)
    }

    diagnosePlant(plant: Plant, lang: Language): PlantDiagnostic {
        this.track('diagnosePlant')
        return diagnosePlant(plant, lang)
    }

    getMentorResponse(
        plant: Plant,
        query: string,
        ragContext: string,
        lang: Language,
    ): Omit<MentorMessage, 'role'> {
        this.track('getMentorResponse')
        const diagnosis = diagnosePlant(plant, lang)
        const safeQuery = safe(query)
        const safeRag = safe(ragContext)
        const issueListHtml = diagnosis.issues.map((issue) => `<li>${safe(issue)}</li>`).join('')
        const hasIssues = diagnosis.issues.length > 0
        const issuesSectionDe = hasIssues
            ? `<p><strong>Erkannte Probleme:</strong></p><ul>${issueListHtml}</ul>`
            : '<p>Alle Werte im Normalbereich.</p>'
        const issuesSectionEn = hasIssues
            ? `<p><strong>Detected issues:</strong></p><ul>${issueListHtml}</ul>`
            : '<p>All parameters within normal range.</p>'

        if (isGerman(lang)) {
            return {
                title: `Lokaler Mentor: ${safe(plant.name)}`,
                content: `<p><strong>Hinweis:</strong> KI-API nicht verf\u00fcgbar. Antwort basiert auf lokaler Analyse.</p><p><strong>Frage:</strong> ${safeQuery}</p><p><strong>Pflanze:</strong> ${safe(formatPlantLine(plant))}</p>${issuesSectionDe}<p><strong>Relevante Logs:</strong><br/>${safeRag.replace(/\n/g, '<br/>')}</p><p><strong>Empfehlung:</strong> ${safe(diagnosis.topPriority)}</p>`,
            }
        }

        return {
            title: `Local Mentor: ${safe(plant.name)}`,
            content: `<p><strong>Note:</strong> AI API unavailable. This answer uses local heuristic analysis.</p><p><strong>Question:</strong> ${safeQuery}</p><p><strong>Plant:</strong> ${safe(formatPlantLine(plant))}</p>${issuesSectionEn}<p><strong>Relevant logs:</strong><br/>${safeRag.replace(/\n/g, '<br/>')}</p><p><strong>Recommendation:</strong> ${safe(diagnosis.topPriority)}</p>`,
        }
    }

    getPlantAdvice(plant: Plant, lang: Language): AIResponse {
        this.track('getPlantAdvice')
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
                content: `Status: ${formatPlantLine(plant)}\n\n${issueList}\n\nH\u00f6chste Priorit\u00e4t: ${diagnosis.topPriority}`,
            }
        }

        return {
            title: localizeStr(lang, {
                en: `Local Advice: ${safe(plant.name)}`,
                es: `Consejo Local: ${safe(plant.name)}`,
                fr: `Conseil Local: ${safe(plant.name)}`,
                nl: `Lokaal Advies: ${safe(plant.name)}`,
            }),
            content: `Status: ${formatPlantLine(plant)}\n\n${issueList}\n\nTop priority: ${diagnosis.topPriority}`,
        }
    }

    getGardenStatusSummary(plants: Plant[], lang: Language): AIResponse {
        this.track('getGardenStatusSummary')
        const plantDetails = plants.map((p) => {
            const diag = diagnosePlant(p, lang)
            const issuesLabel = isGerman(lang) ? 'Problem(e)' : 'issue(s)'
            const status =
                diag.issues.length === 0 ? '[OK]' : `[WARN] ${diag.issues.length} ${issuesLabel}`
            return `${p.name}: ${status} \u2014 ${formatPlantLine(p)}`
        })

        if (isGerman(lang)) {
            return {
                title: 'Lokaler Gartenstatus',
                content:
                    plantDetails.length > 0
                        ? `Lokale Analyse (KI nicht verf\u00fcgbar):\n\n${plantDetails.join('\n')}`
                        : 'Keine aktiven Pflanzen.',
            }
        }
        return {
            title: localizeStr(lang, {
                en: 'Local Garden Status',
                es: 'Estado Local del Jardin',
                fr: 'Etat Local du Jardin',
                nl: 'Lokale Tuinstatus',
            }),
            content:
                plantDetails.length > 0
                    ? `Local analysis (AI unavailable):\n\n${plantDetails.join('\n')}`
                    : 'No active plants.',
        }
    }

    getEquipmentRecommendation(prompt: string, lang: Language): Recommendation {
        this.track('getEquipmentRecommendation')
        return buildEquipmentRecommendation(prompt, lang)
    }

    getNutrientRecommendation(context: NutrientRecommendationContext, lang: Language): string {
        this.track('getNutrientRecommendation')
        return buildNutrientRecommendation(context, lang)
    }

    generateStrainImage(
        strain: Strain,
        style: ImageStyle,
        criteria: { focus: string; composition: string; mood: string },
        lang: Language,
    ): string {
        this.track('generateStrainImage')
        return buildStrainImage(strain, style, criteria, lang)
    }

    getStrainTips(strain: Strain, lang: Language): StructuredGrowTips {
        this.track('getStrainTips')
        let thcLevel: 'high' | 'medium' | 'low' = 'low'
        if (strain.thc > 25) {
            thcLevel = 'high'
        } else if (strain.thc > 15) {
            thcLevel = 'medium'
        }

        if (isGerman(lang)) {
            return {
                nutrientTip:
                    thcLevel === 'high'
                        ? `${strain.name} mit hohem THC (${strain.thc}%) braucht starke PK-D\u00fcngung in der Bl\u00fcte. EC langsam auf 1.8\u20132.2 steigern.`
                        : `N\u00e4hrstoffe f\u00fcr ${strain.name} langsam steigern und EC engmaschig messen.`,
                trainingTip:
                    strain.floweringType === 'Autoflower'
                        ? 'Autoflower: Nur sanftes LST, kein Topping. Training in den ersten 3 Wochen abschlie\u00dfen.'
                        : 'Fr\u00fch mit sanftem LST beginnen, vor starken Eingriffen 48h Erholung einplanen.',
                environmentalTip:
                    'Tag/Nacht-Differenz klein halten, VPD zielgerichtet f\u00fcr die Phase steuern.',
                proTip: 'Jede Anpassung einzeln testen und im Journal mit Datum dokumentieren.',
            }
        }

        return {
            nutrientTip:
                thcLevel === 'high'
                    ? `${strain.name} with high THC (${strain.thc}%) needs strong PK boost during flower. Gradually raise EC to 1.8\u20132.2.`
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
        this.track('getGrowLogRagAnswer')
        const safeQuery = safe(query)
        const safeRag = safe(ragContext)

        if (isGerman(lang)) {
            return {
                title: 'RAG-Analyse (lokaler Fallback)',
                content: `Frage: ${safeQuery}\n\nRelevante Eintr\u00e4ge:\n${safeRag}\n\nKurzfazit: Wiederkehrende Muster zuerst beheben (Bew\u00e4sserung, VPD, Lichtabstand) und Wirkung 24-48h verfolgen.`,
            }
        }

        return {
            title: localizeStr(lang, {
                en: 'RAG Analysis (local fallback)',
                es: 'Analisis RAG (alternativa local)',
                fr: 'Analyse RAG (alternative locale)',
                nl: 'RAG-Analyse (lokale terugval)',
            }),
            content: `Question: ${safeQuery}\n\nRelevant entries:\n${safeRag}\n\nSummary: resolve recurring patterns first (watering, VPD, light distance) and track outcomes for 24-48h.`,
        }
    }
}

export const localAiFallbackService = new LocalAiFallbackService()
