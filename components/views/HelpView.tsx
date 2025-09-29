import React, { useState, useMemo, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { lexiconData } from '@/data/lexicon';
import { visualGuidesData } from '@/data/visualGuides';
import { faqData } from '@/data/faq';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Input } from '@/components/ui/ThemePrimitives';
import { LexiconCard } from './help/LexiconCard';
import { VisualGuideCard } from './help/VisualGuideCard';
import { Tabs } from '@/components/common/Tabs';
import { useActivePlants } from '@/hooks/useSimulationBridge';
import { LexiconEntry, FAQItem } from '@/types';
import { SkeletonLoader } from '../common/SkeletonLoader';

type MainTab = 'lexicon' | 'guides' | 'faq';
type LexiconCategory = 'All' | 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'General';

const FAQItemDisplay: React.FC<{ item: FAQItem }> = ({ item }) => {
  const { t } = useTranslation();
  return (
    <details className="p-3 bg-slate-800/50 rounded-lg group">
      <summary className="font-semibold text-slate-100 cursor-pointer list-none flex justify-between items-center">
        {t(item.questionKey)}
        <PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="mt-2 pt-2 border-t border-slate-700/50 text-slate-300 text-sm prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: t(item.answerKey) }} />
    </details>
  );
};

export const HelpView: React.FC = () => {
    const { t } = useTranslation();
    const [mainTab, setMainTab] = useState<MainTab>('lexicon');
    const [lexiconCategory, setLexiconCategory] = useState<LexiconCategory>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isPending, startTransition] = useTransition();
    const activePlants = useActivePlants();

    const mainTabs = [
        { id: 'lexicon', label: t('helpView.tabs.lexicon'), icon: <PhosphorIcons.BookOpenText /> },
        { id: 'guides', label: t('helpView.tabs.guides'), icon: <PhosphorIcons.PaintBrush /> },
        { id: 'faq', label: t('helpView.tabs.faq'), icon: <PhosphorIcons.Question /> },
    ];
    
    const lexiconTabs = [
        { id: 'All', label: t('helpView.lexiconTabs.all') },
        { id: 'Cannabinoid', label: t('helpView.lexiconTabs.cannabinoids') },
        { id: 'Terpene', label: t('helpView.lexiconTabs.terpenes') },
        { id: 'Flavonoid', label: t('helpView.lexiconTabs.flavonoids') },
        { id: 'General', label: t('helpView.lexiconTabs.glossary') },
    ];
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        startTransition(() => {
            setSearchTerm(e.target.value);
        });
    };

    const handleCategoryChange = (id: string) => {
        startTransition(() => {
            setLexiconCategory(id as LexiconCategory);
        });
    };

    const filteredLexicon = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        return lexiconData.filter((entry: LexiconEntry) => {
            const matchesCategory = lexiconCategory === 'All' || entry.category === lexiconCategory;
            const matchesSearch =
                entry.term.toLowerCase().includes(lowerCaseSearch) ||
                entry.definition.toLowerCase().includes(lowerCaseSearch);
            return matchesCategory && matchesSearch;
        });
    }, [searchTerm, lexiconCategory]);
    
    const sortedFaq = useMemo(() => {
        const activeStages = new Set(activePlants.map(p => p.stage));
        if (activeStages.size === 0) return faqData;

        return [...faqData].sort((a, b) => {
            const aTriggers = Array.isArray(a.triggers.plantStage) ? a.triggers.plantStage : [a.triggers.plantStage];
            const bTriggers = Array.isArray(b.triggers.plantStage) ? b.triggers.plantStage : [b.triggers.plantStage];

            const aIsRelevant = aTriggers.some(stage => stage && activeStages.has(stage));
            const bIsRelevant = bTriggers.some(stage => stage && activeStages.has(stage));

            if (aIsRelevant && !bIsRelevant) return -1;
            if (!aIsRelevant && bIsRelevant) return 1;
            return 0;
        });
    }, [activePlants]);

    const renderContent = () => {
        switch(mainTab) {
            case 'lexicon':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <Card>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-grow">
                                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    <Input type="text" placeholder={t('helpView.searchPlaceholder')} defaultValue={searchTerm} onChange={handleSearchChange} className="pl-10" />
                                </div>
                            </div>
                             <div className="mt-4">
                                <Tabs tabs={lexiconTabs} activeTab={lexiconCategory} setActiveTab={handleCategoryChange} />
                            </div>
                        </Card>

                        {isPending ? (
                            <SkeletonLoader variant="grid" count={6} containerClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredLexicon.map(entry => <LexiconCard key={entry.term} entry={entry} />)}
                            </div>
                        )}
                        
                        {!isPending && filteredLexicon.length === 0 && (
                            <Card className="col-span-full text-center py-10 text-slate-500">
                                <p>{t('helpView.noResults', { term: searchTerm })}</p>
                            </Card>
                        )}
                    </div>
                );
            case 'guides':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                        {visualGuidesData.map(guide => (
                            <VisualGuideCard key={guide.id} guideId={guide.id} title={t(guide.titleKey)} description={t(guide.descriptionKey)} />
                        ))}
                    </div>
                );
            case 'faq':
                return (
                    <Card className="animate-fade-in">
                         <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('helpView.faq.title')}</h3>
                         {activePlants.length > 0 && <p className="text-sm text-amber-300 mb-4 font-semibold">{t('helpView.faq.relevance')}</p>}
                         <div className="space-y-2">
                            {sortedFaq.map(item => <FAQItemDisplay key={item.id} item={item} />)}
                         </div>
                    </Card>
                );
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold font-display text-slate-100">{t('helpView.title')}</h2>
                <p className="text-slate-400 mt-1">{t('helpView.subtitle')}</p>
            </div>
            <Card>
                <Tabs tabs={mainTabs} activeTab={mainTab} setActiveTab={(id) => setMainTab(id as MainTab)} />
            </Card>
            
            {renderContent()}
        </div>
    );
};