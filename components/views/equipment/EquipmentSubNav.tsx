import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { EquipmentViewTab } from '@/types';

interface EquipmentSubNavProps {
    activeTab: EquipmentViewTab;
    onTabChange: (tab: EquipmentViewTab) => void;
}

export const EquipmentSubNav: React.FC<EquipmentSubNavProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();

    const navItems: Array<{ id: EquipmentViewTab | 'placeholder', label: string, icon: React.ReactNode }> = [
        { id: EquipmentViewTab.Configurator, label: t('equipmentView.tabs.configurator'), icon: <PhosphorIcons.MagicWand /> },
        { id: EquipmentViewTab.Setups, label: t('equipmentView.tabs.setups'), icon: <PhosphorIcons.ArchiveBox /> },
        { id: EquipmentViewTab.Calculators, label: t('equipmentView.tabs.calculators'), icon: <PhosphorIcons.Calculator /> },
        { id: EquipmentViewTab.GrowShops, label: t('equipmentView.tabs.growShops'), icon: <PhosphorIcons.Storefront /> },
        { id: EquipmentViewTab.Seedbanks, label: t('equipmentView.tabs.seedbanks'), icon: <PhosphorIcons.Cannabis /> },
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
                        onClick={() => onTabChange(item.id as EquipmentViewTab)}
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
