import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { KnowledgeViewTab } from '@/types';
import { Card } from '@/components/common/Card';
import { Tabs } from '@/components/common/Tabs';

interface KnowledgeSubNavProps {
    activeTab: KnowledgeViewTab;
    onTabChange: (tab: KnowledgeViewTab) => void;
}

export const KnowledgeSubNav: React.FC<KnowledgeSubNavProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();

    const navItems = [
        { id: KnowledgeViewTab.Mentor, label: t('knowledgeView.tabs.mentor'), icon: <PhosphorIcons.Brain /> },
        { id: KnowledgeViewTab.Guide, label: t('knowledgeView.tabs.guide'), icon: <PhosphorIcons.Book /> },
        { id: KnowledgeViewTab.Archive, label: t('knowledgeView.tabs.archive'), icon: <PhosphorIcons.Archive /> },
        { id: KnowledgeViewTab.Breeding, label: t('knowledgeView.tabs.breeding'), icon: <PhosphorIcons.TestTube /> },
        { id: KnowledgeViewTab.Sandbox, label: t('knowledgeView.tabs.sandbox'), icon: <PhosphorIcons.Flask /> },
    ];
    
    return (
        <Card className="!p-2 !bg-slate-950">
            <Tabs tabs={navItems} activeTab={activeTab} setActiveTab={onTabChange as (id: string) => void} />
        </Card>
    );
};