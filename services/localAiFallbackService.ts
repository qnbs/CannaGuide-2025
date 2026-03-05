import { AIResponse, MentorMessage, Plant, Strain, StructuredGrowTips, Language } from '@/types'

const isGerman = (lang: Language) => lang === 'de'

const formatPlantLine = (plant: Plant) =>
    `${plant.name}: health ${plant.health.toFixed(0)}%, stress ${plant.stressLevel.toFixed(0)}%, VPD ${plant.environment.vpd.toFixed(2)} kPa`

class LocalAiFallbackService {
    getMentorResponse(plant: Plant, query: string, ragContext: string, lang: Language): Omit<MentorMessage, 'role'> {
        if (isGerman(lang)) {
            return {
                title: `Lokaler Mentor-Fallback: ${plant.name}`,
                content: `<p><strong>Hinweis:</strong> Gemini ist aktuell nicht verfügbar. Antwort basiert auf lokalem Heuristik-Modell.</p><p><strong>Frage:</strong> ${query}</p><p><strong>Pflanze:</strong> ${formatPlantLine(plant)}</p><p><strong>Relevante Grow-Logs:</strong><br/>${ragContext.replace(/\n/g, '<br/>')}</p><p><strong>Empfehlung:</strong> Stabilisiere VPD, arbeite in kleinen Schritten und dokumentiere jede Änderung im Journal.</p>`,
            }
        }

        return {
            title: `Local Mentor Fallback: ${plant.name}`,
            content: `<p><strong>Note:</strong> Gemini is unavailable. This answer uses a local heuristic fallback.</p><p><strong>Question:</strong> ${query}</p><p><strong>Plant:</strong> ${formatPlantLine(plant)}</p><p><strong>Relevant grow logs:</strong><br/>${ragContext.replace(/\n/g, '<br/>')}</p><p><strong>Recommendation:</strong> Stabilize VPD first, then apply one controlled change at a time and log outcomes.</p>`,
        }
    }

    getPlantAdvice(plant: Plant, lang: Language): AIResponse {
        if (isGerman(lang)) {
            return {
                title: `Lokale Beratung: ${plant.name}`,
                content: `Priorität 1: VPD und Feuchte stabilisieren. Priorität 2: pH/EC im Zielbereich halten. Priorität 3: Stressquellen reduzieren. Aktuell: ${formatPlantLine(plant)}.`,
            }
        }

        return {
            title: `Local Advice: ${plant.name}`,
            content: `Priority 1: stabilize VPD and humidity. Priority 2: keep pH/EC in range. Priority 3: reduce stressors. Current state: ${formatPlantLine(plant)}.`,
        }
    }

    getGardenStatusSummary(plants: Plant[], lang: Language): AIResponse {
        const lines = plants.map(formatPlantLine).join(' | ')
        if (isGerman(lang)) {
            return {
                title: 'Lokaler Gartenstatus',
                content: `Gemini nicht verfügbar. Lokale Zusammenfassung: ${lines || 'Keine aktiven Pflanzen.'}`,
            }
        }
        return {
            title: 'Local Garden Status',
            content: `Gemini unavailable. Local summary: ${lines || 'No active plants.'}`,
        }
    }

    getStrainTips(strain: Strain, lang: Language): StructuredGrowTips {
        if (isGerman(lang)) {
            return {
                nutrientTip: `Nährstoffe für ${strain.name} langsam steigern und EC engmaschig messen.`,
                trainingTip: 'Früh mit sanftem LST beginnen, vor starken Eingriffen 48h Erholung einplanen.',
                environmentalTip: 'Tag/Nacht-Differenz klein halten, VPD zielgerichtet für die Phase steuern.',
                proTip: 'Jede Anpassung einzeln testen und im Journal mit Datum dokumentieren.',
            }
        }

        return {
            nutrientTip: `Increase nutrients gradually for ${strain.name} and monitor EC closely.`,
            trainingTip: 'Start with gentle LST early and allow 48h recovery after heavy interventions.',
            environmentalTip: 'Keep day/night swings moderate and target VPD by stage.',
            proTip: 'Test one change at a time and document outcomes in the journal.',
        }
    }

    getGrowLogRagAnswer(query: string, ragContext: string, lang: Language): AIResponse {
        if (isGerman(lang)) {
            return {
                title: 'RAG-Analyse (lokaler Fallback)',
                content: `Frage: ${query}\n\nRelevante Einträge:\n${ragContext}\n\nKurzfazit: Wiederkehrende Muster zuerst beheben (Bewässerung, VPD, Lichtabstand) und Wirkung 24-48h verfolgen.`,
            }
        }

        return {
            title: 'RAG Analysis (local fallback)',
            content: `Question: ${query}\n\nRelevant entries:\n${ragContext}\n\nSummary: resolve recurring patterns first (watering, VPD, light distance) and track outcomes for 24-48h.`,
        }
    }
}

export const localAiFallbackService = new LocalAiFallbackService()
