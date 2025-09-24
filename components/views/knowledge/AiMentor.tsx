import React, { useState, useEffect, useId, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { geminiService } from '@/services/geminiService';
import { AIResponse } from '@/types';
import { selectArchivedMentorResponses } from '@/stores/selectors';

export const AiMentor: React.FC = () => {
    const { t } = useTranslations();
    const { addNotification, addResponse, askMentor, mentorTask, resetAiTask } = useAppStore(state => ({
        addNotification: state.addNotification,
        addResponse: state.addArchivedMentorResponse,
        askMentor: state.askMentor,
        mentorTask: state.mentorTask,
        resetAiTask: state.resetAiTask,
    }));
    const archivedResponses = useAppStore(selectArchivedMentorResponses);
    const mentorInputId = useId();

    const [query, setQuery] = useState('');
    
    // Check if the current, successfully generated response is already in the archive
    const isCurrentResponseSaved = useMemo(() => {
        if (mentorTask.status !== 'success' || !mentorTask.result) return false;
        return archivedResponses.some(r => r.content === mentorTask.result?.content && r.query === query);
    }, [mentorTask.status, mentorTask.result, archivedResponses, query]);

    const handleAskMentor = () => {
        if (!query.trim()) return;
        askMentor(query);
    };

    const handleSaveResponse = () => {
        if (mentorTask.result) {
            addResponse({ ...mentorTask.result, query });
        }
    };
    
    const handleClear = () => {
        setQuery('');
        resetAiTask('mentorTask');
    }

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2">
                <PhosphorIcons.Brain className="w-6 h-6"/> {t('knowledgeView.aiMentor.title')}
            </h3>
            <p className="text-sm text-slate-400 mb-4">{t('knowledgeView.aiMentor.subtitle')}</p>
            
            <div className="relative">
                <textarea 
                    id={mentorInputId} 
                    value={query} 
                    onChange={e => setQuery(e.target.value)} 
                    placeholder={t('knowledgeView.aiMentor.placeholder')} 
                    className="w-full pl-3 pr-10 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleAskMentor();
                        }
                    }}
                />
                {query && mentorTask.status !== 'loading' && (
                    <button onClick={handleClear} className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors" aria-label={t('common.close')}>
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
                <Button onClick={handleAskMentor} disabled={mentorTask.status === 'loading' || !query.trim()}>
                    {t('knowledgeView.aiMentor.button')}
                </Button>
            </div>

            {mentorTask.status === 'loading' && (
                <div className="text-center p-6 flex flex-col items-center">
                    <PhosphorIcons.Brain className="w-12 h-12 text-primary-500 animate-pulse mb-3" />
                    <p className="text-slate-400">{mentorTask.loadingMessage || t('knowledgeView.aiMentor.loading')}</p>
                </div>
            )}
            {(mentorTask.status === 'success' || mentorTask.status === 'error') && mentorTask.result && (
                 <div className="max-h-[50vh] overflow-y-auto pr-2 mt-4">
                    <Card className="bg-slate-800 animate-fade-in">
                        <h4 className="font-bold text-primary-300 text-lg">{mentorTask.result.title}</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-h3:text-primary-400 prose-strong:text-slate-100" dangerouslySetInnerHTML={{ __html: mentorTask.result.content }}></div>
                        {mentorTask.status !== 'error' && (
                            <div className="text-right mt-4">
                                <Button size="sm" variant="secondary" onClick={handleSaveResponse} disabled={isCurrentResponseSaved}>
                                    {isCurrentResponseSaved ? 
                                        <><PhosphorIcons.CheckCircle className="w-4 h-4 mr-1.5" />{t('strainsView.tips.saved')}</> :
                                        <><PhosphorIcons.ArchiveBox className="w-4 h-4 mr-1.5" />{t('knowledgeView.archive.saveButton')}</>
                                    }
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </Card>
    );
};