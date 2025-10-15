import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { StrainViewTab } from '@/types';
import { Card } from '@/components/common/Card';
import { Tabs } from '@/components/common/Tabs';

interface StrainSubNavProps {
    activeTab: StrainViewTab;
    onTabChange: (tab: StrainViewTab) => void;
    counts: {
        exports: number;
        tips: number;
    }
}

export const StrainSubNav: React.FC<StrainSubNavProps> = ({ activeTab, onTabChange, counts }) => {
    const { t } = useTranslation();

    const navItems = [
        { id: StrainViewTab.All, icon: <PhosphorIcons.Leafy />, label: t('strainsView.tabs.allStrains') },
        { id: StrainViewTab.MyStrains, icon: <PhosphorIcons.Star />, label: t('strainsView.tabs.myStrains') },
        { id: StrainViewTab.Favorites, icon: <PhosphorIcons.Heart />, label: t('strainsView.tabs.favorites') },
        { id: StrainViewTab.Genealogy, icon: <PhosphorIcons.TreeStructure />, label: t('strainsView.tabs.genealogy') },
        { id: StrainViewTab.Exports, icon: <PhosphorIcons.DownloadSimple />, label: t('strainsView.tabs.exports', { count: counts.exports }) },
        { id: StrainViewTab.Tips, icon: <PhosphorIcons.LightbulbFilament />, label: t('strainsView.tabs.tips', { count: counts.tips }) },
    ];
    
    return (
        <Card className="!p-2 !bg-slate-950">
            <Tabs tabs={navItems} activeTab={activeTab} setActiveTab={onTabChange as (id: string) => void} />
        </Card>
    );
};