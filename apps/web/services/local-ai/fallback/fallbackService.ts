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
import { localizeStr } from './localeHelpers'

// Re-export for backward compatibility
export { diagnosePlant, type PlantDiagnostic } from './diagnosisFallback'

type NutrientRecommendationContext = NutrientContext

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
        const issuesSection = hasIssues
            ? `<p><strong>${localizeStr(lang, { en: 'Detected issues', de: 'Erkannte Probleme', es: 'Problemas detectados', fr: 'Problemes detectes', nl: 'Gedetecteerde problemen' })}:</strong></p><ul>${issueListHtml}</ul>`
            : `<p>${localizeStr(lang, { en: 'All parameters within normal range.', de: 'Alle Werte im Normalbereich.', es: 'Todos los parametros dentro del rango normal.', fr: 'Tous les parametres dans la plage normale.', nl: 'Alle parameters binnen normaal bereik.' })}</p>`

        const titlePrefix = localizeStr(lang, {
            en: 'Local Mentor',
            de: 'Lokaler Mentor',
            es: 'Mentor Local',
            fr: 'Mentor Local',
            nl: 'Lokale Mentor',
        })
        const noteLabel = localizeStr(lang, {
            en: 'Note',
            de: 'Hinweis',
            es: 'Nota',
            fr: 'Remarque',
            nl: 'Opmerking',
        })
        const noteText = localizeStr(lang, {
            en: 'AI API unavailable. This answer uses local heuristic analysis.',
            de: 'KI-API nicht verf\u00fcgbar. Antwort basiert auf lokaler Analyse.',
            es: 'API de IA no disponible. Esta respuesta usa analisis heuristico local.',
            fr: 'API IA indisponible. Reponse basee sur une analyse heuristique locale.',
            nl: 'AI API niet beschikbaar. Dit antwoord gebruikt lokale heuristische analyse.',
        })
        const questionLabel = localizeStr(lang, {
            en: 'Question',
            de: 'Frage',
            es: 'Pregunta',
            fr: 'Question',
            nl: 'Vraag',
        })
        const plantLabel = localizeStr(lang, {
            en: 'Plant',
            de: 'Pflanze',
            es: 'Planta',
            fr: 'Plante',
            nl: 'Plant',
        })
        const logsLabel = localizeStr(lang, {
            en: 'Relevant logs',
            de: 'Relevante Logs',
            es: 'Registros relevantes',
            fr: 'Journaux pertinents',
            nl: 'Relevante logs',
        })
        const recLabel = localizeStr(lang, {
            en: 'Recommendation',
            de: 'Empfehlung',
            es: 'Recomendacion',
            fr: 'Recommandation',
            nl: 'Aanbeveling',
        })

        return {
            title: `${titlePrefix}: ${safe(plant.name)}`,
            content: `<p><strong>${noteLabel}:</strong> ${noteText}</p><p><strong>${questionLabel}:</strong> ${safeQuery}</p><p><strong>${plantLabel}:</strong> ${safe(formatPlantLine(plant))}</p>${issuesSection}<p><strong>${logsLabel}:</strong><br/>${safeRag.replace(/\n/g, '<br/>')}</p><p><strong>${recLabel}:</strong> ${safe(diagnosis.topPriority)}</p>`,
        }
    }

    getPlantAdvice(plant: Plant, lang: Language): AIResponse {
        this.track('getPlantAdvice')
        const diagnosis = diagnosePlant(plant, lang)
        const noIssuesText = localizeStr(lang, {
            en: 'No acute issues detected.',
            de: 'Keine akuten Probleme erkannt.',
            es: 'No se detectaron problemas agudos.',
            fr: 'Aucun probleme aigu detecte.',
            nl: 'Geen acute problemen gedetecteerd.',
        })
        const issueList =
            diagnosis.issues.length > 0
                ? diagnosis.issues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')
                : noIssuesText

        const advicePrefix = localizeStr(lang, {
            en: 'Local Advice',
            de: 'Lokale Beratung',
            es: 'Consejo Local',
            fr: 'Conseil Local',
            nl: 'Lokaal Advies',
        })
        const priorityLabel = localizeStr(lang, {
            en: 'Top priority',
            de: 'H\u00f6chste Priorit\u00e4t',
            es: 'Maxima prioridad',
            fr: 'Priorite absolue',
            nl: 'Hoogste prioriteit',
        })

        return {
            title: `${advicePrefix}: ${safe(plant.name)}`,
            content: `Status: ${formatPlantLine(plant)}\n\n${issueList}\n\n${priorityLabel}: ${diagnosis.topPriority}`,
        }
    }

    getGardenStatusSummary(plants: Plant[], lang: Language): AIResponse {
        this.track('getGardenStatusSummary')
        const issuesLabel = localizeStr(lang, {
            en: 'issue(s)',
            de: 'Problem(e)',
            es: 'problema(s)',
            fr: 'probleme(s)',
            nl: 'probleem/problemen',
        })
        const plantDetails = plants.map((p) => {
            const diag = diagnosePlant(p, lang)
            const status =
                diag.issues.length === 0 ? '[OK]' : `[WARN] ${diag.issues.length} ${issuesLabel}`
            return `${p.name}: ${status} \u2014 ${formatPlantLine(p)}`
        })

        const gardenTitle = localizeStr(lang, {
            en: 'Local Garden Status',
            de: 'Lokaler Gartenstatus',
            es: 'Estado Local del Jardin',
            fr: 'Etat Local du Jardin',
            nl: 'Lokale Tuinstatus',
        })
        const analysisPrefix = localizeStr(lang, {
            en: 'Local analysis (AI unavailable)',
            de: 'Lokale Analyse (KI nicht verf\u00fcgbar)',
            es: 'Analisis local (IA no disponible)',
            fr: 'Analyse locale (IA indisponible)',
            nl: 'Lokale analyse (AI niet beschikbaar)',
        })
        const noPlantsText = localizeStr(lang, {
            en: 'No active plants.',
            de: 'Keine aktiven Pflanzen.',
            es: 'No hay plantas activas.',
            fr: 'Aucune plante active.',
            nl: 'Geen actieve planten.',
        })

        return {
            title: gardenTitle,
            content:
                plantDetails.length > 0
                    ? `${analysisPrefix}:\n\n${plantDetails.join('\n')}`
                    : noPlantsText,
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

        const highThcNutrient = localizeStr(lang, {
            en: `${strain.name} with high THC (${strain.thc}%) needs strong PK boost during flower. Gradually raise EC to 1.8\u20132.2.`,
            de: `${strain.name} mit hohem THC (${strain.thc}%) braucht starke PK-D\u00fcngung in der Bl\u00fcte. EC langsam auf 1.8\u20132.2 steigern.`,
            es: `${strain.name} con alto THC (${strain.thc}%) necesita un fuerte refuerzo PK en floracion. Aumentar EC gradualmente a 1.8\u20132.2.`,
            fr: `${strain.name} avec THC eleve (${strain.thc}%) necessite un boost PK fort en floraison. Augmenter EC progressivement a 1.8\u20132.2.`,
            nl: `${strain.name} met hoog THC (${strain.thc}%) heeft een sterke PK-boost nodig in de bloei. EC geleidelijk verhogen naar 1.8\u20132.2.`,
        })
        const defaultNutrient = localizeStr(lang, {
            en: `Increase nutrients gradually for ${strain.name} and monitor EC closely.`,
            de: `N\u00e4hrstoffe f\u00fcr ${strain.name} langsam steigern und EC engmaschig messen.`,
            es: `Aumentar nutrientes gradualmente para ${strain.name} y monitorear EC de cerca.`,
            fr: `Augmenter les nutriments progressivement pour ${strain.name} et surveiller l'EC de pres.`,
            nl: `Voeding geleidelijk verhogen voor ${strain.name} en EC nauwlettend monitoren.`,
        })

        return {
            nutrientTip: thcLevel === 'high' ? highThcNutrient : defaultNutrient,
            trainingTip:
                strain.floweringType === 'Autoflower'
                    ? localizeStr(lang, {
                          en: 'Autoflower: Gentle LST only, no topping. Finish all training within the first 3 weeks.',
                          de: 'Autoflower: Nur sanftes LST, kein Topping. Training in den ersten 3 Wochen abschliessen.',
                          es: 'Autofloreciente: Solo LST suave, sin topping. Terminar todo el entrenamiento en las primeras 3 semanas.',
                          fr: 'Autofloraison: LST leger uniquement, pas de topping. Terminer tout le palissage dans les 3 premieres semaines.',
                          nl: 'Autoflower: Alleen zacht LST, geen topping. Alle training binnen de eerste 3 weken afronden.',
                      })
                    : localizeStr(lang, {
                          en: 'Start with gentle LST early and allow 48h recovery after heavy interventions.',
                          de: 'Fr\u00fch mit sanftem LST beginnen, vor starken Eingriffen 48h Erholung einplanen.',
                          es: 'Comenzar con LST suave temprano y permitir 48h de recuperacion tras intervenciones fuertes.',
                          fr: 'Commencer le LST tot et prevoir 48h de recuperation apres des interventions lourdes.',
                          nl: 'Begin vroeg met zacht LST en plan 48u herstel in na zware ingrepen.',
                      }),
            environmentalTip: localizeStr(lang, {
                en: 'Keep day/night swings moderate and target VPD by stage.',
                de: 'Tag/Nacht-Differenz klein halten, VPD zielgerichtet f\u00fcr die Phase steuern.',
                es: 'Mantener oscilaciones dia/noche moderadas y ajustar VPD segun la fase.',
                fr: 'Maintenir les ecarts jour/nuit moderes et cibler le VPD par phase.',
                nl: 'Dag/nacht-schommelingen beperkt houden en VPD per fase sturen.',
            }),
            proTip: localizeStr(lang, {
                en: 'Test one change at a time and document outcomes in the journal.',
                de: 'Jede Anpassung einzeln testen und im Journal mit Datum dokumentieren.',
                es: 'Probar un cambio a la vez y documentar los resultados en el diario.',
                fr: 'Tester un changement a la fois et documenter les resultats dans le journal.',
                nl: 'Test een wijziging tegelijk en documenteer resultaten in het dagboek.',
            }),
        }
    }

    getGrowLogRagAnswer(query: string, ragContext: string, lang: Language): AIResponse {
        this.track('getGrowLogRagAnswer')
        const safeQuery = safe(query)
        const safeRag = safe(ragContext)

        return {
            title: localizeStr(lang, {
                en: 'RAG Analysis (local fallback)',
                de: 'RAG-Analyse (lokaler Fallback)',
                es: 'Analisis RAG (alternativa local)',
                fr: 'Analyse RAG (alternative locale)',
                nl: 'RAG-Analyse (lokale terugval)',
            }),
            content: localizeStr(lang, {
                en: `Question: ${safeQuery}\n\nRelevant entries:\n${safeRag}\n\nSummary: resolve recurring patterns first (watering, VPD, light distance) and track outcomes for 24-48h.`,
                de: `Frage: ${safeQuery}\n\nRelevante Eintr\u00e4ge:\n${safeRag}\n\nKurzfazit: Wiederkehrende Muster zuerst beheben (Bew\u00e4sserung, VPD, Lichtabstand) und Wirkung 24-48h verfolgen.`,
                es: `Pregunta: ${safeQuery}\n\nEntradas relevantes:\n${safeRag}\n\nResumen: resolver patrones recurrentes primero (riego, VPD, distancia de luz) y rastrear resultados 24-48h.`,
                fr: `Question: ${safeQuery}\n\nEntrees pertinentes:\n${safeRag}\n\nResume: resoudre les schemas recurrents d'abord (arrosage, VPD, distance lumiere) et suivre les resultats 24-48h.`,
                nl: `Vraag: ${safeQuery}\n\nRelevante entries:\n${safeRag}\n\nSamenvatting: terugkerende patronen eerst oplossen (bewatering, VPD, lichtafstand) en resultaten 24-48u bijhouden.`,
            }),
        }
    }
}

export const localAiFallbackService = new LocalAiFallbackService()
