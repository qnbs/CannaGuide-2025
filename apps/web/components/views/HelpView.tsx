import React, { useState, useMemo, useCallback, useRef, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { faqData } from '@/data/faq'
import { visualGuidesData } from '@/data/visualGuides'
import { lexiconData } from '@/data/lexicon'
import { VisualGuideCard } from './help/VisualGuideCard'
import { LexiconCard } from './help/LexiconCard'
import { Button } from '@/components/common/Button'
import { Speakable } from '@/components/common/Speakable'
import { SearchBar } from '@/components/common/SearchBar'
import { SafeHtml } from '@/components/common/SafeHtml'
import { HelpSubNav } from './help/HelpSubNav'
// ScreenshotGallery disabled -- screenshot assets not yet generated
// import { ScreenshotGallery } from './help/ScreenshotGallery'

type ManualSectionData = {
    title?: string
    content?: string
    [key: string]: ManualSectionData | string | undefined
}

type LexiconCategory =
    | 'All'
    | 'Cannabinoid'
    | 'Terpene'
    | 'Flavonoid'
    | 'Nutrient'
    | 'Disease'
    | 'General'

const CATEGORY_COLORS: Record<string, { ring: string; text: string; bg: string }> = {
    Cannabinoid: { ring: 'ring-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    Terpene: { ring: 'ring-amber-500/30', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    Flavonoid: { ring: 'ring-fuchsia-500/30', text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
    Nutrient: { ring: 'ring-green-500/30', text: 'text-green-400', bg: 'bg-green-500/10' },
    Disease: { ring: 'ring-red-500/30', text: 'text-red-400', bg: 'bg-red-500/10' },
    General: { ring: 'ring-sky-500/30', text: 'text-sky-400', bg: 'bg-sky-500/10' },
}

/* ------------------------------------------------------------------ */
/*  FAQ Section                                                        */
/* ------------------------------------------------------------------ */
const FAQSection: React.FC = memo(() => {
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
                <p className="text-xs text-slate-500 mb-3">
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
                                <span className="text-slate-500">{group.icon}</span>
                                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    {group.title}
                                </h4>
                                <span className="text-xs tabular-nums text-slate-500 bg-slate-800 rounded-full px-2 py-0.5">
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
                    <div className="text-center py-10 text-slate-500 space-y-2">
                        <PhosphorIcons.MagnifyingGlass className="w-10 h-10 mx-auto text-slate-600" />
                        <p>{t('helpView.faq.noResults', { term: searchTerm })}</p>
                    </div>
                )}
            </div>
        </Card>
    )
})
FAQSection.displayName = 'FAQSection'

/* ------------------------------------------------------------------ */
/*  Visual Guides Section                                              */
/* ------------------------------------------------------------------ */
const VisualGuidesSection: React.FC = memo(() => {
    const { t } = useTranslation()

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-2">
                {t('helpView.tabs.guides')}
            </h3>
            <p className="text-sm text-slate-400 mb-4">{t('helpView.guides.subtitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visualGuidesData.map((guide) => (
                    <VisualGuideCard
                        key={guide.id}
                        guideId={guide.id}
                        title={t(guide.titleKey)}
                        description={t(guide.descriptionKey)}
                    />
                ))}
            </div>
        </Card>
    )
})
VisualGuidesSection.displayName = 'VisualGuidesSection'

