import React, { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { Tabs } from '@/components/common/Tabs';
import { Button } from '@/components/common/Button';

type HelpTab = 'start' | 'faq' | 'cultivation' | 'lexicons' | 'about';

const AccordionItem: React.FC<{
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    highlight?: string;
}> = ({ title, children, isOpen, onToggle, highlight }) => {
    const highlightText = (text: string) => {
        if (!highlight) return text;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase() ? (
                <mark key={i} className="bg-primary-500/50 text-white rounded-sm">{part}</mark>
            ) : (
                part
            )
        );
    };

    return (
        <div className="border-b border-slate-700 last:border-b-0">
            <h3 className="text-base font-semibold">
                <button
                    type="button"
                    className="flex items-center justify-between w-full p-4 font-medium text-left text-slate-100 hover:bg-slate-800/50"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                >
                    <span dangerouslySetInnerHTML={{ __html: title }}></span>
                    <PhosphorIcons.ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </h3>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[5000px]' : 'max-h-0'}`}>
                <div className="px-4 pb-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {typeof children === 'string' ? <p dangerouslySetInnerHTML={{ __html: children }} /> : children}
                    </div>
                </div>
            </div>
        </div>
    );
};


const SectionCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode, id: string }> = ({ icon, title, children, id }) => (
    <Card id={id} className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 text-primary-400">{icon}</div>
            <h2 className="text-2xl font-bold font-display text-primary-400">{title}</h2>
        </div>
        <div className="pl-11">{children}</div>
    </Card>
);

