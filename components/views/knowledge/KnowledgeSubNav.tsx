import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { KnowledgeViewTab } from '@/types';

interface KnowledgeSubNavProps {
    activeTab: KnowledgeViewTab;
    onTabChange: (tab: KnowledgeViewTab) => void;
}

export const KnowledgeSubNav: React.FC<KnowledgeSubNavProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();

    const navItems: Array<{ id: KnowledgeViewTab | 'placeholder', label: string, icon: React.ReactNode }> = [
        { id: KnowledgeViewTab.Mentor, label: t('knowledgeView.tabs.mentor'), icon: <PhosphorIcons.Brain /> },
        { id: KnowledgeViewTab.Guide, label: t('knowledgeView.tabs.guide'), icon: <PhosphorIcons.Book /> },
        { id: KnowledgeViewTab.Archive, label: t('knowledgeView.tabs.archive'), icon: <PhosphorIcons.Archive /> },
        { id: KnowledgeViewTab.Breeding, label: t('knowledgeView.tabs.breeding'), icon: <PhosphorIcons.TestTube /> },
        { id: KnowledgeViewTab.Sandbox, label: t('knowledgeView.tabs.sandbox'), icon: <PhosphorIcons.Flask /> },
    ];

    if (navItems.length === 5) {
        navItems.push({ id: 'placeholder', icon: <div />, label: '' });
    }
    
    return (
        <nav className="grid grid-cols-3 gap-2 sm:gap-4">
             {navItems.map(item => {
                 if (item.id === 'placeholder') {
                    return <div key={item.id} className="hidden sm:block"></div>;
                }
                return (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id as KnowledgeViewTab)}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg transition-all duration-200
                            ${activeTab === item.id 
                                ? 'bg-primary-600 text-white scale-105 shadow-lg ring-1 ring-primary-400' 
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        <div className="w-6 h-6">{item.icon}</div>
                        <span className="text-xs font-semibold text-center">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};
