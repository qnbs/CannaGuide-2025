import React, { memo, useState } from 'react'
import { Card } from '@/components/common/Card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/common/Button'
import { useActivePlants } from '@/hooks/useSimulationBridge'
import { useAppSelector } from '@/stores/store'
import { selectLanguage } from '@/stores/selectors'
import { geminiService } from '@/services/geminiService'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

const GrowLogRagPanelComponent: React.FC = () => {
    const plants = useActivePlants()
    const lang = useAppSelector(selectLanguage)
    const [query, setQuery] = useState('')
    const [answer, setAnswer] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    const handleAnalyze = async () => {
        if (!query.trim()) return
        setIsLoading(true)
        try {
            const result = await geminiService.getGrowLogRagAnswer(plants, query.trim(), lang)
            setAnswer(`${result.title}\n\n${result.content}`)
        } catch (error) {
            setAnswer(error instanceof Error ? error.message : 'Analysis failed.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="!p-4 bg-slate-800/40">
            <h4 className="text-lg font-bold text-primary-300 flex items-center gap-2">
                <PhosphorIcons.Database className="w-5 h-5" />
                Grow-Log RAG
            </h4>
            <p className="text-sm text-slate-300 mt-1">
                Frage dein eigenes Journal direkt ab. Relevante Log-Eintrage werden zuerst geladen und dann analysiert.
            </p>
            <div className="mt-3 space-y-3">
                <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="z. B. Warum schwankt mein VPD in Woche 4?"
                    rows={3}
                />
                <Button onClick={handleAnalyze} disabled={!query.trim() || isLoading} className="w-full">
                    <PhosphorIcons.MagnifyingGlass className="w-5 h-5 mr-2" />
                    {isLoading ? 'Analysiere...' : 'RAG Analyse starten'}
                </Button>
                {answer && (
                    <pre className="whitespace-pre-wrap text-sm bg-slate-900/60 p-3 rounded-lg ring-1 ring-inset ring-white/20 text-slate-200">
                        {answer}
                    </pre>
                )}
                <p className="text-xs text-slate-400">Aktive Pflanzen im RAG-Korpus: {plants.length}</p>
            </div>
        </Card>
    )
}

export const GrowLogRagPanel = memo(GrowLogRagPanelComponent)
