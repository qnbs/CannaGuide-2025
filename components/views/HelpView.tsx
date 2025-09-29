import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Tabs } from '@/components/common/Tabs';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { faqData } from '@/data/faq';
import { visualGuidesData } from '@/data/visualGuides';
import { lexiconData } from '@/data/lexicon';
import { LexiconEntry, VisualGuide, FAQItem } from '@/types';
import { VisualGuideCard } from './help/VisualGuideCard';
import { LexiconCard } from './help/LexiconCard';
import { Input } from '@/components/ui/ThemePrimitives';
import { Button } from '@/components/common/Button';

const FAQSection: React.FC = () => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const augmentedFaqData = useMemo(() => faqData.map(item => ({
        ...item,
        question: t(item.questionKey),
        answer: t(item.answerKey),
    })), [t]);

    const filteredFaq = useMemo(() => {
        if (!searchTerm) return augmentedFaqData;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return augmentedFaqData.filter(item =>
            item.question.toLowerCase().includes(lowerCaseSearch) ||
            item.answer.toLowerCase().includes(lowerCaseSearch)
        );
    }, [searchTerm, augmentedFaqData]);

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('helpView.faq.title')}</h3>
            <div className="relative mb-4">
                <Input
                    type="text"
                    placeholder={t('helpView.faq.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
            <div className="space-y-3">
                {filteredFaq.length > 0 ? (
                    filteredFaq.map(item => (
                        <details key={item.id} className="group glass-pane rounded-lg overflow-hidden">
                            <summary className="list-none flex justify-between items-center p-3 cursor-pointer">
                                <h4 className="font-semibold text-slate-100">{item.question}</h4>
                                <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                            </summary>
                            <div className="p-3 border-t border-slate-700/50 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: item.answer }} />
                        </details>
                    ))
                ) : (
                    <p className="text-center py-4 text-slate-500">{t('helpView.faq.noResults', { term: searchTerm })}</p>
                )}
            </div>
        </Card>
    );
};

const VisualGuidesSection: React.FC = () => {
    const { t } = useTranslation();
    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('helpView.tabs.guides')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visualGuidesData.map(guide => (
                    <VisualGuideCard
                        key={guide.id}
                        guideId={guide.id}
                        title={t(guide.titleKey)}
                        description={t(guide.descriptionKey)}
                    />
                ))}
            </div>
        </Card>
    );
};

const LexiconSection: React.FC = () => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<'All' | 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'General'>('All');

    const getCategoryKey = (category: 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'General') => {
        const lower = category.toLowerCase();
        return lower === 'general' ? 'general' : `${lower}s`;
    };

    const augmentedLexicon = useMemo(() => lexiconData.map(item => {
        const categoryKey = getCategoryKey(item.category);
        const term = t(`helpView.lexicon.${categoryKey}.${item.key}.term`);
        const definition = t(`helpView.lexicon.${categoryKey}.${item.key}.definition`);
        return {
            ...item,
            term,
            definition,
        };
    }).sort((a, b) => a.term.localeCompare(b.term)), [t]);

    const filteredLexicon = useMemo(() => {
        let items = augmentedLexicon;

        if (activeCategory !== 'All') {
            items = items.filter(item => item.category === activeCategory);
        }

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            items = items.filter(item =>
                item.term.toLowerCase().includes(lowerCaseSearch) ||
                item.definition.toLowerCase().includes(lowerCaseSearch)
            );
        }

        return items;
    }, [searchTerm, augmentedLexicon, activeCategory]);

    const categories: ('All' | 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'General')[] = ['All', 'Cannabinoid', 'Terpene', 'Flavonoid', 'General'];

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('helpView.lexicon.title')}</h3>
            
            <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                    <Button
                        key={cat}
                        variant={activeCategory === cat ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setActiveCategory(cat)}
                    >
                        {t(`helpView.lexicon.categories.${cat.toLowerCase()}`)}
                    </Button>
                ))}
            </div>

            <div className="relative mb-4">
                <Input
                    type="text"
                    placeholder={t('helpView.lexicon.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLexicon.length > 0 ? (
                    filteredLexicon.map(item => <LexiconCard key={item.key} entry={{ key: item.key, category: item.category }} />)
                ) : (
                     <p className="text-center py-4 text-slate-500 md:col-span-2 lg:col-span-3">{t('helpView.lexicon.noResults', { term: searchTerm })}</p>
                )}
            </div>
        </Card>
    );
};

export const HelpView: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('lexicon');

    const tabs = [
        { id: 'lexicon', label: t('helpView.tabs.lexicon'), icon: <PhosphorIcons.Book /> },
        { id: 'guides', label: t('helpView.tabs.guides'), icon: <PhosphorIcons.BookOpenText /> },
        { id: 'faq', label: t('helpView.tabs.faq'), icon: <PhosphorIcons.Question /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'lexicon': return <LexiconSection />;
            case 'guides': return <VisualGuidesSection />;
            case 'faq': return <FAQSection />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-3xl font-bold font-display text-slate-100">{t('helpView.title')}</h2>
                <p className="text-slate-400 mt-1">{t('helpView.subtitle')}</p>
            </Card>

            <Card>
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            </Card>

            <div className="animate-fade-in">
                {renderContent()}
            </div>
        </div>
    );
};

export default HelpView;