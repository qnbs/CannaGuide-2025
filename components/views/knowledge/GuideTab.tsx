
import React from 'react';
import { KnowledgeArticle } from '@/types';
import { useTranslation } from 'react-i18next';
import { knowledgeBase } from '@/data/knowledgebase';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

// FIX: Updated type of t to allow for fallback values
const ArticleItem: React.FC<{ article: KnowledgeArticle; t: (key: string, options?: any) => string }> = ({ article, t }) => {
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
                    {article.tags.map(tag => <span key={tag} className="bg-slate-700 text-slate-300 text-xs font-medium px-2 py-0.5 rounded-full">{t(`common.aromas.${tag}`, { defaultValue: tag })}</span>)}
                </div>
            </div>
        </details>
    );
};

interface GuideTabProps {
    articles?: KnowledgeArticle[];
}

// FIX: Added GuideTab component and exported it to fix the import error.
export const GuideTab: React.FC<GuideTabProps> = ({ articles }) => {
    const { t } = useTranslation();
    // Fallback to all articles if none are provided (for the general guide view)
    const articlesToDisplay = articles || knowledgeBase;

    return (
         <div className="space-y-3">
            {articlesToDisplay.map(article => (
                <ArticleItem key={article.id} article={article} t={t as (key: string, options?: any) => string} />
            ))}
        </div>
    );
};
