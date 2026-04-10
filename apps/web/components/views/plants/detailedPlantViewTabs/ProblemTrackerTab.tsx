// ---------------------------------------------------------------------------
// ProblemTrackerTab -- Plant Issue Timeline for CannaGuide 2025
//
// Displays active and resolved issues for a specific plant with the ability
// to add new issues, change status, and log treatments.
// ---------------------------------------------------------------------------

import React, { memo, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import {
    selectIssuesForPlant,
    addIssue,
    setIssueStatus,
    addTreatment,
    removeIssue,
} from '@/stores/slices/problemTrackerSlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { PlantIssue, IssueCategory, IssueSeverity, IssueStatus, IssueTreatment } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: IssueCategory[] = ['pest', 'deficiency', 'toxicity', 'disease', 'environmental']

const SEVERITIES: IssueSeverity[] = ['mild', 'moderate', 'severe']

const STATUS_COLORS: Record<IssueStatus, string> = {
    detected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    treating: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

const SEVERITY_COLORS: Record<IssueSeverity, string> = {
    mild: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    moderate: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    severe: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProblemTrackerTabProps {
    plantId: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ProblemTrackerTab: React.FC<ProblemTrackerTabProps> = memo(({ plantId }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const issues = useAppSelector(selectIssuesForPlant(plantId))

    const [showAddForm, setShowAddForm] = useState(false)
    const [showResolved, setShowResolved] = useState(false)
    const [expandedIssue, setExpandedIssue] = useState<string | null>(null)

    // -- Form state --
    const [formTitle, setFormTitle] = useState('')
    const [formCategory, setFormCategory] = useState<IssueCategory>('deficiency')
    const [formSeverity, setFormSeverity] = useState<IssueSeverity>('moderate')
    const [formDescription, setFormDescription] = useState('')

    const resetForm = useCallback(() => {
        setFormTitle('')
        setFormCategory('deficiency')
        setFormSeverity('moderate')
        setFormDescription('')
    }, [])

    const activeIssues = useMemo(() => issues.filter((i) => i.status !== 'resolved'), [issues])
    const resolvedIssues = useMemo(() => issues.filter((i) => i.status === 'resolved'), [issues])

    const handleAddIssue = useCallback(() => {
        if (!formTitle.trim()) return

        const issue: PlantIssue = {
            id: `issue-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
            plantId,
            category: formCategory,
            status: 'detected',
            severity: formSeverity,
            title: formTitle.trim(),
            description: formDescription.trim() || undefined,
            detectedAt: Date.now(),
            treatments: [],
        }

        dispatch(addIssue(issue))
        resetForm()
        setShowAddForm(false)
    }, [dispatch, plantId, formTitle, formCategory, formSeverity, formDescription, resetForm])

    const handleStatusChange = useCallback(
        (issueId: string, status: IssueStatus) => {
            dispatch(setIssueStatus({ issueId, status }))
        },
        [dispatch],
    )

    const handleAddTreatment = useCallback(
        (issueId: string, action: string, product?: string) => {
            const treatment: IssueTreatment = {
                id: `treat-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
                timestamp: Date.now(),
                action,
                product: product || undefined,
            }
            dispatch(addTreatment({ issueId, treatment }))
        },
        [dispatch],
    )

    const handleRemoveIssue = useCallback(
        (issueId: string) => {
            dispatch(removeIssue(issueId))
        },
        [dispatch],
    )

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-text-primary">
                        {t('plantsView.problemTracker.title')}
                    </h3>
                    <p className="text-xs text-text-secondary">
                        {t('plantsView.problemTracker.activeCount', {
                            count: activeIssues.length,
                        })}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
                >
                    <PhosphorIcons.Plus className="h-4 w-4" />
                    {t('plantsView.problemTracker.addIssue')}
                </button>
            </div>

            {/* Add Issue Form */}
            {showAddForm && (
                <div className="p-4 rounded-lg border border-border bg-surface space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                {t('plantsView.problemTracker.issueTitle')}
                            </label>
                            <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                maxLength={200}
                                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                                placeholder={t('plantsView.problemTracker.issueTitlePlaceholder')}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                {t('plantsView.problemTracker.category')}
                            </label>
                            <select
                                value={formCategory}
                                onChange={(e) =>
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                                    setFormCategory(e.target.value as IssueCategory)
                                }
                                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {t(`plantsView.problemTracker.categories.${c}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                {t('plantsView.problemTracker.severity')}
                            </label>
                            <select
                                value={formSeverity}
                                onChange={(e) =>
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                                    setFormSeverity(e.target.value as IssueSeverity)
                                }
                                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                            >
                                {SEVERITIES.map((s) => (
                                    <option key={s} value={s}>
                                        {t(`plantsView.problemTracker.severities.${s}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                            {t('plantsView.problemTracker.description')}
                        </label>
                        <textarea
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            maxLength={1000}
                            rows={2}
                            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary resize-none"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                resetForm()
                                setShowAddForm(false)
                            }}
                            className="px-3 py-1.5 rounded-md text-sm text-text-secondary hover:bg-surface-hover transition-colors"
                        >
                            {t('plantsView.problemTracker.cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleAddIssue}
                            disabled={!formTitle.trim()}
                            className="px-3 py-1.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
                        >
                            {t('plantsView.problemTracker.save')}
                        </button>
                    </div>
                </div>
            )}

            {/* Active Issues */}
            {activeIssues.length === 0 && !showAddForm ? (
                <div className="text-center py-8 text-text-secondary">
                    <PhosphorIcons.CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{t('plantsView.problemTracker.noActiveIssues')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {activeIssues.map((issue) => (
                        <IssueCard
                            key={issue.id}
                            issue={issue}
                            isExpanded={expandedIssue === issue.id}
                            onToggle={() =>
                                setExpandedIssue(expandedIssue === issue.id ? null : issue.id)
                            }
                            onStatusChange={handleStatusChange}
                            onAddTreatment={handleAddTreatment}
                            onRemove={handleRemoveIssue}
                        />
                    ))}
                </div>
            )}

            {/* Resolved Issues Toggle */}
            {resolvedIssues.length > 0 && (
                <div>
                    <button
                        type="button"
                        onClick={() => setShowResolved(!showResolved)}
                        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <PhosphorIcons.ChevronDown
                            className={`h-3 w-3 transition-transform ${showResolved ? 'rotate-180' : ''}`}
                        />
                        {t('plantsView.problemTracker.resolvedCount', {
                            count: resolvedIssues.length,
                        })}
                    </button>
                    {showResolved && (
                        <div className="mt-2 space-y-2 opacity-70">
                            {resolvedIssues.map((issue) => (
                                <IssueCard
                                    key={issue.id}
                                    issue={issue}
                                    isExpanded={expandedIssue === issue.id}
                                    onToggle={() =>
                                        setExpandedIssue(
                                            expandedIssue === issue.id ? null : issue.id,
                                        )
                                    }
                                    onStatusChange={handleStatusChange}
                                    onAddTreatment={handleAddTreatment}
                                    onRemove={handleRemoveIssue}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
})

ProblemTrackerTab.displayName = 'ProblemTrackerTab'

// ---------------------------------------------------------------------------
// IssueCard
// ---------------------------------------------------------------------------

interface IssueCardProps {
    issue: PlantIssue
    isExpanded: boolean
    onToggle: () => void
    onStatusChange: (issueId: string, status: IssueStatus) => void
    onAddTreatment: (issueId: string, action: string, product?: string) => void
    onRemove: (issueId: string) => void
}

const IssueCard: React.FC<IssueCardProps> = memo(
    ({ issue, isExpanded, onToggle, onStatusChange, onAddTreatment, onRemove }) => {
        const { t } = useTranslation()
        const [treatmentAction, setTreatmentAction] = useState('')
        const [treatmentProduct, setTreatmentProduct] = useState('')

        const handleSubmitTreatment = useCallback(() => {
            if (!treatmentAction.trim()) return
            onAddTreatment(issue.id, treatmentAction.trim(), treatmentProduct.trim() || undefined)
            setTreatmentAction('')
            setTreatmentProduct('')
        }, [issue.id, treatmentAction, treatmentProduct, onAddTreatment])

        const nextStatus: IssueStatus | null =
            issue.status === 'detected'
                ? 'treating'
                : issue.status === 'treating'
                  ? 'resolved'
                  : null

        return (
            <div className="rounded-lg border border-border bg-surface overflow-hidden">
                {/* Header */}
                <button
                    type="button"
                    onClick={onToggle}
                    className="w-full flex items-center gap-2 p-3 text-left hover:bg-surface-hover transition-colors"
                >
                    <PhosphorIcons.ChevronDown
                        className={`h-3.5 w-3.5 text-text-secondary shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                    <span className="flex-1 font-medium text-sm text-text-primary truncate">
                        {issue.title}
                    </span>
                    <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[issue.severity]}`}
                    >
                        {t(`plantsView.problemTracker.severities.${issue.severity}`)}
                    </span>
                    <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[issue.status]}`}
                    >
                        {t(`plantsView.problemTracker.statuses.${issue.status}`)}
                    </span>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                        <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
                            <span>
                                {t(`plantsView.problemTracker.categories.${issue.category}`)}
                            </span>
                            <span>--</span>
                            <span>
                                {t('plantsView.problemTracker.detectedOn', {
                                    date: new Date(issue.detectedAt).toLocaleDateString(),
                                })}
                            </span>
                            {issue.resolvedAt != null && (
                                <>
                                    <span>--</span>
                                    <span>
                                        {t('plantsView.problemTracker.resolvedOn', {
                                            date: new Date(issue.resolvedAt).toLocaleDateString(),
                                        })}
                                    </span>
                                </>
                            )}
                        </div>

                        {issue.description && (
                            <p className="text-sm text-text-secondary">{issue.description}</p>
                        )}

                        {/* Treatments */}
                        {issue.treatments.length > 0 && (
                            <div className="space-y-1">
                                <h4 className="text-xs font-medium text-text-secondary">
                                    {t('plantsView.problemTracker.treatments')}
                                </h4>
                                {issue.treatments.map((treat) => (
                                    <div
                                        key={treat.id}
                                        className="flex items-center gap-2 text-xs text-text-secondary bg-surface-hover rounded px-2 py-1"
                                    >
                                        <span className="text-text-primary">{treat.action}</span>
                                        {treat.product && (
                                            <span className="text-accent">({treat.product})</span>
                                        )}
                                        <span className="ml-auto">
                                            {new Date(treat.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Treatment (only for non-resolved) */}
                        {issue.status !== 'resolved' && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={treatmentAction}
                                    onChange={(e) => setTreatmentAction(e.target.value)}
                                    maxLength={200}
                                    placeholder={t(
                                        'plantsView.problemTracker.treatmentPlaceholder',
                                    )}
                                    className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary"
                                />
                                <input
                                    type="text"
                                    value={treatmentProduct}
                                    onChange={(e) => setTreatmentProduct(e.target.value)}
                                    maxLength={100}
                                    placeholder={t('plantsView.problemTracker.productPlaceholder')}
                                    className="w-28 rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary"
                                />
                                <button
                                    type="button"
                                    onClick={handleSubmitTreatment}
                                    disabled={!treatmentAction.trim()}
                                    className="px-2 py-1 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
                                >
                                    <PhosphorIcons.Plus className="h-3 w-3" />
                                </button>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                            {nextStatus != null && (
                                <button
                                    type="button"
                                    onClick={() => onStatusChange(issue.id, nextStatus)}
                                    className="px-2.5 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                                >
                                    {t(`plantsView.problemTracker.markAs.${nextStatus}`)}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => onRemove(issue.id)}
                                className="px-2.5 py-1 rounded-md text-red-500 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                {t('plantsView.problemTracker.delete')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
    },
)

IssueCard.displayName = 'IssueCard'
