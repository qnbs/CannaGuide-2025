import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { selectKnowledgeProgress } from '@/stores/selectors';

const KnowledgeStep: React.FC<{
    phase: string;
    title: string;
    subtitle: string;
    p1_title: string;
    p1_text: string;
    p2_title: string;
    p2_text: string;
    checklist: Record<string, string>;
    proTip: string;
    progress: string[];
    onToggle: (itemId: string) => void;
}> = ({ phase, title, subtitle, p1_title, p1_text, p2_title, p2_text, checklist, proTip, progress, onToggle }) => {
    const { t } = useTranslations();
    const [isTipVisible, setIsTipVisible] = useState(false);
    return (
        <div className="relative pl-8">
            <div className="absolute -left-1.5 top-3 w-6 h-6 rounded-full bg-slate-700 border-4 border-slate-900 flex items-center justify-center">
                 <div className="w-2 h-2 rounded-full bg-primary-500"></div>
            </div>
            <Card className="ml-4">
                <h2 className="text-2xl font-bold font-display text-primary-400 flex items-center gap-2">
                    {title}
                </h2>
                <p className="text-slate-400 mb-4">{subtitle}</p>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-slate-100">{p1_title}</h3>
                        <p className="text-sm text-slate-300">{p1_text}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-100">{p2_title}</h3>
                        <p className="text-sm text-slate-300">{p2_text}</p>
                    </div>
                    <div className="space-y-2">
                        {Object.entries(checklist).map(([key, text]) => (
                            <label key={key} className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-slate-800/50">
                                <input type="checkbox" checked={progress.includes(key)} onChange={() => onToggle(key)} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500"/>
                                <span className={`text-sm ${progress.includes(key) ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{text}</span>
                            </label>
                        ))}
                    </div>
                    <Card className="bg-primary-900/30">
                        <button onClick={() => setIsTipVisible(!isTipVisible)} className="font-bold text-primary-300 flex items-center gap-2">
                            <PhosphorIcons.LightbulbFilament className="w-5 h-5"/> {t('knowledgeView.proTip.title')}
                        </button>
                        {isTipVisible && <p className="text-sm text-primary-300/90 mt-2 animate-fade-in">{proTip}</p>}
                    </Card>
                </div>
            </Card>
        </div>
    );
}

export const GuideTab: React.FC = () => {
    const { t } = useTranslations();
    const progress = useAppStore(selectKnowledgeProgress);
    const toggleItem = useAppStore(state => state.toggleKnowledgeProgressItem);

    const phases = Array.from({ length: 5 }, (_, i) => `phase${i + 1}`);
    const checklistItems = phases.flatMap(p => Object.keys(t(`knowledgeView.sections.${p}.checklist`)));
    const completedItems = phases.reduce((acc, p) => acc + (progress[p]?.length || 0), 0);
    const progressPercent = checklistItems.length > 0 ? (completedItems / checklistItems.length) * 100 : 0;

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="font-semibold">{t('knowledgeView.progress')}</h3>
                <div className="relative h-3 w-full bg-slate-700 rounded-full my-2 overflow-hidden">
                    <div className="absolute h-full bg-primary-500 rounded-full transition-all duration-500" style={{width: `${progressPercent}%`, boxShadow: '0 0 10px rgb(var(--color-primary-500), 0.7)'}}></div>
                </div>
                <p className="text-sm text-slate-400">{t('knowledgeView.stepsCompleted', { completed: completedItems, total: checklistItems.length })}</p>
            </Card>
            
            <div className="relative">
                <div className="absolute left-4 top-0 h-full w-0.5 bg-slate-700/50"></div>
                <div className="space-y-6">
                    {phases.map(p => (
                        <KnowledgeStep
                            key={p}
                            phase={p}
                            title={t(`knowledgeView.sections.${p}.title`)}
                            subtitle={t(`knowledgeView.sections.${p}.subtitle`)}
                            p1_title={t(`knowledgeView.sections.${p}.p1_title`)}
                            p1_text={t(`knowledgeView.sections.${p}.p1_text`)}
                            p2_title={t(`knowledgeView.sections.${p}.p2_title`)}
                            p2_text={t(`knowledgeView.sections.${p}.p2_text`)}
                            checklist={t(`knowledgeView.sections.${p}.checklist`)}
                            proTip={t(`knowledgeView.sections.${p}.proTip`)}
                            progress={progress[p] || []}
                            onToggle={(itemId) => toggleItem(p, itemId)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
