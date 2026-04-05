import React, { useMemo, useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { KnowledgeArticle } from '@/types'
import { knowledgeBase } from '@/data/knowledgebase'
import { Speakable } from '@/components/common/Speakable'
import { SafeHtml } from '@/components/common/SafeHtml'
import { updateKnowledgeProgress } from '@/stores/slices/knowledgeSlice'
import { selectKnowledgeProgress } from '@/stores/selectors'
import { useDispatch, useSelector } from 'react-redux'

const GuideViewComponent: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const progress = useSelector(selectKnowledgeProgress)
    const [activeSection, setActiveSection] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState('')
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

    const getGroupInfo = (
        groupName: string,
    ): { icon: React.ReactNode; color: string; accentColor: string } => {
        if (groupName === 'Phases') {
            return {
                icon: <PhosphorIcons.Plant />,
                color: 'text-secondary-400',
                accentColor: 'border-secondary-500',
            }
        }
        if (groupName === 'Troubleshooting') {
            return {
                icon: <PhosphorIcons.FirstAidKit />,
                color: 'text-danger',
                accentColor: 'border-danger',
            }
        }
        if (groupName === 'Core Concepts') {
            return {
                icon: <PhosphorIcons.Brain />,
                color: 'text-accent-400',
                accentColor: 'border-accent-500',
            }
        }
        if (groupName === 'GrowTech') {
            return {
                icon: <PhosphorIcons.LightbulbFilament />,
                color: 'text-yellow-400',
                accentColor: 'border-yellow-500',
            }
        }
        if (groupName === 'Genetics') {
            return {
                icon: <PhosphorIcons.TreeStructure />,
                color: 'text-emerald-400',
                accentColor: 'border-emerald-500',
            }
        }
        return {
            icon: <PhosphorIcons.BookOpenText />,
            color: 'text-slate-400',
            accentColor: 'border-slate-500',
        }
    }

    const groupedArticles = useMemo(() => {
        const groups: Record<
            string,
            { order: number; name: string; articles: KnowledgeArticle[] }
        > = {
            Phases: { order: 1, name: t('knowledgeView.guide.phases'), articles: [] },
            'Core Concepts': {
                order: 2,
                name: t('knowledgeView.guide.coreConcepts'),
                articles: [],
            },
            Troubleshooting: {
                order: 3,
                name: t('knowledgeView.guide.troubleshooting'),
                articles: [],
            },
            GrowTech: {
                order: 4,
                name: t('knowledgeView.guide.growTech'),
                articles: [],
            },
            Genetics: {
                order: 5,
                name: t('knowledgeView.guide.genetics'),
                articles: [],
            },
        }

        const groupNameMapping: Record<string, keyof typeof groups> = {
            phase: 'Phases',
            fix: 'Troubleshooting',
            concept: 'Core Concepts',
            growtech: 'GrowTech',
            genetics: 'Genetics',
        }
        const articleIdPrefixPattern = /^(phase|fix|concept|growtech|genetics)/
        const phaseNumberPattern = /\d+/

        const q = searchQuery.toLowerCase().trim()

        knowledgeBase.forEach((article) => {
            const groupMatch = articleIdPrefixPattern.exec(article.id)
            const groupToken = groupMatch?.[1]
            if (!groupToken) {
                return
            }

            const groupKey = groupNameMapping[groupToken]
            if (!groupKey) {
                return
            }
            const group = groups[groupKey]
            if (!group) {
                return
            }

            if (q) {
                const title = t(article.titleKey).toLowerCase()
                const content = t(article.contentKey).toLowerCase()
                const tags = article.tags.join(' ').toLowerCase()
                if (!title.includes(q) && !content.includes(q) && !tags.includes(q)) {
                    return
                }
            }

            group.articles.push(article)
        })

        // Sort articles within the 'Phases' group numerically by their title for correct order
        const phases = groups['Phases']
        if (phases) {
            phases.articles = phases.articles.toSorted((a, b) => {
                const aTitle = t(a.titleKey)
                const bTitle = t(b.titleKey)
                const aNum = Number.parseInt(phaseNumberPattern.exec(aTitle)?.[0] ?? '0')
                const bNum = Number.parseInt(phaseNumberPattern.exec(bTitle)?.[0] ?? '0')
                return aNum - bNum
            })
        }

        return Object.entries(groups)
            .filter(([, groupData]) => groupData.articles.length > 0)
            .toSorted((a, b) => a[1].order - b[1].order)
    }, [t, searchQuery])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id)
                    }
                })
            },
            // This configuration makes the section active when its top edge enters the top 20% of the viewport.
            { rootMargin: '-20% 0px -80% 0px', threshold: 0 },
        )

        const currentRefs = sectionRefs.current
        for (const key in currentRefs) {
            const ref = currentRefs[key]
            if (ref) observer.observe(ref)
        }

        return () => {
            for (const key in currentRefs) {
                const ref = currentRefs[key]
                if (ref) observer.unobserve(ref)
            }
        }
    }, [groupedArticles])

    useEffect(() => {
        if (groupedArticles.length > 0 && !activeSection) {
            setActiveSection(groupedArticles[0]?.[0] ?? '')
        }
    }, [groupedArticles, activeSection])

    const scrollToSection = (id: string) => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const totalArticles = knowledgeBase.length
    const readArticles = Object.values(progress).flat().length

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                        }}
                        placeholder={t('knowledgeView.guide.searchPlaceholder')}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        aria-label={t('knowledgeView.guide.searchPlaceholder')}
                    />
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                    {t('knowledgeView.guide.readProgress', {
                        read: readArticles,
                        total: totalArticles,
                    })}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <aside className="hidden md:block md:col-span-4 lg:col-span-3">
                    <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] space-y-2">
                        <h3 className="px-3 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                            {t('knowledgeView.tabs.guide')}
                        </h3>
                        <nav>
                            {groupedArticles.map(([groupKey, groupData]) => {
                                const { icon, color } = getGroupInfo(groupKey)
                                const isActive = activeSection === groupKey
                                const itemClassName = isActive
                                    ? `bg-slate-800 ${color}`
                                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                                return (
                                    <button
                                        type="button"
                                        key={groupKey}
                                        onClick={() => scrollToSection(groupKey)}
                                        aria-label={groupData.name}
                                        aria-current={isActive ? 'location' : undefined}
                                        className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${itemClassName}`}
                                    >
                                        <div className="w-5 h-5">{icon}</div>
                                        <span>{groupData.name}</span>
                                        <span className="ml-auto text-xs text-slate-500">
                                            {groupData.articles.length}
                                        </span>
                                    </button>
                                )
                            })}
                        </nav>
                    </div>
                </aside>

                <section className="md:col-span-8 lg:col-span-9 space-y-12">
                    {groupedArticles.length === 0 && (
                        <p className="text-slate-400 text-sm text-center py-8">
                            {t('knowledgeView.guide.noResults', { term: searchQuery })}
                        </p>
                    )}
                    {groupedArticles.map(([groupKey, groupData]) => {
                        const { icon, color, accentColor } = getGroupInfo(groupKey)
                        return (
                            <section
                                key={groupKey}
                                id={groupKey}
                                ref={(el) => {
                                    sectionRefs.current[groupKey] = el
                                }}
                                className="scroll-mt-20"
                            >
                                <h2
                                    className={`text-2xl font-bold font-display flex items-center gap-3 mb-4 ${color} border-b ${accentColor} pb-2`}
                                >
                                    {icon} {groupData.name}
                                </h2>
                                <div className="space-y-3">
                                    {groupData.articles.map((article, index) => {
                                        const isRead =
                                            progress[groupKey]?.includes(article.id) ?? false
                                        return (
                                            <details
                                                key={article.id}
                                                className="group bg-slate-800/50 rounded-lg overflow-hidden ring-1 ring-inset ring-white/20"
                                                open={index === 0}
                                                onToggle={(e) => {
                                                    if (
                                                        (e.target as HTMLDetailsElement).open &&
                                                        !isRead
                                                    ) {
                                                        dispatch(
                                                            updateKnowledgeProgress({
                                                                sectionId: groupKey,
                                                                itemId: article.id,
                                                            }),
                                                        )
                                                    }
                                                }}
                                            >
                                                <summary
                                                    className={`list-none flex justify-between items-center p-4 cursor-pointer border-l-4 ${accentColor}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isRead && (
                                                            <PhosphorIcons.CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                        )}
                                                        <h4 className="font-semibold text-slate-100">
                                                            {t(article.titleKey)}
                                                        </h4>
                                                    </div>
                                                    <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180 shrink-0" />
                                                </summary>
                                                <Speakable elementId={`guide-${article.id}`}>
                                                    <div className="p-4 border-t border-slate-700/50">
                                                        <SafeHtml
                                                            className="prose prose-sm dark:prose-invert max-w-none prose-h3:text-primary-400 prose-strong:text-slate-100 prose-ul:list-disc prose-ol:list-decimal prose-li:my-1"
                                                            html={t(article.contentKey)}
                                                        />
                                                    </div>
                                                </Speakable>
                                            </details>
                                        )
                                    })}
                                </div>
                            </section>
                        )
                    })}
                </section>
            </div>
        </div>
    )
}
export default GuideViewComponent
