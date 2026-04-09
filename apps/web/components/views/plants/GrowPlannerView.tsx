import React, { useState, useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlannerTask, GrowAction } from '@/types'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import {
    selectAllPlannerTasks,
    selectOverdueTasks,
    addPlannerTask,
    completePlannerTask,
    removePlannerTask,
} from '@/stores/slices/growPlannerSlice'
import { secureRandom } from '@/utils/random'

interface GrowPlannerViewProps {
    plantId?: string | undefined
    plantName?: string | undefined
}

const GROW_ACTIONS: Array<{ type: GrowAction; color: string; icon: string }> = [
    { type: 'water', color: 'bg-blue-500/20 text-blue-400 ring-blue-400/30', icon: '~' },
    { type: 'feed', color: 'bg-amber-500/20 text-amber-400 ring-amber-400/30', icon: '+' },
    { type: 'train', color: 'bg-purple-500/20 text-purple-400 ring-purple-400/30', icon: '#' },
    { type: 'photo', color: 'bg-cyan-500/20 text-cyan-400 ring-cyan-400/30', icon: '@' },
    { type: 'defoliate', color: 'bg-green-500/20 text-green-400 ring-green-400/30', icon: '/' },
    { type: 'flush', color: 'bg-teal-500/20 text-teal-400 ring-teal-400/30', icon: '=' },
    {
        type: 'harvest_check',
        color: 'bg-orange-500/20 text-orange-400 ring-orange-400/30',
        icon: '!',
    },
    { type: 'transplant', color: 'bg-lime-500/20 text-lime-400 ring-lime-400/30', icon: '^' },
    { type: 'pest_control', color: 'bg-red-500/20 text-red-400 ring-red-400/30', icon: '*' },
]

function getActionStyle(type: GrowAction): string {
    return (
        GROW_ACTIONS.find((a) => a.type === type)?.color ??
        'bg-slate-500/20 text-slate-400 ring-slate-400/30'
    )
}

