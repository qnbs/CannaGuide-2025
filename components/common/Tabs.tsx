import React, { useRef, useState, useLayoutEffect } from 'react'

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

    return (
        <nav
            ref={navRef}
            className={`relative flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar ${className}`}
            role="tablist"
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    data-tab-id={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap focus:outline-none focus-visible:bg-slate-700/50 rounded-t-md ${
                        activeTab === tab.id
                            ? 'text-primary-300 text-glow'
                            : 'text-slate-400 hover:text-slate-100'
                    }`}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    title={tab.label}
                >
                    {tab.icon && <div className="w-5 h-5">{tab.icon}</div>}
                    <span className={tab.icon ? 'hidden sm:inline' : ''}>{tab.label}</span>
                </button>
            ))}
            {/* Sliding indicator */}
            <div
                className="absolute bottom-0 h-1 bg-primary-400 rounded-full shadow-[0_0_10px_rgb(var(--color-primary-400))]"
                style={{
                    ...indicatorStyle,
                    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            />
            {/* Full-width bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-700 -z-10"></div>
        </nav>
    )
}