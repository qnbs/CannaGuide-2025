import React, { useState, useMemo, useCallback, useRef, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { faqData } from '@/data/faq'
import { Button } from '@/components/common/Button'
import { Speakable } from '@/components/common/Speakable'
import { SearchBar } from '@/components/common/SearchBar'
import { SafeHtml } from '@/components/common/SafeHtml'

export const FAQSection: React.FC = memo(() => {
    const { t } = useTranslation()
    const [searchTerm, setSearchTerm] = useState('')
    const [allExpanded, setAllExpanded] = useState(false)
    const detailsContainerRef = useRef<HTMLDivElement>(null)

    const augmentedFaqData = useMemo(
        () =>
            faqData.map((item) => ({
                ...item,
                question: t(item.questionKey),
                answer: t(item.answerKey),
            })),
        [t],
    )

    const filteredFaq = useMemo(() => {
        if (!searchTerm) return augmentedFaqData
        const lowerCaseSearch = searchTerm.toLowerCase()
        return augmentedFaqData.filter(
            (item) =>
                item.question.toLowerCase().includes(lowerCaseSearch) ||
                item.answer.toLowerCase().includes(lowerCaseSearch),
        )
    }, [searchTerm, augmentedFaqData])

    const groupedFaq = useMemo(() => {
        const localAiAndApp = filteredFaq.filter(
            (item) =>
                item.id.startsWith('faq-local-ai') ||
                item.id === 'faq-cloud-sync' ||
                item.id === 'faq-multi-provider-ai' ||
                item.id === 'faq-force-wasm' ||
                item.id === 'faq-vision-classification',
        )

        const growAndCare = filteredFaq.filter((item) => !localAiAndApp.includes(item))

        return [
            {
                id: 'local-ai',
                title: t('helpView.faq.groups.localAi'),
                icon: <PhosphorIcons.Brain className="w-4 h-4" />,
                items: localAiAndApp,
            },
            {
                id: 'grow-care',
                title: t('helpView.faq.groups.grow'),
                icon: <PhosphorIcons.Plant className="w-4 h-4" />,
                items: growAndCare,
            },
        ].filter((group) => group.items.length > 0)
    }, [filteredFaq, t])

    const toggleAll = useCallback(() => {
        const next = !allExpanded
        setAllExpanded(next)
        detailsContainerRef.current?.querySelectorAll('details').forEach((el) => {
            el.open = next
        })
    }, [allExpanded])

    const isFiltered = searchTerm.length > 0
    const toggleAllIcon = allExpanded ? (
        <PhosphorIcons.ArrowUp className="w-4 h-4 mr-1.5" />
    ) : (
        <PhosphorIcons.ArrowDown className="w-4 h-4 mr-1.5" />
    )
    const toggleAllLabel = allExpanded ? t('helpView.faq.collapseAll') : t('helpView.faq.expandAll')

    return (
        <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <h3 className="text-xl font-bold font-display text-primary-400">
                    {t('helpView.faq.title')}
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAll}
                    className="self-start sm:self-auto"
                >
                    {toggleAllIcon}
                    {toggleAllLabel}
                </Button>
            </div>
            <p className="text-sm text-slate-400 mb-4">{t('helpView.faq.subtitle')}</p>

            <div className="mb-4">
                <SearchBar
                    placeholder={t('helpView.faq.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClear={() => setSearchTerm('')}
                />
            </div>

            {/* Result count badge */}
            {isFiltered && (
                <p className="text-xs text-muted mb-3">
                    {t('helpView.faq.resultCountFiltered', {
                        count: filteredFaq.length,
                        total: augmentedFaqData.length,
                    })}
                </p>
            )}

            <div ref={detailsContainerRef} className="space-y-6">
                {groupedFaq.length > 0 ? (
                    groupedFaq.map((group) => (
                        <section key={group.id} className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-muted">{group.icon}</span>
                                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    {group.title}
                                </h4>
                                <span className="text-xs tabular-nums text-muted bg-slate-800 rounded-full px-2 py-0.5">
                                    {group.items.length}
                                </span>
                                <div className="h-px flex-1 bg-slate-700/60" />
                            </div>
                            <div className="space-y-3">
                                {group.items.map((item, idx) => (
                                    <details
                                        key={item.id}
                                        className="group bg-slate-800 rounded-lg overflow-hidden ring-1 ring-inset ring-slate-700/50 hover:ring-primary-500/30 transition-[box-shadow,color] duration-200"
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                    >
                                        <summary className="list-none flex justify-between items-center p-4 cursor-pointer select-none">
                                            <span className="text-base sm:text-lg font-bold text-slate-100 pr-3">
                                                {item.question}
                                            </span>
                                            <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 group-open:rotate-180" />
                                        </summary>
                                        <Speakable elementId={`faq-${item.id}`}>
                                            <SafeHtml
                                                html={item.answer}
                                                className="p-4 border-t border-slate-700/50 prose prose-sm dark:prose-invert max-w-none animate-fade-in"
                                            />
                                        </Speakable>
                                    </details>
                                ))}
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="text-center py-10 text-muted space-y-2">
                        <PhosphorIcons.MagnifyingGlass className="w-10 h-10 mx-auto text-slate-600" />
                        <p>{t('helpView.faq.noResults', { term: searchTerm })}</p>
                    </div>
                )}
            </div>
        </Card>
    )
})
FAQSection.displayName = 'FAQSection'