/* ------------------------------------------------------------------ */
/*  Lexicon Section                                                    */
/* ------------------------------------------------------------------ */
const LexiconSection: React.FC = memo(() => {
    const { t } = useTranslation()
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState<LexiconCategory>('All')

    const getCategoryKey = (
        category: 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'Nutrient' | 'Disease' | 'General',
    ) => {
        if (category === 'General') return 'general'
        return `${category.toLowerCase()}s`
    }

    const augmentedLexicon = useMemo(
        () =>
            lexiconData
                .map((item) => {
                    const categoryKey = getCategoryKey(item.category)
                    const term = t(`helpView.lexicon.${categoryKey}.${item.key}.term`)
                    const definition = t(`helpView.lexicon.${categoryKey}.${item.key}.definition`)
                    return { ...item, term, definition }
                })
                .toSorted((a, b) => a.term.localeCompare(b.term)),
        [t],
    )

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { All: augmentedLexicon.length }
        for (const item of augmentedLexicon) {
            counts[item.category] = (counts[item.category] ?? 0) + 1
        }
        return counts
    }, [augmentedLexicon])

    const filteredLexicon = useMemo(() => {
        let items = augmentedLexicon
        if (activeCategory !== 'All') {
            items = items.filter((item) => item.category === activeCategory)
        }
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase()
            items = items.filter(
                (item) =>
                    item.term.toLowerCase().includes(lowerCaseSearch) ||
                    item.definition.toLowerCase().includes(lowerCaseSearch),
            )
        }
        return items
    }, [searchTerm, augmentedLexicon, activeCategory])

    // Alphabet quick-jump letters
    const availableLetters = useMemo(() => {
        const letters = new Set<string>()
        for (const item of filteredLexicon) {
            const first = item.term.charAt(0).toUpperCase()
            letters.add(first)
        }
        return Array.from(letters).toSorted((a, b) => a.localeCompare(b))
    }, [filteredLexicon])

    const scrollToLetter = useCallback((letter: string) => {
        const el = document.getElementById(`lexicon-letter-${letter}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [])

    // Group filtered items by first letter
    const groupedByLetter = useMemo(() => {
        const groups: Record<string, typeof filteredLexicon> = {}
        for (const item of filteredLexicon) {
            const letter = item.term.charAt(0).toUpperCase()
            if (!groups[letter]) groups[letter] = []
            groups[letter].push(item)
        }
        return groups
    }, [filteredLexicon])

    const categories: LexiconCategory[] = [
        'All',
        'Cannabinoid',
        'Terpene',
        'Flavonoid',
        'Nutrient',
        'Disease',
        'General',
    ]

    const categoryIcons: Record<LexiconCategory, React.ReactNode> = {
        All: <PhosphorIcons.GridFour className="w-3.5 h-3.5" />,
        Cannabinoid: <PhosphorIcons.Flask className="w-3.5 h-3.5" />,
        Terpene: <PhosphorIcons.Drop className="w-3.5 h-3.5" />,
        Flavonoid: <PhosphorIcons.Sparkle className="w-3.5 h-3.5" />,
        Nutrient: <PhosphorIcons.Drop className="w-3.5 h-3.5" />,
        Disease: <PhosphorIcons.FirstAidKit className="w-3.5 h-3.5" />,
        General: <PhosphorIcons.BookOpenText className="w-3.5 h-3.5" />,
    }

    return (
        <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                <h3 className="text-xl font-bold font-display text-primary-400">
                    {t('helpView.lexicon.title')}
                </h3>
                <span className="text-xs tabular-nums text-slate-500">
                    {t('helpView.lexicon.resultCount', {
                        count: filteredLexicon.length,
                        total: augmentedLexicon.length,
                    })}
                </span>
            </div>
            <p className="text-sm text-slate-400 mb-4">{t('helpView.lexicon.subtitle')}</p>

            {/* Category filter with counts */}
            <div
                className="flex flex-wrap gap-2 mb-4"
                role="tablist"
                aria-label={t('common.accessibility.lexiconCategories')}
            >
                {categories.map((cat) => {
                    const count = categoryCounts[cat] ?? 0
                    const isActive = activeCategory === cat
                    const colors = cat !== 'All' ? CATEGORY_COLORS[cat] : undefined
                    const categoryButtonClass = isActive
                        ? `bg-primary-600 text-white shadow-lg ring-1 ring-primary-400 ${colors?.bg ?? ''}`
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white ring-1 ring-inset ring-slate-700/50'
                    const countPillClass = isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-700 text-slate-400'

                    return (
                        <button
                            key={cat}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveCategory(cat)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${categoryButtonClass}`}
                        >
                            {categoryIcons[cat]}
                            {t(`helpView.lexicon.categories.${cat.toLowerCase()}`)}
                            <span
                                className={`text-xs tabular-nums rounded-full px-1.5 py-px ${countPillClass}`}
                            >
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            <div className="mb-4">
                <SearchBar
                    placeholder={t('helpView.lexicon.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClear={() => setSearchTerm('')}
                />
            </div>

            {/* Alphabet quick-jump */}
            {availableLetters.length > 1 && (
                <nav
                    className="flex flex-wrap gap-1 mb-4"
                    aria-label={t('common.accessibility.alphabetNavigation')}
                >
                    {availableLetters.map((letter) => (
                        <button
                            key={letter}
                            type="button"
                            onClick={() => scrollToLetter(letter)}
                            className="w-7 h-7 rounded text-xs font-bold text-slate-400 bg-slate-800/60 hover:bg-primary-600 hover:text-white transition-colors duration-150 flex items-center justify-center"
                        >
                            {letter}
                        </button>
                    ))}
                </nav>
            )}

            {/* Grouped results by letter */}
            {filteredLexicon.length > 0 ? (
                <div className="space-y-6">
                    {Object.keys(groupedByLetter)
                        .toSorted((a, b) => a.localeCompare(b))
                        .map((letter) => (
                            <section key={letter}>
                                <div
                                    id={`lexicon-letter-${letter}`}
                                    className="flex items-center gap-3 mb-3 scroll-mt-4"
                                >
                                    <span className="text-lg font-bold text-primary-400/70 w-7 text-center">
                                        {letter}
                                    </span>
                                    <div className="h-px flex-1 bg-slate-700/40" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(groupedByLetter[letter] ?? []).map((item) => (
                                        <LexiconCard
                                            key={item.key}
                                            entry={{ key: item.key, category: item.category }}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                </div>
            ) : (
                <div className="text-center py-10 text-slate-500 space-y-2 md:col-span-2 lg:col-span-3">
                    <PhosphorIcons.MagnifyingGlass className="w-10 h-10 mx-auto text-slate-600" />
                    <p>{t('helpView.lexicon.noResults', { term: searchTerm })}</p>
                </div>
            )}
        </Card>
    )
})
LexiconSection.displayName = 'LexiconSection'

/* ------------------------------------------------------------------ */
/*  Manual Section                                                     */
/* ------------------------------------------------------------------ */
const ManualSection: React.FC = memo(() => {
    const { t } = useTranslation()
    const manualContent: Record<string, ManualSectionData> = t('helpView.manual', {
        returnObjects: true,
    })

    const sectionOrder = useMemo(
        () => [
            'introduction',
            'general',
            'strains',
            'plants',
            'equipment',
            'knowledge',
            'settings',
        ],
        [],
    )

    const icons: Record<string, React.ReactNode> = useMemo(
        () => ({
            introduction: <PhosphorIcons.Info className="w-6 h-6" />,
            strains: <PhosphorIcons.Leafy className="w-6 h-6" />,
            plants: <PhosphorIcons.Plant className="w-6 h-6" />,
            equipment: <PhosphorIcons.Wrench className="w-6 h-6" />,
            knowledge: <PhosphorIcons.BookBookmark className="w-6 h-6" />,
            settings: <PhosphorIcons.Gear className="w-6 h-6" />,
            general: <PhosphorIcons.Cube className="w-6 h-6" />,
        }),
        [],
    )

    const sectionColors: Record<string, string> = useMemo(
        () => ({
            introduction: 'border-l-blue-500',
            general: 'border-l-slate-500',
            strains: 'border-l-lime-500',
            plants: 'border-l-emerald-500',
            equipment: 'border-l-amber-500',
            knowledge: 'border-l-violet-500',
            settings: 'border-l-sky-500',
        }),
        [],
    )

    const scrollToSection = useCallback((key: string) => {
        const el = document.getElementById(`manual-section-${key}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [])

    const validSections = useMemo(
        () => sectionOrder.filter((key) => manualContent[key]),
        [sectionOrder, manualContent],
    )

    const renderSubSection = (
        sectionKey: string,
        sectionData: ManualSectionData,
        parentColor: string,
    ) => {
        const title = sectionData.title
        const content = sectionData.content

        return (
            <details
                key={sectionKey}
                open={false}
                className={`group bg-slate-900 rounded-lg ring-1 ring-inset ring-slate-700/50 hover:ring-primary-500/30 transition-[box-shadow,color] duration-200 border-l-2 ${parentColor}`}
            >
                <summary className="list-none flex items-center gap-2 cursor-pointer p-3 text-md font-semibold text-primary-300 select-none">
                    <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-300 group-open:rotate-180 flex-shrink-0" />
                    {title}
                </summary>
                <Speakable elementId={`manual-sub-${sectionKey}`}>
                    <div className="p-3 border-t border-slate-700/50 animate-fade-in">
                        {content && (
                            <SafeHtml
                                html={content}
                                className="prose prose-sm dark:prose-invert max-w-none"
                            />
                        )}
                    </div>
                </Speakable>
            </details>
        )
    }

    const renderSection = (sectionKey: string, sectionData: ManualSectionData, index: number) => {
        const title = sectionData.title
        const content = sectionData.content
        const subSections = Object.keys(sectionData).filter(
            (key) => key !== 'title' && key !== 'content' && key !== 'toc',
        )
        const colorClass = sectionColors[sectionKey] ?? 'border-l-slate-500'

        return (
            <details
                key={sectionKey}
                id={`manual-section-${sectionKey}`}
                open={index === 0}
                className={`group bg-slate-800 rounded-lg overflow-hidden ring-1 ring-inset ring-slate-700/50 hover:ring-primary-500/30 transition-[box-shadow,color] duration-200 scroll-mt-4 border-l-3 ${colorClass}`}
            >
                <summary className="list-none flex justify-between items-center p-4 cursor-pointer font-bold text-slate-100 select-none">
                    <div className="flex items-center gap-3">
                        <span className="text-primary-400">{icons[sectionKey]}</span>
                        <div>
                            <span className="text-lg">{title}</span>
                            {subSections.length > 0 && (
                                <span className="ml-2 text-xs tabular-nums text-slate-500 font-normal">
                                    {t('helpView.subSectionCount', { count: subSections.length })}
                                </span>
                            )}
                        </div>
                    </div>
                    <PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-300 group-open:rotate-180 shrink-0" />
                </summary>
                <div className="px-4 pb-3 border-t border-slate-700/50 animate-fade-in">
                    {content && (
                        <Speakable elementId={`manual-main-${sectionKey}`}>
                            <SafeHtml
                                html={content}
                                className="prose prose-sm dark:prose-invert max-w-none my-4"
                            />
                        </Speakable>
                    )}
                    {subSections.length > 0 && (
                        <div className="space-y-2 py-2">
                            {subSections.map((key) => {
                                const sub = sectionData[key]
                                return typeof sub === 'object' && sub !== null
                                    ? renderSubSection(key, sub as ManualSectionData, colorClass)
                                    : null
                            })}
                        </div>
                    )}
                </div>
            </details>
        )
    }

    return (
        <div className="space-y-4">
            {/* Table of Contents */}
            <Card className="bg-slate-800/40 ring-1 ring-inset ring-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                    <PhosphorIcons.ListBullets className="w-5 h-5 text-primary-400" />
                    <h4 className="text-sm font-semibold text-slate-300">
                        {t('helpView.manual.toc')}
                    </h4>
                </div>
                <nav
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                    aria-label={t('common.accessibility.manualTableOfContents')}
                >
                    {validSections.map((key) => {
                        const sec = manualContent[key]
                        return (
                            <button
                                type="button"
                                key={key}
                                onClick={() => scrollToSection(key)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/60 hover:bg-primary-600/20 hover:text-primary-300 text-slate-400 text-xs font-medium transition-colors duration-150 text-left"
                            >
                                <span className="shrink-0 text-primary-500/70">{icons[key]}</span>
                                <span className="truncate">{sec?.title ?? key}</span>
                            </button>
                        )
                    })}
                </nav>
            </Card>

            {/* Sections */}
            {validSections.map((key, idx) => {
                const section = manualContent[key]
                return section ? renderSection(key, section, idx) : null
            })}
        </div>
    )
})
ManualSection.displayName = 'ManualSection'

/* ------------------------------------------------------------------ */
/*  Help View (Main)                                                   */
/* ------------------------------------------------------------------ */
type HelpTabId = 'manual' | 'lexicon' | 'guides' | 'faq'

export const HelpView: React.FC = () => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<HelpTabId>('manual')

    const tabMeta = useMemo(
        () => ({
            manual: {
                icon: (
                    <PhosphorIcons.BookBookmark className="w-14 h-14 mx-auto text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.3)]" />
                ),
                title: t('helpView.tabs.manual'),
                description: t('helpView.tabs.manualDescription'),
                count: 7,
                countLabel: t('helpView.sectionCount', { count: 7 }),
            },
            lexicon: {
                icon: (
                    <PhosphorIcons.BookOpenText className="w-14 h-14 mx-auto text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.3)]" />
                ),
                title: t('helpView.tabs.lexicon'),
                description: t('helpView.tabs.lexiconDescription'),
                count: lexiconData.length,
                countLabel: t('helpView.termCount', { count: lexiconData.length }),
            },
            guides: {
                icon: (
                    <PhosphorIcons.GraduationCap className="w-14 h-14 mx-auto text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.3)]" />
                ),
                title: t('helpView.tabs.guides'),
                description: t('helpView.tabs.guidesDescription'),
                count: visualGuidesData.length,
                countLabel: t('helpView.guideCount', { count: visualGuidesData.length }),
            },
            faq: {
                icon: (
                    <PhosphorIcons.Question
                        weight="fill"
                        className="w-14 h-14 mx-auto text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.3)]"
                    />
                ),
                title: t('helpView.tabs.faq'),
                description: t('helpView.tabs.faqDescription'),
                count: faqData.length,
                countLabel: t('helpView.itemCount', { count: faqData.length }),
            },
        }),
        [t],
    )

    const currentMeta = tabMeta[activeTab]

    const renderContent = () => {
        switch (activeTab) {
            case 'manual':
                return <ManualSection />
            case 'lexicon':
                return <LexiconSection />
            case 'guides':
                return <VisualGuidesSection />
            case 'faq':
                return <FAQSection />
            default:
                return null
        }
    }

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center mb-4 animate-fade-in" key={activeTab}>
                <div className="mb-3">{currentMeta?.icon}</div>
                <h2 className="text-3xl font-bold font-display text-slate-100">
                    {currentMeta?.title ?? t('helpView.title')}
                </h2>
                <p className="text-sm text-slate-400 mt-1.5 max-w-lg mx-auto">
                    {currentMeta?.description}
                </p>
                <span className="inline-block mt-2 text-xs tabular-nums text-slate-500 bg-slate-800/70 rounded-full px-3 py-1">
                    {currentMeta?.countLabel}
                </span>
            </div>

            <HelpSubNav activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="animate-fade-in" key={`content-${activeTab}`}>
                {renderContent()}
            </div>
        </div>
    )
}

export default HelpView
