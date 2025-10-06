import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { knowledgeBase } from '@/data/knowledgebase';
import { KnowledgeArticle } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

export const GuideView: React.FC = () => {
    const { t } = useTranslation();

    const groupedArticles = useMemo(() => {
        const groups: Record<string, { order: number, articles: KnowledgeArticle[] }> = {
            'Phase 1': { order: 1, articles: [] },
            'Phase 2': { order: 2, articles: [] },
            'Phase 3': { order: 3, articles: [] },
            'Phase 4': { order: 4, articles: [] },
            'Phase 5': { order: 5, articles: [] },
            'Troubleshooting': { order: 6, articles: [] },
        };
        const generalGroup: KnowledgeArticle[] = [];

        knowledgeBase.forEach(article => {
            const match = article.id.match(/phase(\d+)|fix/);
            let groupKey: string | null = null;
            if (match) {
                if (match[1]) groupKey = `Phase ${match[1]}`;
                if (match[0] === 'fix') groupKey = 'Troubleshooting';
            }
            
            if (groupKey && groups[groupKey]) {
                groups[groupKey].articles.push(article);
            } else {
                generalGroup.push(article);
            }
        });

        const sortedGroups = Object.entries(groups).sort((a, b) => a[1].order - b[1].order);
        if (generalGroup.length > 0) {
            sortedGroups.push(['General', { order: 99, articles: generalGroup }]);
        }

        return sortedGroups;
    }, []);

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2">
                <PhosphorIcons.Book className="w-6 h-6"/> {t('knowledgeView.tabs.guide')}
            </h3>
            {groupedArticles.map(([groupName, groupData]) => (
                <details key={groupName} open className="group">
                    <summary className="text-lg font-semibold text-primary-300 cursor-pointer list-none flex items-center gap-2 mb-2">
                         <PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" />
                        {groupName}
                    </summary>
                    <div className="space-y-3 pl-7">
                        {groupData.articles.map(article => (
                             <details key={article.id} className="group glass-pane rounded-lg overflow-hidden ring-1 ring-inset ring-white/20">
                                <summary className="list-none flex justify-between items-center p-3 cursor-pointer">
                                    <h4 className="font-semibold text-slate-100">{t(article.titleKey)}</h4>
                                    <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                                </summary>
                                <div className="p-3 border-t border-slate-700/50">
                                    <div className="prose prose-sm dark:prose-invert max-w-none prose-h3:text-primary-400 prose-strong:text-slate-100" dangerouslySetInnerHTML={{ __html: t(article.contentKey) }} />
                                </div>
                            </details>
                        ))}
                    </div>
                </details>
            ))}
        </div>
    );
};
export default GuideView;