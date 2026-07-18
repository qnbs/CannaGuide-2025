import React, { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { faqData } from '@/data/faq'
import { visualGuidesData } from '@/data/visualGuides'
import { lexiconData } from '@/data/lexicon'
import { HelpSubNav } from './help/HelpSubNav'
import { ManualSection } from './help/ManualSection'
import { LexiconSection } from './help/LexiconSection'
import { VisualGuidesSection } from './help/VisualGuidesSection'
import { FAQSection } from './help/FAQSection'
// ScreenshotGallery disabled -- screenshot assets not yet generated
// import { ScreenshotGallery } from './help/ScreenshotGallery'

type HelpTabId = 'manual' | 'lexicon' | 'guides' | 'faq'

export const HelpView: React.FC = () => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<HelpTabId>('manual')

    // Scroll to top on tab change
    useEffect(() => {
        const mainEl = document.getElementById('main-content')
        if (mainEl) {
            mainEl.scrollTop = 0
        }
    }, [activeTab])

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
                <span className="inline-block mt-2 text-xs tabular-nums text-muted bg-slate-800/70 rounded-full px-3 py-1">
                    {currentMeta?.countLabel}
                </span>
            </div>

            <HelpSubNav
                activeTab={activeTab}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- HelpSubNav uses string
                onTabChange={(tab) => setActiveTab(tab as HelpTabId)}
            />

            <div className="animate-fade-in" key={`content-${activeTab}`}>
                {renderContent()}
            </div>
        </div>
    )
}

export default HelpView
