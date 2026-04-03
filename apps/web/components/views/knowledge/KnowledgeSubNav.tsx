import React from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { KnowledgeViewTab } from '@/types'

interface KnowledgeSubNavProps {
    activeTab: KnowledgeViewTab
    onTabChange: (tab: KnowledgeViewTab) => void
}

export const KnowledgeSubNav: React.FC<KnowledgeSubNavProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation()

    const navItems: Array<{
        id: KnowledgeViewTab
        label: string
        icon: React.ReactNode
    }> = [
        {
            id: KnowledgeViewTab.Mentor,
            label: t('knowledgeView.tabs.mentor'),
            icon: <PhosphorIcons.Brain />,
        },
        {
            id: KnowledgeViewTab.Guide,
            label: t('knowledgeView.tabs.guide'),
            icon: <PhosphorIcons.Book />,
        },
        {
            id: KnowledgeViewTab.Lexikon,
            label: t('knowledgeView.tabs.lexikon'),
            icon: <PhosphorIcons.BookOpenText />,
        },
        {
            id: KnowledgeViewTab.Atlas,
            label: t('knowledgeView.tabs.atlas'),
            icon: <PhosphorIcons.FirstAidKit />,
        },
        {
            id: KnowledgeViewTab.Rechner,
            label: t('knowledgeView.tabs.rechner'),
            icon: <PhosphorIcons.Calculator />,
        },
        {
            id: KnowledgeViewTab.Lernpfad,
            label: t('knowledgeView.tabs.lernpfad'),
            icon: <PhosphorIcons.GraduationCap />,
        },
        {
            id: KnowledgeViewTab.Archive,
            label: t('knowledgeView.tabs.archive'),
            icon: <PhosphorIcons.Archive />,
        },
        {
            id: KnowledgeViewTab.Sandbox,
            label: t('knowledgeView.tabs.sandbox'),
            icon: <PhosphorIcons.Flask />,
        },
    ]

    return (
        <nav
            className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scroll-smooth snap-x"
            aria-label={t('knowledgeView.tabs.navLabel')}
        >
            {navItems.map((item) => (
                <button
                    type="button"
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-lg transition-all duration-200 snap-start shrink-0 min-w-[4.5rem]
                        ${
                            activeTab === item.id
                                ? 'bg-primary-600 text-white scale-105 shadow-lg ring-1 ring-primary-400'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                    aria-label={item.label}
                    aria-current={activeTab === item.id ? 'page' : undefined}
                >
                    <div className="w-5 h-5">{item.icon}</div>
                    <span className="text-[10px] font-semibold text-center leading-tight">
                        {item.label}
                    </span>
                </button>
            ))}
        </nav>
    )
}
