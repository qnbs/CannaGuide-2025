import React, { useState, useMemo } from 'react';
import { Card } from '../common/Card';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { View } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';

const AccordionItem: React.FC<{
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ title, children, isOpen, onToggle }) => (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
        <h2>
            <button
                type="button"
                className="flex items-center justify-between w-full p-4 font-medium text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                onClick={onToggle}
                aria-expanded={isOpen}
            >
                <span className="font-semibold">{title}</span>
                <PhosphorIcons.ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
        </h2>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px]' : 'max-h-0'}`}>
            <div className="px-4 pb-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

const SectionCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <Card>
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 text-primary-500">{icon}</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
        </div>
        <div className="pl-11">{children}</div>
    </Card>
)

export const HelpView: React.FC = () => {
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const { t } = useTranslations();
    
    const handleToggle = (id: string, group: string) => {
        setOpenAccordion(prev => prev === `${group}-${id}` ? null : `${group}-${id}`);
    };

    const faqItems = useMemo(() => Array.from({ length: 7 }).map((_, i) => ({
        id: `q${i + 1}`,
        q: t(`helpView.sections.faq.items.q${i + 1}.q`),
        a: t(`helpView.sections.faq.items.q${i + 1}.a`),
    })), [t]);

    const cannabinoidItems = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
        id: `c${i + 1}`,
        term: t(`helpView.sections.cannabinoidLexicon.items.c${i + 1}.term`),
        def: t(`helpView.sections.cannabinoidLexicon.items.c${i + 1}.def`),
    })), [t]);
    
    const terpeneItems = useMemo(() => Array.from({ length: 10 }).map((_, i) => ({
        id: `t${i + 1}`,
        term: t(`helpView.sections.terpeneLexicon.items.t${i + 1}.term`),
        def: t(`helpView.sections.terpeneLexicon.items.t${i + 1}.def`),
    })), [t]);

    const flavonoidItems = useMemo(() => Array.from({ length: 5 }).map((_, i) => ({
        id: `f${i + 1}`,
        term: t(`helpView.sections.flavonoidLexicon.items.f${i + 1}.term`),
        def: t(`helpView.sections.flavonoidLexicon.items.f${i + 1}.def`),
    })), [t]);
    
    const agronomyItems = useMemo(() => Array.from({ length: 4 }).map((_, i) => ({
        id: `a${i + 1}`,
        term: t(`helpView.sections.agronomyBasics.items.a${i + 1}.term`),
        def: t(`helpView.sections.agronomyBasics.items.a${i + 1}.def`),
    })), [t]);
    
    const plantCareItems = useMemo(() => Array.from({ length: 4 }).map((_, i) => ({
        id: `pc${i + 1}`,
        term: t(`helpView.sections.plantCareABCs.items.pc${i + 1}.term`),
        def: t(`helpView.sections.plantCareABCs.items.pc${i + 1}.def`),
    })), [t]);

    const glossaryItems = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({
        id: `g${i + 1}`,
        term: t(`helpView.sections.glossary.items.g${i + 1}.term`),
        def: t(`helpView.sections.glossary.items.g${i + 1}.def`),
    })), [t]);
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-primary-600 dark:text-primary-400">{t('helpView.title')}</h1>
            
            <div className="space-y-6">
                <SectionCard icon={<PhosphorIcons.RocketLaunch />} title={t('helpView.sections.firstSteps.title')}>
                    <p className="text-slate-600 dark:text-slate-300">{t('helpView.sections.firstSteps.description')}</p>
                    <ul className="list-disc list-inside space-y-2 mt-4 text-slate-600 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
                       <li dangerouslySetInnerHTML={{ __html: t('helpView.sections.firstSteps.list.strains', { strainsView: View.Strains }) }} />
                       <li dangerouslySetInnerHTML={{ __html: t('helpView.sections.firstSteps.list.plants', { plantsView: View.Plants }) }} />
                       <li dangerouslySetInnerHTML={{ __html: t('helpView.sections.firstSteps.list.knowledge', { knowledgeView: View.Knowledge }) }} />
                       <li dangerouslySetInnerHTML={{ __html: t('helpView.sections.firstSteps.list.equipment', { equipmentView: View.Equipment }) }} />
                       <li dangerouslySetInnerHTML={{ __html: t('helpView.sections.firstSteps.list.settings', { settingsView: View.Settings }) }} />
                    </ul>
                </SectionCard>

                <SectionCard icon={<PhosphorIcons.Question />} title={t('helpView.sections.faq.title')}>
                    <Card className="p-0">
                        {faqItems.map(item => (
                            <AccordionItem key={item.id} title={item.q} isOpen={openAccordion === `faq-${item.id}`} onToggle={() => handleToggle(item.id, 'faq')}>
                                <p dangerouslySetInnerHTML={{ __html: item.a }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>

                <SectionCard icon={<PhosphorIcons.Brain />} title={t('helpView.sections.cannabinoidLexicon.title')}>
                    <Card className="p-0">
                        {cannabinoidItems.map(item => (
                            <AccordionItem key={item.id} title={item.term} isOpen={openAccordion === `cannabinoid-${item.id}`} onToggle={() => handleToggle(item.id, 'cannabinoid')}>
                                <div dangerouslySetInnerHTML={{ __html: item.def }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>

                <SectionCard icon={<PhosphorIcons.Flask />} title={t('helpView.sections.terpeneLexicon.title')}>
                    <Card className="p-0">
                        {terpeneItems.map(item => (
                            <AccordionItem key={item.id} title={item.term} isOpen={openAccordion === `terpene-${item.id}`} onToggle={() => handleToggle(item.id, 'terpene')}>
                                <div dangerouslySetInnerHTML={{ __html: item.def }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>
                
                <SectionCard icon={<PhosphorIcons.Sparkle />} title={t('helpView.sections.flavonoidLexicon.title')}>
                    <Card className="p-0">
                        {flavonoidItems.map(item => (
                            <AccordionItem key={item.id} title={item.term} isOpen={openAccordion === `flavonoid-${item.id}`} onToggle={() => handleToggle(item.id, 'flavonoid')}>
                                <div dangerouslySetInnerHTML={{ __html: item.def }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>

                <SectionCard icon={<PhosphorIcons.GraduationCap />} title={t('helpView.sections.agronomyBasics.title')}>
                    <Card className="p-0">
                        {agronomyItems.map(item => (
                            <AccordionItem key={item.id} title={item.term} isOpen={openAccordion === `agronomy-${item.id}`} onToggle={() => handleToggle(item.id, 'agronomy')}>
                                <div dangerouslySetInnerHTML={{ __html: item.def }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>

                <SectionCard icon={<PhosphorIcons.BookOpenText />} title={t('helpView.sections.plantCareABCs.title')}>
                    <Card className="p-0">
                        {plantCareItems.map(item => (
                            <AccordionItem key={item.id} title={item.term} isOpen={openAccordion === `plantcare-${item.id}`} onToggle={() => handleToggle(item.id, 'plantcare')}>
                                <div dangerouslySetInnerHTML={{ __html: item.def }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>

                <SectionCard icon={<PhosphorIcons.Book />} title={t('helpView.sections.glossary.title')}>
                    <Card className="p-0">
                        {glossaryItems.map(item => (
                            <AccordionItem key={item.id} title={item.term} isOpen={openAccordion === `glossary-${item.id}`} onToggle={() => handleToggle(item.id, 'glossary')}>
                                <p dangerouslySetInnerHTML={{ __html: item.def }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>

                 <SectionCard icon={<PhosphorIcons.Info />} title={t('helpView.sections.about.title')}>
                     <div className="space-y-4 text-slate-600 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold !text-slate-800 dark:!text-slate-200 !m-0">{t('helpView.sections.about.appName')}</h3>
                            <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{t('helpView.sections.about.version')}</span>
                        </div>
                        <p>{t('helpView.sections.about.description')}</p>
                         <p dangerouslySetInnerHTML={{ __html: t('helpView.sections.about.features')}} />
                        <div>
                            <h4 className="font-semibold !text-primary-600 dark:!text-primary-400">{t('helpView.sections.about.disclaimerTitle')}</h4>
                            <p>{t('helpView.sections.about.disclaimerText')}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold !text-primary-600 dark:!text-primary-400">{t('helpView.sections.about.privacyTitle')}</h4>
                            <p>{t('helpView.sections.about.privacyText')}</p>
                        </div>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
};