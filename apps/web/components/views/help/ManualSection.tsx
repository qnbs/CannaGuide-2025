import React, { useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Speakable } from '@/components/common/Speakable'
import { SafeHtml } from '@/components/common/SafeHtml'

export type ManualSectionData = {
    title?: string
    content?: string
    [key: string]: ManualSectionData | string | undefined
}

export const ManualSection: React.FC = memo(() => {
    const { t } = useTranslation()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- i18next returnObjects
    const manualContent = t('helpView.manual', { returnObjects: true }) as Record<
        string,
        ManualSectionData
    >

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
                                <span className="ml-2 text-xs tabular-nums text-muted font-normal">
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
