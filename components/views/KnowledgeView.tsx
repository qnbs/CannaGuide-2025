import React, { useState, useMemo } from 'react';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { useKnowledgeProgress } from '../../hooks/useKnowledgeProgress';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { geminiService } from '../../services/geminiService';
import { AIResponse } from '../../types';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { useTranslations } from '../../hooks/useTranslations';

const ChecklistItem: React.FC<{
    text: string;
    isChecked: boolean;
    onToggle: () => void;
}> = ({ text, isChecked, onToggle }) => {
    return (
        <li className="flex items-start gap-3 !my-3">
            <input 
                type="checkbox"
                checked={isChecked}
                onChange={onToggle}
                className="h-5 w-5 rounded border-accent-500 bg-transparent text-primary-500 focus:ring-primary-500 mt-0.5 flex-shrink-0"
            />
            <span className={`transition-colors ${isChecked ? 'line-through text-accent-400' : 'text-accent-200'}`}>
                {text}
            </span>
        </li>
    )
};

const ProTip: React.FC<{ content: string }> = ({ content }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const { t } = useTranslations();

    return (
        <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border-l-4 border-amber-400">
            <h4 className="font-bold text-amber-200">{t('knowledgeView.proTip.title')}</h4>
            {isRevealed ? (
                <p className="text-amber-300">{content}</p>
            ) : (
                <Button variant="secondary" size="sm" onClick={() => setIsRevealed(true)} className="mt-2">{t('knowledgeView.proTip.button')}</Button>
            )}
        </div>
    );
};


