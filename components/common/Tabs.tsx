import React from 'react'

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
    buttonClassName?: string
}

export const Tabs: React.FC<TabsProps> = ({
    tabs,
    activeTab,
    setActiveTab,
    className = '',
    buttonClassName = '',
}) => {
    return (
        <nav
            className={`-mx-2 px-2 ${className}`}
            role="tablist"
        >
            <div className="flex flex-wrap items-center gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ring-1 ring-inset ring-white/20 ${
                            activeTab === tab.id
                                ? 'bg-slate-700 text-primary-300 shadow-sm'
                                : 'text-slate-300 bg-slate-800/60 hover:bg-slate-700/80'
                        } ${buttonClassName}`}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`tab-panel-${tab.id}`}
                        id={`tab-${tab.id}`}
                    >
                        {tab.icon && <div className="w-5 h-5">{tab.icon}</div>}
                        {tab.label}
                    </button>
                ))}
            </div>
        </nav>
    )
}