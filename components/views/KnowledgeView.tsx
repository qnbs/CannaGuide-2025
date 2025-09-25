import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Tabs } from '@/components/common/Tabs';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { GuideTab } from './knowledge/GuideTab';
import { MentorArchiveTab } from './knowledge/MentorArchiveTab';
import { AiMentor } from './knowledge/AiMentor';

type KnowledgeViewTab = 'guide' | 'archive';

export const KnowledgeView: React.FC = () => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<KnowledgeViewTab>('guide');

    const tabs = [
        { id: 'guide', label: t('knowledgeView.tabs.guide'), icon: <PhosphorIcons.BookOpenText /> },
        { id: 'archive', label: t('knowledgeView.tabs.archive'), icon: <PhosphorIcons.ArchiveBox /> },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold font-display text-slate-100">{t('knowledgeView.title')}</h2>
                <p className="text-slate-400 mt-1">{t('knowledgeView.subtitle')}</p>
            </div>

            <AiMentor />

            <Card>
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => setActiveTab(id as KnowledgeViewTab)} />
            </Card>

            {activeTab === 'guide' && <GuideTab />}
            {activeTab === 'archive' && <MentorArchiveTab />}
        </div>
    );
};