export const GrowPlannerView: React.FC<GrowPlannerViewProps> = memo(({ plantId, plantName }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const allTasks = useAppSelector(selectAllPlannerTasks)
    const overdueTasks = useAppSelector(selectOverdueTasks(plantId))

    const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [showAddForm, setShowAddForm] = useState(false)
    const [newTaskType, setNewTaskType] = useState<GrowAction>('water')
    const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().slice(0, 16))
    const [newTaskRecurring, setNewTaskRecurring] = useState(false)
    const [newTaskInterval, setNewTaskInterval] = useState('3')
    const [newTaskNotes, setNewTaskNotes] = useState('')

    // Filter tasks for current plant if specified
    const filteredTasks = useMemo(
        () => (plantId != null ? allTasks.filter((t) => t.plantId === plantId) : allTasks),
        [allTasks, plantId],
    )

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const days: Date[] = []
        const now = new Date(selectedDate)

        if (viewMode === 'week') {
            const startOfWeek = new Date(now)
            startOfWeek.setDate(now.getDate() - now.getDay() + 1)
            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek)
                day.setDate(startOfWeek.getDate() + i)
                days.push(day)
            }
        } else {
            const year = now.getFullYear()
            const month = now.getMonth()
            const firstDay = new Date(year, month, 1)
            const lastDay = new Date(year, month + 1, 0)
            // Pad from Monday
            const startPad = (firstDay.getDay() + 6) % 7
            for (let i = -startPad; i <= lastDay.getDate() - 1; i++) {
                const day = new Date(year, month, i + 1)
                days.push(day)
            }
        }
        return days
    }, [selectedDate, viewMode])

    // Map tasks to days
    const tasksByDay = useMemo(() => {
        const map = new Map<string, PlannerTask[]>()
        for (const task of filteredTasks) {
            const key = new Date(task.scheduledAt).toISOString().slice(0, 10)
            const existing = map.get(key)
            if (existing) {
                existing.push(task)
            } else {
                map.set(key, [task])
            }
        }
        return map
    }, [filteredTasks])

    const handleAddTask = useCallback(() => {
        if (!plantId) return
        const task: PlannerTask = {
            id: `planner-${Date.now()}-${Math.floor(secureRandom() * 1e6)}`,
            plantId,
            type: newTaskType,
            scheduledAt: new Date(newTaskDate).getTime(),
            recurring: newTaskRecurring,
            intervalDays: newTaskRecurring ? Number(newTaskInterval) : undefined,
            notes: newTaskNotes.trim() || undefined,
        }
        dispatch(addPlannerTask(task))
        setShowAddForm(false)
        setNewTaskNotes('')
    }, [
        dispatch,
        plantId,
        newTaskType,
        newTaskDate,
        newTaskRecurring,
        newTaskInterval,
        newTaskNotes,
    ])

    const handleComplete = useCallback(
        (taskId: string) => {
            dispatch(completePlannerTask({ taskId, completedAt: Date.now() }))
        },
        [dispatch],
    )

    const handleRemove = useCallback(
        (taskId: string) => {
            dispatch(removePlannerTask(taskId))
        },
        [dispatch],
    )

    const navigateCalendar = useCallback(
        (direction: -1 | 1) => {
            const next = new Date(selectedDate)
            if (viewMode === 'week') {
                next.setDate(next.getDate() + direction * 7)
            } else {
                next.setMonth(next.getMonth() + direction)
            }
            setSelectedDate(next)
        },
        [selectedDate, viewMode],
    )

    const today = new Date().toISOString().slice(0, 10)

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        {t('plantsView.planner.title', { defaultValue: 'Grow Planner' })}
                    </h3>
                    {plantName != null && <p className="text-sm text-slate-400">{plantName}</p>}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
                        className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs text-white transition-colors"
                    >
                        {viewMode === 'week'
                            ? t('plantsView.planner.monthView', { defaultValue: 'Month' })
                            : t('plantsView.planner.weekView', { defaultValue: 'Week' })}
                    </button>
                    {plantId != null && (
                        <button
                            type="button"
                            onClick={() => setShowAddForm(true)}
                            className="rounded-lg bg-primary-600 hover:bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                        >
                            + {t('plantsView.planner.addTask', { defaultValue: 'Add Task' })}
                        </button>
                    )}
                </div>
            </div>

            {/* Overdue alerts */}
            {overdueTasks.length > 0 && (
                <div className="rounded-xl bg-red-500/15 p-3 ring-1 ring-inset ring-red-400/30">
                    <p className="text-sm font-semibold text-red-300 mb-2">
                        {t('plantsView.planner.overdue', {
                            defaultValue: '{{count}} overdue task(s)',
                            count: overdueTasks.length,
                        })}
                    </p>
                    <div className="space-y-1">
                        {overdueTasks.slice(0, 5).map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between text-xs"
                            >
                                <span
                                    className={`rounded-full px-2 py-0.5 ring-1 ring-inset ${getActionStyle(task.type)}`}
                                >
                                    {task.type}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleComplete(task.id)}
                                        className="text-green-400 hover:text-green-300"
                                        aria-label={t('common.complete', {
                                            defaultValue: 'Complete',
                                        })}
                                    >
                                        [done]
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(task.id)}
                                        className="text-red-400 hover:text-red-300"
                                        aria-label={t('common.remove', { defaultValue: 'Remove' })}
                                    >
                                        [x]
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Calendar navigation */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => navigateCalendar(-1)}
                    className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-1 text-sm text-white"
                    aria-label={t('common.previous', { defaultValue: 'Previous' })}
                >
                    {'<'}
                </button>
                <span className="text-sm font-medium text-slate-300">
                    {selectedDate.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        ...(viewMode === 'week' && { day: 'numeric' }),
                    })}
                </span>
                <button
                    type="button"
                    onClick={() => navigateCalendar(1)}
                    className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-1 text-sm text-white"
                    aria-label={t('common.next', { defaultValue: 'Next' })}
                >
                    {'>'}
                </button>
            </div>

            {/* Calendar grid */}
            <div className="rounded-xl bg-slate-800/60 ring-1 ring-inset ring-slate-700/50 overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-slate-700">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                        <div
                            key={d}
                            className="py-2 text-center text-xs font-medium text-slate-500"
                        >
                            {d}
                        </div>
                    ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7">
                    {calendarDays.map((day) => {
                        const key = day.toISOString().slice(0, 10)
                        const dayTasks = tasksByDay.get(key) ?? []
                        const isToday = key === today
                        const isCurrentMonth = day.getMonth() === selectedDate.getMonth()
                        return (
                            <div
                                key={key}
                                className={`min-h-[4rem] sm:min-h-[5rem] border-b border-r border-slate-700/50 p-1 ${
                                    isToday
                                        ? 'bg-primary-500/10'
                                        : isCurrentMonth
                                          ? ''
                                          : 'bg-slate-900/40'
                                }`}
                            >
                                <span
                                    className={`text-xs font-medium ${
                                        isToday
                                            ? 'text-primary-400 font-bold'
                                            : isCurrentMonth
                                              ? 'text-slate-300'
                                              : 'text-slate-600'
                                    }`}
                                >
                                    {day.getDate()}
                                </span>
                                <div className="mt-1 space-y-0.5">
                                    {dayTasks.slice(0, 3).map((task) => (
                                        <button
                                            key={task.id}
                                            type="button"
                                            onClick={() =>
                                                task.completedAt == null
                                                    ? handleComplete(task.id)
                                                    : undefined
                                            }
                                            className={`block w-full truncate rounded px-1 py-0.5 text-[10px] ring-1 ring-inset transition-opacity ${getActionStyle(task.type)} ${
                                                task.completedAt != null
                                                    ? 'opacity-40 line-through'
                                                    : ''
                                            }`}
                                            title={`${task.type}${task.notes ? ': ' + task.notes : ''}`}
                                        >
                                            {task.type}
                                        </button>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <span className="text-[10px] text-slate-500">
                                            +{dayTasks.length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Action type legend */}
            <div className="flex flex-wrap gap-1.5">
                {GROW_ACTIONS.map((a) => (
                    <span
                        key={a.type}
                        className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ring-inset ${a.color}`}
                    >
                        {a.type.replace('_', ' ')}
                    </span>
                ))}
            </div>

            {/* Add task form modal */}
            {showAddForm && plantId != null && (
                <div className="rounded-xl bg-slate-800/80 p-4 ring-1 ring-inset ring-slate-700/50 space-y-3">
                    <h4 className="text-sm font-semibold text-white">
                        {t('plantsView.planner.newTask', { defaultValue: 'New Task' })}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label
                                htmlFor="task-type"
                                className="block text-xs text-slate-400 mb-1"
                            >
                                {t('plantsView.planner.taskType', { defaultValue: 'Type' })}
                            </label>
                            <select
                                id="task-type"
                                value={newTaskType}
                                onChange={(e) => {
                                    const val = e.target.value
                                    const match = GROW_ACTIONS.find((a) => a.type === val)
                                    if (match) setNewTaskType(match.type)
                                }}
                                className="w-full rounded-lg bg-slate-700/60 border-0 px-3 py-2 text-sm text-white ring-1 ring-inset ring-slate-600 focus:ring-2 focus:ring-primary-500"
                            >
                                {GROW_ACTIONS.map((a) => (
                                    <option key={a.type} value={a.type}>
                                        {a.type.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="task-date"
                                className="block text-xs text-slate-400 mb-1"
                            >
                                {t('plantsView.planner.scheduledDate', { defaultValue: 'Date' })}
                            </label>
                            <input
                                id="task-date"
                                type="datetime-local"
                                value={newTaskDate}
                                onChange={(e) => setNewTaskDate(e.target.value)}
                                className="w-full rounded-lg bg-slate-700/60 border-0 px-3 py-2 text-sm text-white ring-1 ring-inset ring-slate-600 focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newTaskRecurring}
                                onChange={(e) => setNewTaskRecurring(e.target.checked)}
                                className="rounded bg-slate-700 border-slate-600"
                            />
                            {t('plantsView.planner.recurring', { defaultValue: 'Recurring' })}
                        </label>
                        {newTaskRecurring && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-400">
                                    {t('plantsView.planner.every', { defaultValue: 'every' })}
                                </span>
                                <input
                                    type="number"
                                    value={newTaskInterval}
                                    onChange={(e) => setNewTaskInterval(e.target.value)}
                                    min="1"
                                    max="90"
                                    className="w-14 rounded bg-slate-700/60 border-0 px-2 py-1 text-sm text-white ring-1 ring-inset ring-slate-600"
                                />
                                <span className="text-xs text-slate-400">
                                    {t('plantsView.planner.days', { defaultValue: 'days' })}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="task-notes" className="block text-xs text-slate-400 mb-1">
                            {t('plantsView.planner.notes', { defaultValue: 'Notes' })}
                        </label>
                        <input
                            id="task-notes"
                            type="text"
                            value={newTaskNotes}
                            onChange={(e) => setNewTaskNotes(e.target.value)}
                            maxLength={200}
                            className="w-full rounded-lg bg-slate-700/60 border-0 px-3 py-2 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-slate-600 focus:ring-2 focus:ring-primary-500"
                            placeholder={t('plantsView.planner.notesPlaceholder', {
                                defaultValue: 'Optional notes...',
                            })}
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white transition-colors"
                        >
                            {t('common.cancel', { defaultValue: 'Cancel' })}
                        </button>
                        <button
                            type="button"
                            onClick={handleAddTask}
                            className="rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors"
                        >
                            {t('plantsView.planner.addTask', { defaultValue: 'Add Task' })}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
})
GrowPlannerView.displayName = 'GrowPlannerView'
