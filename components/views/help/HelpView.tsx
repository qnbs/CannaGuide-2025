import React, { useState, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { faqData } from '@/data/faq';
import { visualGuidesData } from '@/data/visualGuides';
import { lexiconData } from '@/data/lexicon';
import { LexiconEntry, VisualGuide, FAQItem } from '@/types';
import { VisualGuideCard } from './help/VisualGuideCard';
import { LexiconCard } from './help/LexiconCard';
import { Button } from '@/components/common/Button';
import { Speakable } from '@/components/common/Speakable';
import { SearchBar } from '@/components/common/SearchBar';
import { HelpSubNav } from './help/HelpSubNav';

const FAQSection: React.FC = memo(() => {
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
            <div className="mb-4">
                <SearchBar
                    placeholder={t('helpView.faq.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClear={() => setSearchTerm('')}
                />
            </div>
            <div className="space-y-3">
                {filteredFaq.length > 0 ? (
                    filteredFaq.map(item => (
                        <details key={item.id} className="group bg-slate-800 rounded-lg overflow-hidden ring-1 ring-inset ring-white/20">
                            <summary className="list-none flex justify-between items-center p-4 cursor-pointer">
                                <span className="text-lg font-bold text-slate-100">{item.question}</span>
                                <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                            </summary>
                            <Speakable elementId={`faq-${item.id}`}>
                                <div className="p-4 border-t border-slate-700/50 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: item.answer }} />
                            </Speakable>
                        </details>
                    ))
                ) : (
                    <p className="text-center py-4 text-slate-500">{t('helpView.faq.noResults', { term: searchTerm })}</p>
                )}
            </div>
        </Card>
    );
});

const VisualGuidesSection: React.FC = memo(() => {
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
});

const LexiconSection: React.FC = memo(() => {
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

            <div className="mb-4">
                <SearchBar
                    placeholder={t('helpView.lexicon.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClear={() => setSearchTerm('')}
                />
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
});

const ManualSection: React.FC = memo(() => {
    const { t } = useTranslation();
    const manualContent = t('helpView.manual', { returnObjects: true }) as Record<string, any>;

    const renderSection = (sectionKey: string, sectionData: any, isSubSection = false, level = 0) => {
        const title = sectionData.title;
        const content = sectionData.content;
        const subSections = Object.keys(sectionData).filter(key => key !== 'title' && key !== 'content');

        const icons: Record<string, React.ReactNode> = {
            introduction: <PhosphorIcons.Info className="w-6 h-6"/>,
            strains: <PhosphorIcons.Leafy className="w-6 h-6"/>,
            plants: <PhosphorIcons.Plant className="w-6 h-6"/>,
            equipment: <PhosphorIcons.Wrench className="w-6 h-6"/>,
            // FIX: Updated icon for consistency.
            knowledge: <PhosphorIcons.BookBookmark className="w-6 h-6"/>,
            general: <PhosphorIcons.Cube className="w-6 h-6"/>,
        };

        if (isSubSection) {
            // Render subsections as simpler, nested details
             return (
                 <details key={sectionKey} open={false} className="group bg-slate-900 rounded-lg ring-1 ring-inset ring-white/20">
                    <summary className="list-none flex items-center gap-2 cursor-pointer p-3 text-md font-semibold text-primary-300">
                        <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180 flex-shrink-0" />
                        {title}
                    </summary>
                    <Speakable elementId={`manual-sub-${sectionKey}`}>
                        <div className="p-3 border-t border-slate-700/50">
                            {content && <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />}
                        </div>
                    </Speakable>
                </details>
            );
        }

        // Render top-level sections styled like SettingsSection
        return (
            <details key={sectionKey} open={level < 1} className="group bg-slate-800 rounded-lg overflow-hidden ring-1 ring-inset ring-white/20">
                <summary className="list-none flex justify-between items-center p-4 cursor-pointer font-bold text-slate-100">
                    <div className="flex items-center gap-3">
                        {icons[sectionKey]}
                        <span className="text-lg">{title}</span>
                    </div>
                    <PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-2 border-t border-slate-700/50">
                    {content && <Speakable elementId={`manual-main-${sectionKey}`}><div className="prose prose-sm dark:prose-invert max-w-none my-4" dangerouslySetInnerHTML={{ __html: content }} /></Speakable>}
                    {subSections.length > 0 && (
                        <div className="space-y-2 py-2">
                            {subSections.map(key => renderSection(key, sectionData[key], true, level + 1))}
                        </div>
                    )}
                </div>
            </details>
        );
    };
    
    const sectionOrder = ['introduction', 'general', 'strains', 'plants', 'equipment', 'knowledge'];

    return (
        <div className="space-y-4">
            {sectionOrder
                .filter(key => manualContent[key])
                .map(key => renderSection(key, manualContent[key]))}
        </div>
    );
});


export const HelpView: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('manual');

     const viewIcons = useMemo(() => ({
        // FIX: Updated icon for consistency.
        manual: <PhosphorIcons.BookBookmark className="w-16 h-16 mx-auto text-blue-400" />,
        lexicon: <PhosphorIcons.Book className="w-16 h-16 mx-auto text-indigo-400" />,
        guides: <PhosphorIcons.GraduationCap className="w-16 h-16 mx-auto text-green-400" />,
        faq: <PhosphorIcons.Question weight="fill" className="w-16 h-16 mx-auto text-yellow-400" />,
    }), []);

    const viewTitles = useMemo(() => ({
        manual: t('helpView.tabs.manual'),
        lexicon: t('helpView.tabs.lexicon'),
        guides: t('helpView.tabs.guides'),
        faq: t('helpView.tabs.faq'),
    }), [t]);

    const renderContent = () => {
        switch (activeTab) {
            case 'manual': return <ManualSection />;
            case 'lexicon': return <LexiconSection />;
            case 'guides': return <VisualGuidesSection />;
            case 'faq': return <FAQSection />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6 animate-fade-in">
                {viewIcons[activeTab as keyof typeof viewIcons]}
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">{viewTitles[activeTab as keyof typeof viewTitles] || t('helpView.title')}</h2>
            </div>

            <HelpSubNav activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="animate-fade-in">
                {renderContent()}
            </div>
        </div>
    );
};

export default HelpView;