const JourneyStep: React.FC<{
    section: any;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ section, isOpen, onToggle }) => {
    const { progress, toggleItem } = useKnowledgeProgress();
    const isSectionChecked = (itemId: string) => progress[section.id]?.includes(itemId) || false;

    return (
        <div className="relative flex items-start group">
            <div className="absolute left-8 top-8 w-px h-full bg-accent-700 journey-step-line"></div>
            <div className={`relative z-10 w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-full bg-accent-900 border-4 border-accent-950 journey-step-icon ${isOpen ? 'is-open border-primary-500/50' : ''}`}>
                 <div className="text-primary-400">{section.icon}</div>
            </div>
            <div className="ml-4 w-full">
                 <div className="p-4 rounded-lg glass-pane">
                     <button type="button" className="flex items-center justify-between w-full font-medium text-left" onClick={onToggle} aria-expanded={isOpen}>
                        <div>
                            <span className="text-lg font-bold text-accent-100">{section.title}</span>
                            <p className="text-sm text-accent-300">{section.subtitle}</p>
                        </div>
                        <PhosphorIcons.ChevronDown className={`w-6 h-6 shrink-0 transition-transform duration-300 text-accent-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                     <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px] pt-4' : 'max-h-0'}`}>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <h4>{section.p1_title}</h4>
                            <p>{section.p1_text}</p>
                            <h4>{section.p2_title}</h4>
                            <p>{section.p2_text}</p>

                            <h4 className="!mt-6">Checkliste</h4>
                            <ul className="checklist">
                                {Object.entries(section.checklist).map(([itemKey, itemText]) => (
                                    <ChecklistItem 
                                        key={itemKey}
                                        text={itemText as string}
                                        isChecked={isSectionChecked(itemKey)}
                                        onToggle={() => toggleItem(section.id, itemKey)}
                                    />
                                ))}
                            </ul>
                            <ProTip content={section.proTip} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AiMentor: React.FC = () => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { t, locale } = useTranslations();

    const handleAsk = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setResponse(null);
        const res = await geminiService.askAboutKnowledge(query, locale);
        setResponse(res);
        setIsLoading(false);
        setQuery('');
    };

    return (
        <Card className="mb-8">
            <h3 className="text-xl font-bold font-display mb-4 text-primary-400 flex items-center gap-2">
                <PhosphorIcons.Sparkle className="w-6 h-6" />
                {t('knowledgeView.aiMentor.title')}
            </h3>
            <p className="text-accent-200 mb-4">
                {t('knowledgeView.aiMentor.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
                <label htmlFor="ai-mentor-input" className="sr-only">{t('knowledgeView.aiMentor.placeholder')}</label>
                <input
                    id="ai-mentor-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                    placeholder={t('knowledgeView.aiMentor.placeholder')}
                    className="w-full bg-accent-900/50 border border-accent-700 rounded-lg px-3 py-2 text-accent-100 placeholder-accent-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
                <Button onClick={handleAsk} disabled={isLoading || !query.trim()} className="shrink-0">
                    {isLoading ? t('knowledgeView.aiMentor.loading') : t('knowledgeView.aiMentor.button')}
                </Button>
            </div>
            <div className="mt-4">
                {isLoading && <SkeletonLoader count={3} />}
                {response && (
                    <div className="bg-accent-900/50 p-4 rounded-lg animate-fade-in">
                        <article className="prose dark:prose-invert max-w-none">
                            <h4 className="!text-primary-300 !mt-0">{response.title}</h4>
                            <div dangerouslySetInnerHTML={{ __html: response.content }} />
                        </article>
                    </div>
                )}
            </div>
        </Card>
    );
};


export const KnowledgeView: React.FC = () => {
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(['phase1']));
    const { progress } = useKnowledgeProgress();
    const { t } = useTranslations();

    const sectionsConfig = useMemo(() => [
        { id: 'phase1', icon: <PhosphorIcons.Cube className="w-8 h-8"/> },
        { id: 'phase2', icon: <PhosphorIcons.Plant className="w-8 h-8"/> },
        { id: 'phase3', icon: <PhosphorIcons.Sun className="w-8 h-8"/> },
        { id: 'phase4', icon: <PhosphorIcons.Sparkle className="w-8 h-8"/> },
        { id: 'phase5', icon: <PhosphorIcons.Scissors className="w-8 h-8"/> },
    ].map(section => ({
        ...section,
        title: t(`knowledgeView.sections.${section.id}.title`),
        subtitle: t(`knowledgeView.sections.${section.id}.subtitle`),
        p1_title: t(`knowledgeView.sections.${section.id}.p1_title`),
        p1_text: t(`knowledgeView.sections.${section.id}.p1_text`),
        p2_title: t(`knowledgeView.sections.${section.id}.p2_title`),
        p2_text: t(`knowledgeView.sections.${section.id}.p2_text`),
        checklist: {
            'c1': t(`knowledgeView.sections.${section.id}.checklist.c1`),
            'c2': t(`knowledgeView.sections.${section.id}.checklist.c2`),
            'c3': t(`knowledgeView.sections.${section.id}.checklist.c3`),
            'c4': t(`knowledgeView.sections.${section.id}.checklist.c4`),
        },
        proTip: t(`knowledgeView.sections.${section.id}.proTip`)
    })), [t]);

    const { totalItems, completedItems } = useMemo(() => {
        const total = sectionsConfig.reduce((acc, section) => acc + Object.keys(section.checklist).filter(key => section.checklist[key as keyof typeof section.checklist]).length, 0);
        const completed = Object.values(progress).reduce((acc, items) => acc + items.length, 0);
        return { totalItems: total, completedItems: completed };
    }, [progress, sectionsConfig]);

    const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

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

    return (
        <div>
            <Card className="mb-8">
                <h3 className="font-bold text-accent-100">{t('knowledgeView.progress')}</h3>
                <div className="flex items-center gap-4 mt-2">
                    <div className="w-full bg-accent-800/70 rounded-full h-4">
                        <div className="bg-primary-500 h-4 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                    </div>
                    <span className="font-bold text-primary-400">{completionPercentage.toFixed(0)}%</span>
                </div>
                <p className="text-xs text-accent-300 mt-1 text-right">{t('knowledgeView.stepsCompleted', { completed: completedItems, total: totalItems })}</p>
            </Card>

            <AiMentor />
            
            <div className="mt-8">
                 {sectionsConfig.map(section => (
                     <JourneyStep
                        key={section.id}
                        section={section}
                        isOpen={openAccordions.has(section.id)}
                        onToggle={() => handleToggle(section.id)}
                    />
                 ))}
            </div>
        </div>
    );
};