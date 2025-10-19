import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface SettingsSubNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const SettingsSubNav: React.FC<SettingsSubNavProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();

    const navItems: Array<{ id: string, label: string, icon: React.ReactNode }> = [
        { id: 'general', icon: <PhosphorIcons.GearSix />, label: t('settingsView.categories.general') },
        { id: 'tts', icon: <PhosphorIcons.SpeakerHigh />, label: t('settingsView.categories.tts') },
        { id: 'strains', icon: <PhosphorIcons.Leafy />, label: t('settingsView.categories.strains') },
        { id: 'plants', icon: <PhosphorIcons.Plant />, label: t('settingsView.categories.plants') },
        { id: 'data', icon: <PhosphorIcons.Archive />, label: t('settingsView.categories.data') },
        { id: 'about', icon: <PhosphorIcons.Info />, label: t('settingsView.categories.about') },
    ];
    
    return (
        <nav className="grid grid-cols-3 gap-2 sm:gap-4">
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
