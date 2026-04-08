import React, { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { faqData } from '@/data/faq'
import { visualGuidesData } from '@/data/visualGuides'
import { lexiconData } from '@/data/lexicon'

interface HelpSubNavProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

const TAB_IDS = ['manual', 'lexicon', 'guides', 'faq'] as const

export const HelpSubNav: React.FC<HelpSubNavProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation()
    const navRef = useRef<HTMLElement>(null)

    const navItems = [
        {
            id: 'manual',
            label: t('helpView.tabs.manual'),
            icon: <PhosphorIcons.BookOpenText />,
            count: 7,
        },
        {
            id: 'lexicon',
            label: t('helpView.tabs.lexicon'),
            icon: <PhosphorIcons.Book />,
            count: lexiconData.length,
        },
        {
            id: 'guides',
            label: t('helpView.tabs.guides'),
            icon: <PhosphorIcons.GraduationCap />,
            count: visualGuidesData.length,
        },
        {
            id: 'faq',
            label: t('helpView.tabs.faq'),
            icon: <PhosphorIcons.Question />,
            count: faqData.length,
        },
    ]

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const currentIndex = (TAB_IDS as readonly string[]).indexOf(activeTab)
            if (currentIndex === -1) return

            let nextIndex = -1
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % TAB_IDS.length
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                nextIndex = (currentIndex - 1 + TAB_IDS.length) % TAB_IDS.length
            } else if (e.key === 'Home') {
                nextIndex = 0
            } else if (e.key === 'End') {
                nextIndex = TAB_IDS.length - 1
            }

            if (nextIndex >= 0) {
                e.preventDefault()
                const nextTab = TAB_IDS[nextIndex]
                if (nextTab) onTabChange(nextTab)
                const btns =
                    navRef.current?.querySelectorAll<HTMLButtonElement>('button[role="tab"]')
                btns?.[nextIndex]?.focus()
            }
        },
        [activeTab, onTabChange],
    )

    return (
        <nav
            ref={navRef}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3"
            aria-label={t('common.accessibility.helpNavigation')}
        >
            {navItems.map((item) => {
                const isActive = activeTab === item.id
                const countBadgeClassName = `text-[10px] tabular-nums font-medium rounded-full px-1.5 py-px ${isActive ? 'bg-white/20 text-white/80' : 'bg-slate-700/80 text-slate-500'}`
                return (
                    <button
                        type="button"
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        onKeyDown={handleKeyDown}
                        className={`relative flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-lg transition-all duration-200 min-h-[56px] sm:min-h-[64px] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                            ${
                                isActive
                                    ? 'bg-primary-600 text-white scale-[1.03] shadow-lg shadow-primary-600/20 ring-1 ring-primary-400'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white ring-1 ring-inset ring-slate-700/50'
                            }`}
                        aria-label={item.label}
                        aria-pressed={isActive}
                    >
                        <div className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">{item.icon}</div>
                        <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight line-clamp-2 w-full break-words">
                            {item.label}
                        </span>
                        <span className={countBadgeClassName}>{item.count}</span>
                        {/* Active indicator bar */}
                        {isActive && (
                            <span className="absolute -bottom-0.5 left-1/4 right-1/4 h-0.5 rounded-full bg-white/60" />
                        )}
                    </button>
                )
            })}
        </nav>
    )
}
