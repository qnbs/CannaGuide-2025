import React, { useState, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'
import { getNode, getMaxDepth, isResult } from '@/services/nutrientDeficiencyService'
import type { DiagnosisNode } from '@/services/nutrientDeficiencyService'

// ---------------------------------------------------------------------------
// Severity badge colours (shared pattern from LeafDiagnosisPanel)
// ---------------------------------------------------------------------------

const SEVERITY_COLOURS: Readonly<Record<string, string>> = {
    mild: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
    moderate: 'bg-orange-900/50 text-orange-300 border border-orange-700',
    severe: 'bg-red-900/50 text-red-300 border border-red-700',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NutrientDeficiencyWizardComponent: React.FC = () => {
    const { t } = useTranslation('plants')

    const [currentNodeId, setCurrentNodeId] = useState('root')
    const [history, setHistory] = useState<string[]>([])

    const currentNode = getNode(currentNodeId)
    const resultNode = currentNode && isResult(currentNode) ? currentNode : null
    const questionNode =
        currentNode && !isResult(currentNode) ? (currentNode as DiagnosisNode) : null

    const step = history.length + 1
    const maxDepth = getMaxDepth()

    // ---- Navigation --------------------------------------------------------

    const navigate = useCallback(
        (nextId: string) => {
            setHistory((prev) => [...prev, currentNodeId])
            setCurrentNodeId(nextId)
        },
        [currentNodeId],
    )

    const goBack = useCallback(() => {
        setHistory((prev) => {
            const copy = [...prev]
            const prevId = copy.pop()
            if (prevId !== undefined) setCurrentNodeId(prevId)
            return copy
        })
    }, [])

    const restart = useCallback(() => {
        setCurrentNodeId('root')
        setHistory([])
    }, [])

    // ---- Result view -------------------------------------------------------

    if (resultNode) {
        return (
            <div className="space-y-4" data-testid="wizard-result">
                <Card className="bg-slate-900/70 space-y-3">
                    <h4 className="font-semibold text-primary-300 flex items-center gap-2">
                        <PhosphorIcons.FirstAidKit className="w-5 h-5" />
                        {t('nutrientWizard.resultTitle')}
                    </h4>

                    {/* Deficiency name */}
                    <p className="text-lg font-bold text-slate-100" data-testid="result-name">
                        {t(`nutrientWizard.results.${resultNode.deficiencyId}.name`)}
                    </p>

                    {/* Severity badge */}
                    <span
                        className={cn(
                            'inline-block text-xs px-2 py-0.5 rounded-full font-medium',
                            SEVERITY_COLOURS[resultNode.severity],
                        )}
                        data-testid="result-severity"
                    >
                        {t(`nutrientWizard.severity.${resultNode.severity}`)}
                    </span>

                    {/* Symptoms */}
                    <div>
                        <p className="text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                            {t('nutrientWizard.symptoms')}
                        </p>
                        <ul className="list-disc list-inside space-y-0.5">
                            {resultNode.symptomKeys.map((key) => (
                                <li key={key} className="text-sm text-slate-400">
                                    {t(`nutrientWizard.results.${key}`)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Treatment */}
                    <div>
                        <p className="text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                            {t('nutrientWizard.treatment')}
                        </p>
                        <ul className="list-disc list-inside space-y-0.5">
                            {resultNode.treatmentKeys.map((key) => (
                                <li key={key} className="text-sm text-slate-400">
                                    {t(`nutrientWizard.results.${key}`)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* View in Atlas link */}
                    <p className="text-xs text-primary-400">
                        <PhosphorIcons.BookOpenText className="w-3 h-3 inline mr-1" />
                        {t('nutrientWizard.viewInAtlas')}
                    </p>
                </Card>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={goBack}>
                        <PhosphorIcons.ArrowLeft className="w-4 h-4 mr-1" />
                        {t('nutrientWizard.back')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={restart}>
                        <PhosphorIcons.ArrowClockwise className="w-4 h-4 mr-1" />
                        {t('nutrientWizard.restart')}
                    </Button>
                </div>
            </div>
        )
    }

    // ---- Question view -----------------------------------------------------

    if (!questionNode) {
        return null
    }

    return (
        <div className="space-y-4" data-testid="wizard-question">
            {/* Progress */}
            <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{t('nutrientWizard.step', { current: step, max: maxDepth })}</span>
                <div className="flex-1 mx-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-600 transition-all duration-300"
                        style={{ width: `${Math.min(100, (step / maxDepth) * 100)}%` }}
                    />
                </div>
            </div>

            {/* Question card */}
            <Card className="bg-slate-900/70 space-y-4">
                <div className="flex items-start gap-3">
                    <PhosphorIcons.Question className="w-6 h-6 text-primary-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-200 font-medium" data-testid="question-text">
                        {t(`nutrientWizard.questions.${questionNode.questionKey}`)}
                    </p>
                </div>

                {/* Yes / No buttons */}
                <div className="flex gap-3">
                    <Button
                        className="flex-1"
                        onClick={() => navigate(questionNode.yesNodeId)}
                        data-testid="btn-yes"
                    >
                        <PhosphorIcons.CheckCircle className="w-4 h-4 mr-1.5" />
                        {t('nutrientWizard.yes')}
                    </Button>
                    <Button
                        className="flex-1"
                        variant="secondary"
                        onClick={() => navigate(questionNode.noNodeId)}
                        data-testid="btn-no"
                    >
                        <PhosphorIcons.X className="w-4 h-4 mr-1.5" />
                        {t('nutrientWizard.no')}
                    </Button>
                </div>
            </Card>

            {/* Back button */}
            {history.length > 0 && (
                <Button size="sm" variant="secondary" onClick={goBack} data-testid="btn-back">
                    <PhosphorIcons.ArrowLeft className="w-4 h-4 mr-1" />
                    {t('nutrientWizard.back')}
                </Button>
            )}
        </div>
    )
}

NutrientDeficiencyWizardComponent.displayName = 'NutrientDeficiencyWizard'

export const NutrientDeficiencyWizard: React.FC = memo(NutrientDeficiencyWizardComponent)
