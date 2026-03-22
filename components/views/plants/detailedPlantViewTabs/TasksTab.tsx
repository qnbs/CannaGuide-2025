import React, { memo, useMemo } from 'react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Task, TaskPriority } from '@/types'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface TasksTabProps {
    tasks: Task[]
    onCompleteTask: (taskId: string) => void
}

const priorityConfig: Record<TaskPriority, { color: string; bg: string; icon: React.ReactNode }> = {
    high: {
        color: 'text-red-400',
        bg: 'border-l-red-500',
        icon: <PhosphorIcons.Lightning className="w-4 h-4" />,
    },
    medium: {
        color: 'text-amber-400',
        bg: 'border-l-amber-500',
        icon: <PhosphorIcons.ArrowUp className="w-4 h-4" />,
    },
    low: {
        color: 'text-blue-400',
        bg: 'border-l-blue-500',
        icon: <PhosphorIcons.ArrowDown className="w-4 h-4" />,
    },
}

const getTaskAge = (createdAt: number): string => {
    const hours = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60))
    if (hours < 1) return '<1h'
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
}

const getTranslatedText = (translatedValue: string, fallbackValue: string): string => {
    return translatedValue.length > 0 ? translatedValue : fallbackValue
}

const priorityOrder: Record<TaskPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
}

export const TasksTab: React.FC<TasksTabProps> = memo(({ tasks, onCompleteTask }) => {
    const { t } = useTranslation()

    const { openTasks, completedTasks } = useMemo(
        () => ({
            openTasks: tasks
                .filter((task) => !task.isCompleted)
                .toSorted((a, b) => {
                    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
                    return priorityDiff !== 0 ? priorityDiff : a.createdAt - b.createdAt
                }),
            completedTasks: tasks
                .filter((task) => task.isCompleted)
                .toSorted((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
        }),
        [tasks],
    )

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold font-display text-primary-400 flex items-center gap-2">
                        <PhosphorIcons.ListChecks className="w-5 h-5" />
                        {t('plantsView.summary.openTasks')}
                    </h3>
                    <span className="text-xs font-bold rounded-full bg-primary-500/15 text-primary-200 px-2.5 py-1 ring-1 ring-inset ring-primary-400/30">
                        {openTasks.length}
                    </span>
                </div>
                <ul className="space-y-3">
                    {openTasks.length > 0 ? (
                        openTasks.map((task) => {
                            const config = priorityConfig[task.priority]
                            const age = getTaskAge(task.createdAt)
                            const taskTitle = getTranslatedText(t(task.title), task.title)
                            const taskDescription = getTranslatedText(
                                t(task.description),
                                task.description,
                            )
                            return (
                                <li
                                    key={task.id}
                                    className={`flex items-center gap-4 p-3 rounded-lg bg-slate-800 border-l-4 ${config.bg} ring-1 ring-inset ring-white/10`}
                                >
                                    <div
                                        className={`flex-shrink-0 ${config.color}`}
                                        title={t(`plantsView.tasks.priorities.${task.priority}`)}
                                    >
                                        {config.icon}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold text-slate-100">{taskTitle}</p>
                                        <p className="text-sm text-slate-300">{taskDescription}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {age}{' '}
                                            {t('plantsView.tasks.ago', { defaultValue: 'ago' })}
                                        </p>
                                    </div>
                                    <Button size="sm" onClick={() => onCompleteTask(task.id)}>
                                        <PhosphorIcons.Checks className="w-4 h-4 mr-1" />
                                        {t('plantsView.detailedView.tasksComplete')}
                                    </Button>
                                </li>
                            )
                        })
                    ) : (
                        <div className="text-center py-6">
                            <PhosphorIcons.CheckCircle className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
                            <p className="text-slate-400">{t('plantsView.tasks.none')}</p>
                        </div>
                    )}
                </ul>
            </Card>
            <Card>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold font-display text-slate-400 flex items-center gap-2">
                        <PhosphorIcons.CheckCircle className="w-5 h-5" />
                        {t('plantsView.detailedView.completedTasks', { defaultValue: 'Completed' })}
                    </h3>
                    <span className="text-xs text-slate-500">{completedTasks.length}</span>
                </div>
                <ul className="space-y-3">
                    {completedTasks.length > 0 ? (
                        completedTasks.map((task) => {
                            const taskTitle = getTranslatedText(t(task.title), task.title)
                            return (
                                <li
                                    key={task.id}
                                    className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/60 opacity-60 ring-1 ring-inset ring-white/10"
                                >
                                    <PhosphorIcons.CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold line-through text-slate-400">
                                            {taskTitle}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {t('plantsView.detailedView.tasksCompleted', {
                                                date: new Date(
                                                    task.completedAt ?? Date.now(),
                                                ).toLocaleString(),
                                            })}
                                        </p>
                                    </div>
                                </li>
                            )
                        })
                    ) : (
                        <p className="text-center text-slate-500 py-4">
                            {t('plantsView.detailedView.tasksNoEntries')}
                        </p>
                    )}
                </ul>
            </Card>
        </div>
    )
})

TasksTab.displayName = 'TasksTab'
