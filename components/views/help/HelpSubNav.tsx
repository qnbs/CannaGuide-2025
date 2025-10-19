import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface HelpSubNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const HelpSubNav: React.FC<HelpSubNavProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();

    const navItems = [
        { id: 'manual', label: t('helpView.tabs.manual'), icon: <PhosphorIcons.BookOpenText /> },
        { id: 'lexicon', label: t('helpView.tabs.lexicon'), icon: <PhosphorIcons.Book /> },
        { id: 'guides', label: t('helpView.tabs.guides'), icon: <PhosphorIcons.GraduationCap /> },
        { id: 'faq', label: t('helpView.tabs.faq'), icon: <PhosphorIcons.Question /> },
    ];
    
     return (
        <nav className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg transition-all duration-200
                        ${activeTab === item.id 
                            ? 'bg-primary-600 text-white scale-105 shadow-lg ring-1 ring-primary-400' 
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                >
                    <div className="w-6 h-6">{item.icon}</div>
                    <span className="text-xs font-semibold text-center">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};
