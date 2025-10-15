import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Card } from '@/components/common/Card';
import { Tabs } from '@/components/common/Tabs';

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
        <Card className="!p-2 !bg-slate-950">
            <Tabs tabs={navItems} activeTab={activeTab} setActiveTab={onTabChange} />
        </Card>
    );
};