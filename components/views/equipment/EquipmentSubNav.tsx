import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { EquipmentViewTab } from '@/types';
import { Card } from '@/components/common/Card';
import { Tabs } from '@/components/common/Tabs';

interface EquipmentSubNavProps {
    activeTab: EquipmentViewTab;
    onTabChange: (tab: EquipmentViewTab) => void;
}

export const EquipmentSubNav: React.FC<EquipmentSubNavProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();

    const navItems = [
        { id: EquipmentViewTab.Configurator, label: t('equipmentView.tabs.configurator'), icon: <PhosphorIcons.MagicWand /> },
        { id: EquipmentViewTab.Setups, label: t('equipmentView.tabs.setups'), icon: <PhosphorIcons.ArchiveBox /> },
        { id: EquipmentViewTab.Calculators, label: t('equipmentView.tabs.calculators'), icon: <PhosphorIcons.Calculator /> },
        { id: EquipmentViewTab.GrowShops, label: t('equipmentView.tabs.growShops'), icon: <PhosphorIcons.Storefront /> },
        { id: EquipmentViewTab.Seedbanks, label: t('equipmentView.tabs.seedbanks'), icon: <PhosphorIcons.Cannabis /> },
    ];
    
    return (
        <Card className="!p-2 !bg-slate-950">
            <Tabs tabs={navItems} activeTab={activeTab} setActiveTab={onTabChange as (id: string) => void} />
        </Card>
    );
};