import React, { useRef, useState, useLayoutEffect, useCallback } from 'react'

interface Tab {
    id: string
    label: string
    icon?: React.ReactNode
}

interface TabsProps {
    tabs: Tab[]
    activeTab: string
    setActiveTab: (id: string) => void
    className?: string
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab, className = '' }) => {
    const navRef = useRef<HTMLDivElement>(null)
    const [indicatorStyle, setIndicatorStyle] = useState({})

    useLayoutEffect(() => {
        if (navRef.current) {
            const activeButton = navRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement
            if (activeButton) {
                setIndicatorStyle({
                    left: `${activeButton.offsetLeft}px`,
                    width: `${activeButton.offsetWidth}px`,
                })
            }
        }
    }, [activeTab, tabs])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const currentIndex = tabs.findIndex((t) => t.id === activeTab)
            let nextIndex = -1

            if (e.key === 'ArrowRight') {
                nextIndex = (currentIndex + 1) % tabs.length
            } else if (e.key === 'ArrowLeft') {
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
            } else if (e.key === 'Home') {
                nextIndex = 0
            } else if (e.key === 'End') {
                nextIndex = tabs.length - 1
            }

            if (nextIndex >= 0) {
                e.preventDefault()
                setActiveTab(tabs[nextIndex].id)
                const btn = navRef.current?.querySelector(`[data-tab-id="${tabs[nextIndex].id}"]`) as HTMLElement
                btn?.focus()
            }
        },
        [tabs, activeTab, setActiveTab],
    )

    return (
        <nav
            ref={navRef}
            className={`glass-pane relative flex items-center gap-1 overflow-x-auto rounded-[1.25rem] p-1.5 no-scrollbar ${className}`}
            role="tablist"
            onKeyDown={handleKeyDown}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    data-tab-id={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                        className={`relative z-10 flex min-h-11 flex-shrink-0 items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                        activeTab === tab.id
                            ? 'text-slate-50'
                            : 'text-slate-400 hover:text-slate-100'
                    }`}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    tabIndex={activeTab === tab.id ? 0 : -1}
                    title={tab.label}
                >
                    {tab.icon && <div className="w-5 h-5">{tab.icon}</div>}
                    <span className={tab.icon ? 'hidden sm:inline' : ''}>{tab.label}</span>
                </button>
            ))}
            {/* Sliding indicator */}
            <div
                className="absolute inset-y-1.5 h-auto rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(var(--color-primary-500),0.24),rgba(var(--color-primary-300),0.12))] shadow-[0_10px_30px_rgba(8,145,178,0.22)]"
                style={{
                    ...indicatorStyle,
                    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                aria-hidden="true"
            />
        </nav>
    )
}