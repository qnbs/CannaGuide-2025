import React, { useState } from 'react';
import { Card } from '../common/Card';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { useTranslations } from '../../hooks/useTranslations';
import { Tabs } from '../common/Tabs';

type HelpTab = 'start' | 'faq' | 'cultivation';

const AccordionItem: React.FC<{
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ title, children, isOpen, onToggle }) => (
    <div className="border-b border-slate-700 last:border-b-0">
        <h3 className="text-base font-semibold">
            <button
                type="button"
                className="flex items-center justify-between w-full p-4 font-medium text-left text-slate-200 hover:bg-slate-800/50"
                onClick={onToggle}
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <PhosphorIcons.ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
        </h3>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px]' : 'max-h-0'}`}>
            <div className="px-4 pb-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

const SectionCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode, id: string }> = ({ icon, title, children, id }) => (
    <Card id={id} className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 text-primary-400">{icon}</div>
            <h2 className="text-2xl font-bold font-display text-slate-100">{title}</h2>
        </div>
        <div className="pl-11">{children}</div>
    </Card>
);

const StartTab: React.FC = () => {
    const { t } = useTranslations();
    return (
        <div className="space-y-6">
            <SectionCard icon={<PhosphorIcons.RocketLaunch />} title={t('helpView.sections.firstSteps.title')} id="first-steps">
                <p className="text-slate-200">{t('helpView.sections.firstSteps.description')}</p>
                <ul className="list-disc list-inside space-y-2 mt-4 text-slate-200 prose prose-sm dark:prose-invert max-w-none">
                   <li dangerouslySetInnerHTML={{ __html: t('helpView.sections.firstSteps.list.strains', { strainsView: `<strong>${t('nav.strains')}</strong>` }) }} />
                   <li dangerouslySetInnerHTML={{ __html: t('helpView.sections.firstSteps.list.plants', { plantsView: `<strong>${t('nav.plants')}</strong>` }) }} />
                   <li dangerouslySetInnerHTML={{ __html: t('helpView.sections.firstSteps.list.knowledge', { knowledgeView: `<strong>${t('nav.knowledge')}</strong>` }) }} />
                   <li dangerouslySetInnerHTML={{ __html: t('helpView.sections.firstSteps.list.equipment', { equipmentView: `<strong>${t('nav.equipment')}</strong>` }) }} />
                   <li dangerouslySetInnerHTML={{ __html: t('helpView.sections.firstSteps.list.settings', { settingsView: `<strong>${t('nav.settings')}</strong>` }) }} />
                   <li dangerouslySetInnerHTML={{ __html: t('helpView.sections.firstSteps.list.commandPalette') }} />
                </ul>
            </SectionCard>
            <SectionCard icon={<PhosphorIcons.Info />} title={t('helpView.sections.about.title')} id="about">
                 <div className="space-y-4 text-slate-200 prose prose-sm dark:prose-invert max-w-none">
                    <div>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold !text-slate-100 !m-0">{t('helpView.sections.about.appName')}</h3>
                            <span className="text-sm font-mono bg-slate-800 px-2 py-1 rounded">{t('helpView.sections.about.version')}</span>
                        </div>
                        <p>{t('helpView.sections.about.description')}</p>
                        <p dangerouslySetInnerHTML={{ __html: t('helpView.sections.about.features')}} />
                    </div>
                    <div className="pt-4 border-t border-slate-700">
                        <h4 className="font-semibold !text-primary-400">{t('helpView.sections.about.devWithAIStudioTitle')}</h4>
                        <p dangerouslySetInnerHTML={{ __html: t('helpView.sections.about.devWithAIStudioText')}} />
                         <a href="https://ai.studio/apps/drive/1xTLNTrer4qHP5EmMXjZmbxGuKVWDvnPQ" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-primary-400 hover:underline">
                            {t('helpView.sections.about.getTheAppHere')} &rarr;
                        </a>
                    </div>
                     <div className="pt-4 border-t border-slate-700">
                        <h4 className="font-semibold !text-primary-400">{t('helpView.sections.about.githubTitle')}</h4>
                        <p dangerouslySetInnerHTML={{ __html: t('helpView.sections.about.githubText')}} />
                         <a href="https://github.com/qnbs/Cannabis-Grow-Guide-2025" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-primary-400 hover:underline">
                            {t('helpView.sections.about.githubLinkText')} &rarr;
                        </a>
                    </div>
                    <div className="pt-4 border-t border-slate-700">
                        <h4 className="font-semibold !text-primary-400">{t('helpView.sections.about.disclaimerTitle')}</h4>
                        <p>{t('helpView.sections.about.disclaimerText')}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-700">
                        <h4 className="font-semibold !text-primary-400">{t('helpView.sections.about.privacyTitle')}</h4>
                        <p>{t('helpView.sections.about.privacyText')}</p>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

const FaqTab: React.FC<{ onToggle: (id: string, group: string) => void, openAccordions: Set<string> }> = ({ onToggle, openAccordions }) => {
    const { t } = useTranslations();
    const faqItems = Array.from({ length: 12 }).map((_, i) => ({ id: `q${i + 1}`, q: t(`helpView.sections.faq.items.q${i + 1}.q`), a: t(`helpView.sections.faq.items.q${i + 1}.a`) }));
    
    return (
        <SectionCard icon={<PhosphorIcons.Question />} title={t('helpView.sections.faq.title')} id="faq">
            <Card className="p-0 bg-slate-800">
                {faqItems.map(item => (
                    <AccordionItem key={item.id} title={item.q} isOpen={openAccordions.has(`faq-${item.id}`)} onToggle={() => onToggle(item.id, 'faq')}>
                        <p dangerouslySetInnerHTML={{ __html: item.a }} />
                    </AccordionItem>
                ))}
            </Card>
        </SectionCard>
    );
};

const CultivationTab: React.FC<{ onToggle: (id: string, group: string) => void, openAccordions: Set<string> }> = ({ onToggle, openAccordions }) => {
    const { t } = useTranslations();
    const agronomyItems = Array.from({ length: 4 }).map((_, i) => ({ id: `a${i + 1}`, term: t(`helpView.sections.agronomyBasics.items.a${i + 1}.term`), def: t(`helpView.sections.agronomyBasics.items.a${i + 1}.def`) }));
    const plantCareItems = Array.from({ length: 4 }).map((_, i) => ({ id: `pc${i + 1}`, term: t(`helpView.sections.plantCareABCs.items.pc${i + 1}.term`), def: t(`helpView.sections.plantCareABCs.items.pc${i + 1}.def`) }));
    const glossaryItems = Array.from({ length: 9 }).map((_, i) => ({ id: `g${i + 1}`, term: t(`helpView.sections.glossary.items.g${i + 1}.term`), def: t(`helpView.sections.glossary.items.g${i + 1}.def`) }));
    const cannabinoidItems = Array.from({ length: 8 }).map((_, i) => ({ id: `c${i + 1}`, term: t(`helpView.sections.cannabinoidLexicon.items.c${i + 1}.term`), def: t(`helpView.sections.cannabinoidLexicon.items.c${i + 1}.def`) }));
    const terpeneItems = Array.from({ length: 10 }).map((_, i) => ({ id: `t${i + 1}`, term: t(`helpView.sections.terpeneLexicon.items.t${i + 1}.term`), def: t(`helpView.sections.terpeneLexicon.items.t${i + 1}.def`) }));
    const flavonoidItems = Array.from({ length: 5 }).map((_, i) => ({ id: `f${i + 1}`, term: t(`helpView.sections.flavonoidLexicon.items.f${i + 1}.term`), def: t(`helpView.sections.flavonoidLexicon.items.f${i + 1}.def`) }));
    const resources = t('helpView.sections.furtherReading.resources');

    return (
        <div className="space-y-6">
            <SectionCard icon={<PhosphorIcons.GraduationCap />} title={t('helpView.sections.agronomyBasics.title')} id="agronomy">
                <Card className="p-0 bg-slate-800">
                    {agronomyItems.map(item => (<AccordionItem key={item.id} title={item.term} isOpen={openAccordions.has(`agronomy-${item.id}`)} onToggle={() => onToggle(item.id, 'agronomy')}><div dangerouslySetInnerHTML={{ __html: item.def }} /></AccordionItem>))}
                </Card>
            </SectionCard>
            <SectionCard icon={<PhosphorIcons.BookOpenText />} title={t('helpView.sections.plantCareABCs.title')} id="plant-care">
                <Card className="p-0 bg-slate-800">
                    {plantCareItems.map(item => (<AccordionItem key={item.id} title={item.term} isOpen={openAccordions.has(`plantcare-${item.id}`)} onToggle={() => onToggle(item.id, 'plantcare')}><div dangerouslySetInnerHTML={{ __html: item.def }} /></AccordionItem>))}
                </Card>
            </SectionCard>
            <SectionCard icon={<PhosphorIcons.Book />} title={t('helpView.sections.glossary.title')} id="glossary">
                <Card className="p-0 bg-slate-800">
                    {glossaryItems.map(item => (
                        <AccordionItem key={item.id} title={item.term} isOpen={openAccordions.has(`glossary-${item.id}`)} onToggle={() => onToggle(item.id, 'glossary')}>
                            <div dangerouslySetInnerHTML={{ __html: item.def }} />
                        </AccordionItem>
                    ))}
                </Card>
            </SectionCard>
             <SectionCard icon={<PhosphorIcons.Sparkle />} title={t('helpView.sections.cannabinoidLexicon.title')} id="cannabinoids">
                <Card className="p-0 bg-slate-800">
                    {cannabinoidItems.map(item => (
                        <AccordionItem key={item.id} title={item.term} isOpen={openAccordions.has(`cannabinoid-${item.id}`)} onToggle={() => onToggle(item.id, 'cannabinoid')}>
                            <div dangerouslySetInnerHTML={{ __html: item.def }} />
                        </AccordionItem>
                    ))}
                </Card>
            </SectionCard>
             <SectionCard icon={<PhosphorIcons.Leafy />} title={t('helpView.sections.terpeneLexicon.title')} id="terpenes">
                <Card className="p-0 bg-slate-800">
                    {terpeneItems.map(item => (
                        <AccordionItem key={item.id} title={item.term} isOpen={openAccordions.has(`terpene-${item.id}`)} onToggle={() => onToggle(item.id, 'terpene')}>
                            <div dangerouslySetInnerHTML={{ __html: item.def }} />
                        </AccordionItem>
                    ))}
                </Card>
            </SectionCard>
            <SectionCard icon={<PhosphorIcons.Drop />} title={t('helpView.sections.flavonoidLexicon.title')} id="flavonoids">
                <Card className="p-0 bg-slate-800">
                    {flavonoidItems.map(item => (
                        <AccordionItem key={item.id} title={item.term} isOpen={openAccordions.has(`flavonoid-${item.id}`)} onToggle={() => onToggle(item.id, 'flavonoid')}>
                            <div dangerouslySetInnerHTML={{ __html: item.def }} />
                        </AccordionItem>
                    ))}
                </Card>
            </SectionCard>
             <SectionCard icon={<PhosphorIcons.Book />} title={t('helpView.sections.furtherReading.title')} id="further-reading">
                <p className="mb-4 text-sm text-slate-200">{t('helpView.sections.furtherReading.description')}</p>
                <div className="space-y-3">
                    {Array.isArray(resources) && resources.map((resource, index) => (
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
    );
};


export const HelpView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<HelpTab>('start');
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
    const { t } = useTranslations();
    
    const handleToggle = (id: string, group: string) => {
        const fullId = `${group}-${id}`;
        setOpenAccordions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fullId)) {
                newSet.delete(fullId);
            } else {
                newSet.add(fullId);
            }
            return newSet;
        });
    };

    const tabs: {id: HelpTab, label: string, icon: React.ReactNode}[] = [
        { id: 'start', label: t('nav.help'), icon: <PhosphorIcons.RocketLaunch /> },
        { id: 'faq', label: t('helpView.sections.faq.title'), icon: <PhosphorIcons.Question /> },
        { id: 'cultivation', label: t('helpView.tabs.cultivation'), icon: <PhosphorIcons.Plant /> },
    ];
    
    const renderTabContent = () => {
        switch(activeTab) {
            case 'start': return <StartTab />;
            case 'faq': return <FaqTab openAccordions={openAccordions} onToggle={handleToggle} />;
            case 'cultivation': return <CultivationTab openAccordions={openAccordions} onToggle={handleToggle} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                 <Tabs 
                    tabs={tabs} 
                    activeTab={activeTab} 
                    setActiveTab={(id) => setActiveTab(id as HelpTab)} 
                 />
            </Card>
            {renderTabContent()}
        </div>
    );
};