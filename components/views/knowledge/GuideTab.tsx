import React from 'react';
import { KnowledgeArticle } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { knowledgeBase } from '@/data/knowledgebase';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

const ArticleItem: React.FC<{ article: KnowledgeArticle; t: (key: string) => string }> = ({ article, t }) => {
    const title = t(article.titleKey);
    const content = t(article.contentKey);
    
    return (
        <details className="group glass-pane rounded-lg overflow-hidden">
            <summary className="list-none flex justify-between items-center p-3 cursor-pointer">
                <h4 className="font-semibold text-slate-100">{title}</h4>
                <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="p-3 border-t border-slate-700/50">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-h3:text-primary-400 prose-strong:text-slate-100" dangerouslySetInnerHTML={{ __html: content }} />
                <div className="flex flex-wrap gap-2 mt-4">
                    {article.tags.map(tag => <span key={tag} className="bg-slate-700 text-slate-300 text-xs font-medium px-2 py-0.5 rounded-full">{t(`common.tags.${tag}`, tag)}</span>)}
                </div>
            </div>
        </details>
    );
};

export const GuideTab: React.FC = () => {
    const { t } = useTranslations();
    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('knowledgeView.hub.browseAll')}</h3>
            <div className="space-y-3">
                {knowledgeBase.map(article => <ArticleItem key={article.id} article={article} t={t} />)}
            </div>
        </Card>
    );
};
