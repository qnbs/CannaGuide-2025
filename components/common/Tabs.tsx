import React from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    setActiveTab: (id: string) => void;
    className?: string;
    buttonClassName?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab, className = '', buttonClassName = '' }) => {
    return (
        <nav className={`flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 ${className}`}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                            ? 'bg-slate-700 text-primary-300 shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800'
                    } ${buttonClassName}`}
                >
                    {tab.icon && <div className="w-5 h-5">{tab.icon}</div>}
                    {tab.label}
                </button>
            ))}
        </nav>
    );
};
