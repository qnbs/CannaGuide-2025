import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { StrainViewTab } from '@/types';

interface StrainSubNavProps {
    activeTab: StrainViewTab;
    onTabChange: (tab: StrainViewTab) => void;
    counts: {
        tips: number;
        exports: number;
    }
}

export const StrainSubNav: React.FC<StrainSubNavProps> = ({ activeTab, onTabChange, counts }) => {
    const { t } = useTranslation();

    const navItems: Array<{ id: StrainViewTab, label: string, icon: React.ReactNode }> = [
        { id: StrainViewTab.All, icon: <PhosphorIcons.Leafy />, label: t('strainsView.tabs.allStrains') },
        { id: StrainViewTab.MyStrains, icon: <PhosphorIcons.Star />, label: t('strainsView.tabs.myStrains') },
        { id: StrainViewTab.Favorites, icon: <PhosphorIcons.Heart />, label: t('strainsView.tabs.favorites') },
        { id: StrainViewTab.Genealogy, icon: <PhosphorIcons.TreeStructure />, label: t('strainsView.tabs.genealogy') },
        { id: StrainViewTab.Exports, icon: <PhosphorIcons.FileText />, label: t('strainsView.tabs.exports', { count: counts.exports }) },
        { id: StrainViewTab.Tips, icon: <PhosphorIcons.LightbulbFilament />, label: t('strainsView.tabs.tips', { count: counts.tips }) },
    ];
    
    return (
        <nav className="grid grid-cols-3 gap-2 sm:gap-4">
            {navItems.map(item => {
                return (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id as StrainViewTab)}
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