export const HelpView: React.FC = () => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<HelpTab>('start');
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const handleToggle = (id: string) => {
        setOpenAccordions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const tabs: {id: HelpTab, label: string, icon: React.ReactNode}[] = [
        { id: 'start', label: t('helpView.tabs.start'), icon: <PhosphorIcons.RocketLaunch /> },
        { id: 'faq', label: t('helpView.tabs.faq'), icon: <PhosphorIcons.Question /> },
        { id: 'cultivation', label: t('helpView.tabs.cultivation'), icon: <PhosphorIcons.Plant /> },
        { id: 'lexicons', label: t('helpView.tabs.lexicons'), icon: <PhosphorIcons.Book /> },
        { id: 'about', label: t('helpView.tabs.about'), icon: <PhosphorIcons.Info /> },
    ];
    
    const lowerSearchTerm = searchTerm.toLowerCase();

    const getFilteredItems = (items: Record<string, { q?: string, a?: string, title?: string, description?: string, term?: string, def?: string }>) => {
        if (!searchTerm.trim()) return items;
        return Object.fromEntries(
            Object.entries(items).filter(([, value]) => 
                (value.q && value.q.toLowerCase().includes(lowerSearchTerm)) ||
                (value.a && value.a.toLowerCase().includes(lowerSearchTerm)) ||
                (value.title && value.title.toLowerCase().includes(lowerSearchTerm)) ||
                (value.description && value.description.toLowerCase().includes(lowerSearchTerm)) ||
                (value.term && value.term.toLowerCase().includes(lowerSearchTerm)) ||
                (value.def && value.def.toLowerCase().includes(lowerSearchTerm))
            )
        );
    };

    const renderTabContent = () => {
        const sections = t(`helpView.sections`);
        const faqItems = getFilteredItems(sections.faq.items);
        const cultivationSections = sections.agronomyBasics.items;
        const plantCareSections = sections.plantCareABCs.items;
        const glossaryItems = getFilteredItems(sections.glossary.items);
        const cannabinoidItems = getFilteredItems(sections.cannabinoidLexicon.items);
        const terpeneItems = getFilteredItems(sections.terpeneLexicon.items);
        const flavonoidItems = getFilteredItems(sections.flavonoidLexicon.items);
        const gettingStartedSections = getFilteredItems(sections.firstSteps.sections);

        const accordionGroups = {
            start: Object.keys(gettingStartedSections),
            faq: Object.keys(faqItems),
            cultivation: [...Object.keys(cultivationSections), ...Object.keys(plantCareSections)],
            lexicons: [...Object.keys(cannabinoidItems), ...Object.keys(terpeneItems), ...Object.keys(flavonoidItems), ...Object.keys(glossaryItems)],
        };

        const currentAccordionIds = accordionGroups[activeTab as keyof typeof accordionGroups] || [];

        const handleExpandAll = () => setOpenAccordions(new Set(currentAccordionIds));
        const handleCollapseAll = () => setOpenAccordions(new Set());
        
        return (
            <div className="space-y-6">
                 {['start', 'faq', 'cultivation', 'lexicons'].includes(activeTab) && (
                    <div className="flex justify-between items-center">
                        <div className="relative flex-grow">
                             <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder={t('helpView.searchPlaceholder')}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="flex gap-2 ml-4">
                            <Button variant="secondary" size="sm" onClick={handleExpandAll}>{t('helpView.expandAll')}</Button>
                            <Button variant="secondary" size="sm" onClick={handleCollapseAll}>{t('helpView.collapseAll')}</Button>
                        </div>
                    </div>
                 )}

                {activeTab === 'start' && (
                    <Card className="p-0 bg-slate-800">
                        {Object.keys(gettingStartedSections).length > 0 ? Object.entries(gettingStartedSections).map(([key, item]: [string, any]) => (
                            <AccordionItem key={key} title={item.title} isOpen={openAccordions.has(key)} onToggle={() => handleToggle(key)}>
                                {item.list ? (
                                    <ul className="list-disc list-inside space-y-2 mt-4 text-slate-200">
                                        {Object.values(item.list).map((li: any, i) => <li key={i} dangerouslySetInnerHTML={{ __html: li }}/>)}
                                    </ul>
                                ) : <div dangerouslySetInnerHTML={{ __html: item.description }}/>}
                            </AccordionItem>
                        )) : <p className="p-4 text-center text-slate-400">{t('helpView.noResults', { term: searchTerm })}</p>}
                    </Card>
                )}
                
                {activeTab === 'faq' && (
                     <Card className="p-0 bg-slate-800">
                        {Object.keys(faqItems).length > 0 ? Object.entries(faqItems).map(([key, item]) => (
                            <AccordionItem key={key} title={item.q!} isOpen={openAccordions.has(key)} onToggle={() => handleToggle(key)}>
                                <div dangerouslySetInnerHTML={{ __html: item.a! }}/>
                            </AccordionItem>
                        )) : <p className="p-4 text-center text-slate-400">{t('helpView.noResults', { term: searchTerm })}</p>}
                    </Card>
                )}

                {activeTab === 'cultivation' && (
                    <div className="space-y-6">
                        <SectionCard icon={<PhosphorIcons.GraduationCap />} title={t('helpView.sections.agronomyBasics.title')} id="agronomy">
                            <Card className="p-0 bg-slate-800">
                                {Object.entries(cultivationSections).map(([key, item]: [string, any]) => (<AccordionItem key={key} title={item.term} isOpen={openAccordions.has(key)} onToggle={() => handleToggle(key)}><div dangerouslySetInnerHTML={{ __html: item.def }} /></AccordionItem>))}
                            </Card>
                        </SectionCard>
                        <SectionCard icon={<PhosphorIcons.BookOpenText />} title={t('helpView.sections.plantCareABCs.title')} id="plant-care">
                             <Card className="p-0 bg-slate-800">
                                {Object.entries(plantCareSections).map(([key, item]: [string, any]) => (<AccordionItem key={key} title={item.term} isOpen={openAccordions.has(key)} onToggle={() => handleToggle(key)}><div dangerouslySetInnerHTML={{ __html: item.def }} /></AccordionItem>))}
                            </Card>
                        </SectionCard>
                        <SectionCard icon={<PhosphorIcons.Book />} title={t('helpView.sections.furtherReading.title')} id="further-reading">
                            <p className="mb-4 text-sm text-slate-200">{t('helpView.sections.furtherReading.description')}</p>
                            <div className="space-y-3">
                                {t('helpView.sections.furtherReading.resources').map((resource: any, index: number) => (
                                    <div key={index} className="bg-slate-800 p-3 rounded-lg">
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-400 hover:underline">
                                            {resource.title} &rarr;
                                        </a>
                                        <p className="text-xs text-slate-300 mt-1" dangerouslySetInnerHTML={{ __html: resource.description }} />
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </div>
                )}
                
                {activeTab === 'lexicons' && (
                    <div className="space-y-6">
                         <SectionCard icon={<PhosphorIcons.Sparkle />} title={t('helpView.sections.cannabinoidLexicon.title')} id="cannabinoids">
                             <Card className="p-0 bg-slate-800">
                                {Object.keys(cannabinoidItems).length > 0 ? Object.entries(cannabinoidItems).map(([key, item]) => (<AccordionItem key={key} title={item.term!} isOpen={openAccordions.has(key)} onToggle={() => handleToggle(key)}><div dangerouslySetInnerHTML={{ __html: item.def! }} /></AccordionItem>)) : <p className="p-4 text-center text-slate-400">{t('helpView.noResults', { term: searchTerm })}</p>}
                            </Card>
                        </SectionCard>
                         <SectionCard icon={<PhosphorIcons.Leafy />} title={t('helpView.sections.terpeneLexicon.title')} id="terpenes">
                             <Card className="p-0 bg-slate-800">
                                {Object.keys(terpeneItems).length > 0 ? Object.entries(terpeneItems).map(([key, item]) => (<AccordionItem key={key} title={item.term!} isOpen={openAccordions.has(key)} onToggle={() => handleToggle(key)}><div dangerouslySetInnerHTML={{ __html: item.def! }} /></AccordionItem>)) : <p className="p-4 text-center text-slate-400">{t('helpView.noResults', { term: searchTerm })}</p>}
                            </Card>
                        </SectionCard>
                        <SectionCard icon={<PhosphorIcons.Drop />} title={t('helpView.sections.flavonoidLexicon.title')} id="flavonoids">
                             <Card className="p-0 bg-slate-800">
                                {Object.keys(flavonoidItems).length > 0 ? Object.entries(flavonoidItems).map(([key, item]) => (<AccordionItem key={key} title={item.term!} isOpen={openAccordions.has(key)} onToggle={() => handleToggle(key)}><div dangerouslySetInnerHTML={{ __html: item.def! }} /></AccordionItem>)) : <p className="p-4 text-center text-slate-400">{t('helpView.noResults', { term: searchTerm })}</p>}
                            </Card>
                        </SectionCard>
                         <SectionCard icon={<PhosphorIcons.Book />} title={t('helpView.sections.glossary.title')} id="glossary">
                            <Card className="p-0 bg-slate-800">
                                {Object.keys(glossaryItems).length > 0 ? Object.entries(glossaryItems).map(([key, item]) => (<AccordionItem key={key} title={item.term!} isOpen={openAccordions.has(key)} onToggle={() => handleToggle(key)}><div dangerouslySetInnerHTML={{ __html: item.def! }} /></AccordionItem>)) : <p className="p-4 text-center text-slate-400">{t('helpView.noResults', { term: searchTerm })}</p>}
                            </Card>
                        </SectionCard>
                    </div>
                )}
                
                {activeTab === 'about' && (
                     <Card>
                        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                            <div className="flex justify-between items-baseline not-prose">
                                <h2 className="text-2xl font-bold font-display text-primary-300">{t('helpView.sections.about.appName')}</h2>
                                <span className="text-sm text-slate-400">{t('settingsView.about.version')}: {t('helpView.sections.about.version')}</span>
                            </div>
                            <p>{t('helpView.sections.about.description')}</p>
                            <p dangerouslySetInnerHTML={{ __html: t('helpView.sections.about.features') }}></p>
                            <h3>{t('helpView.sections.about.devWithAIStudioTitle')}</h3>
                            <p dangerouslySetInnerHTML={{ __html: `${t('helpView.sections.about.devWithAIStudioText')} <a href="https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:underline">${t('settingsView.about.getTheAppHere')}</a>.` }}></p>
                            <h3>{t('helpView.sections.about.githubTitle')}</h3>
                            <p dangerouslySetInnerHTML={{ __html: t('helpView.sections.about.githubText') }}></p>
                            <div className="not-prose flex flex-wrap gap-4">
                                <a href="https://github.com/qnbs/Cannabis-Grow-Guide-2025" target="_blank" rel="noopener noreferrer" className="no-underline">
                                    <Button variant="secondary" size="sm">{t('helpView.sections.about.githubLinkText')}</Button>
                                </a>
                            </div>
                            <h3>{t('helpView.sections.about.disclaimerTitle')}</h3>
                            <p>{t('helpView.sections.about.disclaimerText')}</p>
                            <h3>{t('helpView.sections.about.privacyTitle')}</h3>
                            <p>{t('helpView.sections.about.privacyText')}</p>
                        </div>
                    </Card>
                )}

            </div>
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => { setActiveTab(id as HelpTab); setSearchTerm(''); }} />
            </Card>
            {renderTabContent()}
        </div>
    );
};
