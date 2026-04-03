import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { LearningPath, LearningStep } from '@/types'
import { learningPaths } from '@/data/learningPaths'
import { completeLearningStep, resetLearningPath } from '@/stores/slices/knowledgeSlice'
import { selectLearningPathProgress } from '@/stores/selectors'

type LevelFilter = 'all' | LearningPath['targetLevel']

const LEVEL_BADGE: Record<LearningPath['targetLevel'], string> = {
    beginner: 'bg-green-800 text-green-200',
    intermediate: 'bg-blue-800 text-blue-200',
    expert: 'bg-purple-800 text-purple-200',
}

const STEP_TYPE_ICON: Record<LearningStep['type'], React.ReactNode> = {
    article: <PhosphorIcons.BookOpenText />,
    calculator: <PhosphorIcons.Calculator />,
    quiz: <PhosphorIcons.Question />,
    practice: <PhosphorIcons.TestTube />,
}

interface PathCardProps {
    path: LearningPath
    completedSteps: string[]
    onStepComplete: (stepId: string) => void
    onReset: () => void
}

const PathCard: React.FC<PathCardProps> = ({ path, completedSteps, onStepComplete, onReset }) => {
    const { t } = useTranslation()
    const [expanded, setExpanded] = useState(false)
    const total = path.steps.length
    const done = completedSteps.length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    const isComplete = done >= total && total > 0

    return (
        <div
            className={`rounded-lg border transition-all overflow-hidden ${
                isComplete
                    ? 'border-green-600/50 bg-green-900/10'
                    : 'border-white/10 bg-slate-800/60'
            }`}
        >
            <button
                type="button"
                onClick={() => {
                    setExpanded((v) => !v)
                }}
                className="w-full text-left p-4"
                aria-expanded={expanded}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-slate-100 text-sm">{t(path.titleKey)}</h3>
                            <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${LEVEL_BADGE[path.targetLevel]}`}
                            >
                                {t(`knowledgeView.lernpfad.level.${path.targetLevel}`)}
                            </span>
                            {isComplete && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-700 text-green-100">
                                    {t('knowledgeView.lernpfad.completed')}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                            {t(path.descriptionKey)}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-1.5 rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-primary-500'}`}
                                    style={{ width: `${pct}%` }}
                                    role="progressbar"
                                    aria-valuenow={pct}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                />
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {done}/{total} &bull; ~{path.estimatedMinutes} min
                            </span>
                        </div>
                    </div>
                    <PhosphorIcons.ChevronDown
                        className={`shrink-0 w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {expanded && (
                <div className="border-t border-white/10 p-4 space-y-2">
                    {path.steps.map((step, idx) => {
                        const isDone = completedSteps.includes(step.id)
                        return (
                            <div
                                key={step.id}
                                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                    isDone
                                        ? 'bg-green-900/20'
                                        : 'bg-slate-700/30 hover:bg-slate-700/50'
                                }`}
                            >
                                <div
                                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors mt-0.5"
                                    style={{
                                        borderColor: isDone ? 'rgb(34 197 94)' : 'rgb(71 85 105)',
                                        color: isDone ? 'rgb(34 197 94)' : 'rgb(148 163 184)',
                                    }}
                                >
                                    {isDone ? (
                                        <PhosphorIcons.CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <span>{idx + 1}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="w-3 h-3 text-slate-400">
                                            {STEP_TYPE_ICON[step.type]}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-200">
                                            {t(step.titleKey)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        {t(step.descriptionKey)}
                                    </p>
                                </div>
                                {!isDone && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onStepComplete(step.id)
                                        }}
                                        className="shrink-0 px-2 py-1 text-[10px] rounded bg-primary-700 text-primary-200 hover:bg-primary-600 transition-colors font-semibold"
                                        aria-label={t('knowledgeView.lernpfad.markDone')}
                                    >
                                        {t('knowledgeView.lernpfad.markDone')}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                    {done > 0 && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="mt-2 text-[10px] text-slate-500 hover:text-slate-300 transition-colors underline"
                        >
                            {t('knowledgeView.lernpfad.resetPath')}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

const LearningPathViewComponent: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const progress = useSelector(selectLearningPathProgress)
    const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')

    const levels: LevelFilter[] = ['all', 'beginner', 'intermediate', 'expert']

    const filtered = useMemo(
        () => learningPaths.filter((p) => levelFilter === 'all' || p.targetLevel === levelFilter),
        [levelFilter],
    )

    const totalCompleted = useMemo(
        () =>
            learningPaths.filter((p) => {
                const done = progress[p.id] ?? []
                return done.length >= p.steps.length && p.steps.length > 0
            }).length,
        [progress],
    )

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm">
                    <PhosphorIcons.GraduationCap className="w-5 h-5 text-primary-400" />
                    <span className="font-semibold text-slate-200">
                        {t('knowledgeView.lernpfad.progress', {
                            done: totalCompleted,
                            total: learningPaths.length,
                        })}
                    </span>
                </div>
                <div
                    className="flex gap-2"
                    role="group"
                    aria-label={t('knowledgeView.lernpfad.filterByLevel')}
                >
                    {levels.map((lvl) => (
                        <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                                setLevelFilter(lvl)
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                levelFilter === lvl
                                    ? 'bg-primary-600 text-white border-primary-400'
                                    : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-400'
                            }`}
                            aria-pressed={levelFilter === lvl}
                        >
                            {lvl === 'all'
                                ? t('knowledgeView.lernpfad.allLevels')
                                : t(`knowledgeView.lernpfad.level.${lvl}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {filtered.map((path) => (
                    <PathCard
                        key={path.id}
                        path={path}
                        completedSteps={progress[path.id] ?? []}
                        onStepComplete={(stepId) => {
                            dispatch(completeLearningStep({ pathId: path.id, stepId }))
                        }}
                        onReset={() => {
                            dispatch(resetLearningPath(path.id))
                        }}
                    />
                ))}
            </div>

            {filtered.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-8">
                    {t('knowledgeView.lernpfad.noPaths')}
                </p>
            )}
        </div>
    )
}

LearningPathViewComponent.displayName = 'LearningPathView'

export default LearningPathViewComponent
