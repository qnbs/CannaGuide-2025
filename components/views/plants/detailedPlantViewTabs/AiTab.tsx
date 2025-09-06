import React, { useState } from 'react';
import { Card } from '../../../common/Card';
import { Button } from '../../../common/Button';
import { PhosphorIcons } from '../../../icons/PhosphorIcons';
import { SkeletonLoader } from '../../../common/SkeletonLoader';
import { geminiService } from '../../../../services/geminiService';
import { AIResponse, Plant } from '../../../../types';
import { useTranslations } from '../../../../hooks/useTranslations';

interface AiTabProps {
    plant: Plant;
}

export const AiTab: React.FC<AiTabProps> = ({ plant }) => {
    const { t, locale } = useTranslations();
    const [query, setQuery] = useState('');
    const [advisorResponse, setAdvisorResponse] = useState<AIResponse | null>(null);
    const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);
    const [analysisResponse, setAnalysisResponse] = useState<AIResponse | null>(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

    const handleAskAdvisor = async () => {
        if (!query.trim()) return;
        setIsAdvisorLoading(true);
        setAdvisorResponse(null);
        const res = await geminiService.askAboutPlant(plant, query, t('plantsView.detailedView.aiAdvisor.titleTemplate', { name: plant.name }), locale);
        setAdvisorResponse(res);
        setIsAdvisorLoading(false);
        setQuery('');
    };

    const handleAnalyzeJournal = async () => {
        setIsAnalysisLoading(true);
        setAnalysisResponse(null);
        const res = await geminiService.getJournalAnalysis(plant, locale);
        setAnalysisResponse(res);
        setIsAnalysisLoading(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-xl font-bold font-display mb-4 text-primary-400 flex items-center gap-2">
                    <PhosphorIcons.Sparkle className="w-6 h-6" />
                    {t('plantsView.detailedView.aiAdvisor.prompt')}
                </h3>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAskAdvisor()}
                        placeholder={t('plantsView.detailedView.aiAdvisor.placeholder')}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    />
                    <Button onClick={handleAskAdvisor} disabled={isAdvisorLoading || !query.trim()} className="shrink-0">{t('plantsView.detailedView.aiAdvisor.button')}</Button>
                </div>
                <div className="mt-4">
                    {isAdvisorLoading && <SkeletonLoader count={3} />}
                    {advisorResponse && (
                        <div className="bg-slate-900 p-4 rounded-lg animate-fade-in">
                            <article className="prose dark:prose-invert max-w-none">
                                <h4 className="!text-primary-300 !mt-0">{advisorResponse.title}</h4>
                                <div dangerouslySetInnerHTML={{ __html: advisorResponse.content }} />
                            </article>
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display mb-4 text-primary-400 flex items-center gap-2">
                    <PhosphorIcons.BookOpenText className="w-6 h-6" />
                    Journal Analysis
                </h3>
                <p className="text-sm text-slate-400 mb-4">Let the AI analyze the entire grow journal to provide a summary, highlight key events, and suggest improvements.</p>
                <Button onClick={handleAnalyzeJournal} disabled={isAnalysisLoading}>
                    {isAnalysisLoading ? 'Analyzing...' : 'Analyze Grow Journal'}
                </Button>
                <div className="mt-4">
                    {isAnalysisLoading && <SkeletonLoader count={3} />}
                    {analysisResponse && (
                        <div className="bg-slate-900 p-4 rounded-lg animate-fade-in">
                            <article className="prose dark:prose-invert max-w-none">
                                <h4 className="!text-primary-300 !mt-0">{analysisResponse.title}</h4>
                                <div dangerouslySetInnerHTML={{ __html: analysisResponse.content }} />
                            </article>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
