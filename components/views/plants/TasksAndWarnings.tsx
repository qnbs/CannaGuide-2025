import React, { memo, useMemo } from 'react'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'
import { Task, PlantProblem, TaskPriority } from '@/types'

interface TasksAndWarningsProps {
    tasks: (Task & { plantId: string; plantName: string })[]
    problems: (PlantProblem & { plantId: string; plantName: string })[]
    onNavigateToPlant?: (plantId: string) => void
}

const severityConfig: Record<string, { border: string; bg: string; icon: React.ReactNode }> = {
    critical: {
        border: 'border-red-500/50',
        bg: 'bg-red-500/10',
        icon: <PhosphorIcons.Lightning className="w-4 h-4 text-red-400" />,
    },
    warning: {
        border: 'border-amber-500/50',
        bg: 'bg-amber-500/10',
        icon: <PhosphorIcons.WarningCircle className="w-4 h-4 text-amber-400" />,
    },
    info: {
        border: 'border-blue-500/50',
        bg: 'bg-blue-500/10',
        icon: <PhosphorIcons.Info className="w-4 h-4 text-blue-400" />,
    },
}

const defaultSeverityStyle = { border: '', bg: '', icon: null as React.ReactNode }

const getSeverityFromProblem = (problem: PlantProblem): string => {
    if (problem.severity >= 7) return 'critical'
    if (problem.severity >= 4) return 'warning'
    return 'info'
}

export const TasksAndWarnings: React.FC<TasksAndWarningsProps> = memo(
    ({ tasks, problems, onNavigateToPlant }) => {
        const { t } = useTranslation()
        const isPlantNavigationEnabled = typeof onNavigateToPlant === 'function'
        const interactiveRowClass = isPlantNavigationEnabled
            ? 'cursor-pointer hover:bg-white/5 transition-colors'
            : ''

        const getInteractionProps = (plantId: string) => {
            if (!onNavigateToPlant) {
                return {
                    onClick: undefined,
                    onKeyDown: undefined,
                    role: undefined,
                    tabIndex: undefined,
                }
            }

            return {
                onClick: () => onNavigateToPlant(plantId),
                onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter') onNavigateToPlant(plantId)
                },
                role: 'button' as const,
                tabIndex: 0,
            }
        }

        const priorityClasses: Record<TaskPriority, string> = {
            high: 'border-red-500/50 bg-red-500/10',
            medium: 'border-amber-500/50 bg-amber-500/10',
            low: 'border-blue-500/50 bg-blue-500/10',
        }
        const priorityIcons: Record<TaskPriority, { icon: React.ReactNode; color: string }> = {
            high: { icon: <PhosphorIcons.Lightning />, color: 'text-red-500' },
            medium: { icon: <PhosphorIcons.ArrowUp />, color: 'text-amber-500' },
            low: { icon: <PhosphorIcons.ArrowDown />, color: 'text-blue-500' },
        }
        const priorityLabels: Record<TaskPriority, string> = {
            high: t('plantsView.tasks.priorities.high'),
            medium: t('plantsView.tasks.priorities.medium'),
            low: t('plantsView.tasks.priorities.low'),
        }

        const sortedTasks = useMemo(() => {
            const order: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }
            return [...tasks].sort((a, b) => order[a.priority] - order[b.priority])
        }, [tasks])

        const sortedProblems = useMemo(
            () => [...problems].sort((a, b) => b.severity - a.severity),
            [problems],
        )

        return (
            <div className="space-y-6">
                <Card className="ring-1 ring-inset ring-white/20">
                    <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2 mb-4">
                        <PhosphorIcons.Checks className="w-6 h-6 text-primary-400" />{' '}
                        {t('plantsView.tasks.title')}
                        {tasks.length > 0 && (
                            <span className="ml-auto text-xs font-normal bg-primary-500/15 text-primary-300 px-2 py-0.5 rounded-full ring-1 ring-inset ring-primary-400/30">
                                {tasks.length}
                            </span>
                        )}
                    </h3>
                    {sortedTasks.length > 0 ? (
                        <div className="space-y-2">
                            {sortedTasks.map((task) => {
                                const interactionProps = getInteractionProps(task.plantId)

                                return (
                                    <div
                                        key={`${task.plantId}-${task.id}`}
                                        className={`p-2.5 border-l-4 ${priorityClasses[task.priority]} rounded-r-md flex items-center justify-between ${interactiveRowClass}`}
                                        {...interactionProps}
                                    >
                                        <div>
                                            <p className="font-bold text-sm text-slate-100">
                                                {t(task.title)}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {task.plantName}
                                            </p>
                                        </div>
                                        <div
                                            className={`w-5 h-5 flex-shrink-0 ${priorityIcons[task.priority].color}`}
                                            title={`${t('plantsView.tasks.priority')}: ${priorityLabels[task.priority]}`}
                                        >
                                            {priorityIcons[task.priority].icon}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <PhosphorIcons.CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">{t('plantsView.tasks.none')}</p>
                        </div>
                    )}
                </Card>
                <Card className="ring-1 ring-inset ring-white/20">
                    <h3 className="text-xl font-bold font-display mb-4 text-amber-400 flex items-center gap-2">
                        <PhosphorIcons.WarningCircle className="w-6 h-6 text-amber-400" />{' '}
                        {t('plantsView.warnings.title')}
                        {problems.length > 0 && (
                            <span className="ml-auto text-xs font-normal bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full ring-1 ring-inset ring-amber-400/30">
                                {problems.length}
                            </span>
                        )}
                    </h3>
                    {sortedProblems.length > 0 ? (
                        <div className="space-y-2">
                            {sortedProblems.map((problem, index) => {
                                const severity = getSeverityFromProblem(problem)
                                const config = severityConfig[severity] ?? defaultSeverityStyle
                                const problemKey = problem.type
                                    .toLowerCase()
                                    .replace(/_(\w)/g, (_: string, c: string) => c.toUpperCase())
                                const interactionProps = getInteractionProps(problem.plantId)

                                return (
                                    <div
                                        key={`${problem.plantId}-${index}`}
                                        className={`p-2.5 border-l-4 ${config.border} ${config.bg} rounded-r-md flex items-center justify-between ${interactiveRowClass}`}
                                        {...interactionProps}
                                    >
                                        <div>
                                            <p className="font-bold text-sm text-slate-100">
                                                {t(`problemMessages.${problemKey}.message`)}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {problem.plantName}
                                            </p>
                                        </div>
                                        {config.icon}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <PhosphorIcons.CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">
                                {t('plantsView.warnings.none')}
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        )
    },
)

TasksAndWarnings.displayName = 'TasksAndWarnings'
