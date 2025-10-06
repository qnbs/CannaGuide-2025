import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs } from '@/components/common/Tabs';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { MentorArchiveTab } from './MentorArchiveTab';
import { GlobalAdvisorArchiveView } from '../plants/GlobalAdvisorArchiveView';

export const ArchiveView: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('mentor');

    const tabs = [
        { id: 'mentor', label: t('knowledgeView.tabs.mentor'), icon: <PhosphorIcons.Brain /> },
        { id: 'advisor', label: t('ai.advisor'), icon: <PhosphorIcons.Sparkle /> }
    ];

    return (
        <div className="space-y-4">
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="mt-4">
                {activeTab === 'mentor' && <MentorArchiveTab />}
                {activeTab === 'advisor' && <GlobalAdvisorArchiveView />}
            </div>
        </div>
    );
};
export default ArchiveView;