import React, { useState, useEffect, useId } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useKnowledgeProgress } from '@/hooks/useKnowledgeProgress';
import { useKnowledgeArchive } from '@/hooks/useKnowledgeArchive';
import { geminiService } from '@/services/geminiService';
import { AIResponse, ArchivedMentorResponse } from '@/types';
import { EditResponseModal } from '@/components/common/EditResponseModal';
import { Tabs } from '@/components/common/Tabs';
import { useNotifications } from '@/context/NotificationContext';

type KnowledgeViewTab = 'guide' | 'archive';

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
        <Card>
            <h2 className="text-2xl font-bold font-display text-primary-400 flex items-center gap-2">
                <PhosphorIcons.BookOpenText className="w-7 h-7"/>
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
                        <label key={key} className="flex items-center gap-3 cursor-pointer">
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
    );
}

export const KnowledgeView: React.FC = () => {
    const { t } = useTranslations();
    const { addNotification } = useNotifications();
    const { progress, toggleItem } = useKnowledgeProgress();
    const { responses: archivedResponses, addResponse, updateResponse, deleteResponse } = useKnowledgeArchive();
    const mentorInputId = useId();
    
    const [activeTab, setActiveTab] = useState<KnowledgeViewTab>('guide');
    const [query, setQuery] = useState('');
    const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [editingResponse, setEditingResponse] = useState<ArchivedMentorResponse | null>(null);

    useEffect(() => {
        if (isLoading) {
            const shortQuery = query.length > 20 ? query.substring(0, 20) + '...' : query;
            const messages = geminiService.getDynamicLoadingMessages({ useCase: 'mentor', data: { query: shortQuery } }, t);
            let messageIndex = 0;
            
            const updateLoadingMessage = () => {
                setLoadingMessage(messages[messageIndex % messages.length]);
                messageIndex++;
            };

            updateLoadingMessage(); // Set initial message
            const intervalId = setInterval(updateLoadingMessage, 2000);

            return () => clearInterval(intervalId);
        }
    }, [isLoading, query, t]);


    const handleAskMentor = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setAiResponse(null);
        try {
            const res = await geminiService.getAiMentorResponse(query, t);
            setAiResponse(res);
        } catch (e) {
            console.error(e);
            const errorMessageKey = e instanceof Error ? e.message : 'ai.error.unknown';
            const errorMessage = t(errorMessageKey) === errorMessageKey ? t('ai.error.unknown') : t(errorMessageKey);
            setAiResponse({ title: t('common.error'), content: errorMessage});
            addNotification(errorMessage, 'error');
        }
        setIsLoading(false);
    };

    const phases = Array.from({ length: 5 }, (_, i) => `phase${i + 1}`);
    const checklistItems = phases.flatMap(p => Object.keys(t(`knowledgeView.sections.${p}.checklist`)));
    const completedItems = phases.reduce((acc, p) => acc + (progress[p]?.length || 0), 0);
    const progressPercent = checklistItems.length > 0 ? (completedItems / checklistItems.length) * 100 : 0;

    const tabs = [
        { id: 'guide', label: t('knowledgeView.tabs.guide'), icon: <PhosphorIcons.GraduationCap /> },
        { id: 'archive', label: t('knowledgeView.archive.title'), icon: <PhosphorIcons.Archive /> },
    ];

    const sortedArchive = [...archivedResponses].sort((a,b) => b.createdAt - a.createdAt);

    return (
        <div className="space-y-6">
            {editingResponse && (
                <EditResponseModal 
                    response={editingResponse} 
                    onClose={() => setEditingResponse(null)} 
                    onSave={(updated) => {
                        updateResponse(updated);
                        setEditingResponse(null);
                    }}
                />
            )}
             <Card>
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => setActiveTab(id as KnowledgeViewTab)} />
             </Card>
            
            {activeTab === 'guide' ? (
                <div className="space-y-6">
                    <Card>
                        <h3 className="font-semibold">{t('knowledgeView.progress')}</h3>
                        <div className="relative h-2 w-full bg-slate-700 rounded-full my-2">
                            <div className="absolute h-2 bg-primary-500 rounded-full transition-all duration-500" style={{width: `${progressPercent}%`}}></div>
                        </div>
                        <p className="text-sm text-slate-400">{t('knowledgeView.stepsCompleted', { completed: completedItems, total: checklistItems.length })}</p>
                    </Card>
                    <Card>
                        <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2">
                            <PhosphorIcons.Brain className="w-6 h-6"/> {t('knowledgeView.aiMentor.title')}
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">{t('knowledgeView.aiMentor.subtitle')}</p>
                        
                        <div className="relative">
                             <input 
                                id={mentorInputId} 
                                value={query} 
                                onChange={e => setQuery(e.target.value)} 
                                placeholder={t('knowledgeView.aiMentor.placeholder')} 
                                className="w-full pl-3 pr-10 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAskMentor();
                                    }
                                }}
                            />
                            {query && !isLoading && (
                                <button onClick={() => { setQuery(''); setAiResponse(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                                    <PhosphorIcons.XCircle className="w-5 h-5"/>
                                </button>
                            )}
                        </div>

                        <div className="flex justify-between items-end mt-2">
                            <div className="text-sm text-slate-400">
                                <span className="font-semibold">{t('knowledgeView.aiMentor.examplePromptsTitle')}:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {(t('knowledgeView.aiMentor.examples') as string[]).map((ex, i) => (
                                        <button key={i} onClick={() => setQuery(ex)} className="text-xs bg-slate-800 hover:bg-slate-700/80 px-2 py-1 rounded-md transition-colors">{ex}</button>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={handleAskMentor} disabled={isLoading || !query.trim()}>
                                {t('knowledgeView.aiMentor.button')}
                            </Button>
                        </div>

                        {isLoading && (
                            <div className="text-center p-6 flex flex-col items-center">
                                <PhosphorIcons.Brain className="w-12 h-12 text-primary-500 animate-pulse mb-3" />
                                <p className="text-slate-400">{loadingMessage || t('knowledgeView.aiMentor.loading')}</p>
                            </div>
                        )}
                        {aiResponse && !isLoading && (
                            <Card className="mt-4 bg-slate-800 animate-fade-in">
                                <h4 className="font-bold text-primary-300 text-lg">{aiResponse.title}</h4>
                                <div className="prose prose-sm dark:prose-invert max-w-none prose-h3:text-primary-400 prose-strong:text-slate-100" dangerouslySetInnerHTML={{ __html: aiResponse.content }}></div>
                                <div className="text-right mt-4">
                                     <Button size="sm" variant="secondary" onClick={() => addResponse({ ...aiResponse, query })}>
                                        <PhosphorIcons.ArchiveBox className="w-4 h-4 mr-1.5" />
                                        {t('knowledgeView.archive.saveButton')}
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </Card>
                    
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
            ) : (
                <Card>
                    <div className="space-y-4">
                    {sortedArchive.length > 0 ? (
                        sortedArchive.map(res => (
                            <Card key={res.id} className="bg-slate-800">
                                <p className="text-xs text-slate-400 italic">{t('knowledgeView.archive.queryLabel')}: "{res.query}"</p>
                                <h4 className="font-bold text-primary-300 mt-1">{res.title}</h4>
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: res.content }}></div>
                                <div className="flex justify-end items-center gap-2 mt-2">
                                    <Button size="sm" variant="secondary" onClick={() => setEditingResponse(res)} aria-label={t('common.edit')}>
                                        <PhosphorIcons.PencilSimple className="w-4 h-4"/>
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => deleteResponse(res.id)} aria-label={t('common.deleteResponse')}>
                                        <PhosphorIcons.TrashSimple className="w-4 h-4"/>
                                    </Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-500">
                             <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                            <h3 className="font-semibold">{t('knowledgeView.archive.empty')}</h3>
                        </div>
                    )}
                    </div>
                </Card>
            )}
        </div>
    );
};