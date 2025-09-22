import React, { useState, useEffect, useId } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useKnowledgeArchive } from '@/hooks/useKnowledgeArchive';
import { geminiService } from '@/services/geminiService';
import { AIResponse } from '@/types';
import { useNotifications } from '@/context/NotificationContext';

export const AiMentor: React.FC = () => {
    const { t } = useTranslations();
    const { addNotification } = useNotifications();
    const { addResponse } = useKnowledgeArchive();
    const mentorInputId = useId();

    const [query, setQuery] = useState('');
    const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

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
                {query && !isLoading && (
                    <button onClick={() => { setQuery(''); setAiResponse(null); }} className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors" aria-label={t('common.close')}>
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
    );
};
