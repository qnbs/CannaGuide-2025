import React, { useState, useEffect } from 'react';
import { Strain, AIResponse } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useStrainNotes } from '@/hooks/useStrainNotes';
import { useNotifications } from '@/context/NotificationContext';
import { geminiService } from '@/services/geminiService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { GrowSetupModal } from '@/components/views/plants/GrowSetupModal';
import { strainService } from '@/services/strainService';

interface StrainDetailModalProps {
    strain: Strain;
    onClose: () => void;
    isFavorite: boolean;
    onToggleFavorite: (id: string) => void;
    onStartGrow: (setup: any, strain: Strain) => void;
    onSaveTip: (strain: Strain, tip: AIResponse) => void;
}

const DetailSection: React.FC<{ title: string, children: React.ReactNode, icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div>
        <h3 className="text-lg font-bold text-primary-400 flex items-center gap-2 mb-2">
            {icon} {title}
        </h3>
        <div className="pl-8 text-sm">{children}</div>
    </div>
);

const DetailItem: React.FC<{ label: string, value?: string | number | string[] }> = ({ label, value }) => (
    <div className="flex justify-between py-1 border-b border-slate-700/50">
        <span className="font-semibold text-slate-300">{label}:</span>
        <span className="text-slate-100 text-right">{Array.isArray(value) ? value.join(', ') : value || 'N/A'}</span>
    </div>
);


export const StrainDetailModal: React.FC<StrainDetailModalProps> = ({ strain, onClose, isFavorite, onToggleFavorite, onStartGrow, onSaveTip }) => {
    const { t } = useTranslations();
    const { addNotification } = useNotifications();
    const modalRef = useFocusTrap(true);
    const { getNoteForStrain, updateNoteForStrain } = useStrainNotes();
    
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [similarStrains, setSimilarStrains] = useState<Strain[]>([]);
    const [aiTip, setAiTip] = useState<AIResponse | null>(null);
    const [isTipLoading, setIsTipLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [isTipSaved, setIsTipSaved] = useState(false);

    useEffect(() => {
        setNoteContent(getNoteForStrain(strain.id));
        setSimilarStrains(strainService.getSimilarStrains(strain));
        setAiTip(null);
        setIsTipSaved(false);
    }, [strain, getNoteForStrain]);
    
     useEffect(() => {
        if (isTipLoading) {
            const messages = geminiService.getDynamicLoadingMessages({ useCase: 'growTips' }, t);
            let messageIndex = 0;
            const intervalId = setInterval(() => {
                setLoadingMessage(messages[messageIndex % messages.length]);
                messageIndex++;
            }, 2000);
            return () => clearInterval(intervalId);
        }
    }, [isTipLoading, t]);

    useEffect(() => {
        setIsTipSaved(false);
    }, [aiTip]);

    const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];
    const typeClasses = { Sativa: 'text-amber-400', Indica: 'text-indigo-400', Hybrid: 'text-blue-400' };

    const handleGetAiTips = async () => {
        setIsTipLoading(true);
        setAiTip(null);
        try {
            const result = await geminiService.getStrainGrowTips(strain, t);
            setAiTip(result);
        } catch (err) {
            const errorMessageKey = err instanceof Error ? err.message : 'ai.error.unknown';
            const errorMessage = t(errorMessageKey) === errorMessageKey ? t('ai.error.unknown') : t(errorMessageKey);
            addNotification(errorMessage, 'error');
        }
        setIsTipLoading(false);
    };

    return (
        <>
            {isSetupModalOpen && <GrowSetupModal strain={strain} onClose={() => setIsSetupModalOpen(false)} onConfirm={(setup) => { setIsSetupModalOpen(false); onStartGrow(setup, strain); }} />}
            
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-overlay-animate" onClick={onClose}>
                <Card ref={modalRef} className="w-full max-w-3xl h-auto max-h-[90vh] flex flex-col modal-content-animate" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-start flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <TypeIcon className={`w-12 h-12 flex-shrink-0 ${typeClasses[strain.type]}`} />
                            <div>
                                <h2 className="text-3xl font-bold font-display text-primary-300">{strain.name}</h2>
                                <p className="text-slate-400">{strain.type} {strain.typeDetails && `- ${strain.typeDetails}`}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" onClick={() => onToggleFavorite(strain.id)} aria-pressed={isFavorite} className="favorite-btn-glow p-2">
                                <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className={`w-5 h-5 ${isFavorite ? 'is-favorite' : ''}`} />
                            </Button>
                            <Button onClick={() => setIsSetupModalOpen(true)} className="hidden sm:inline-flex">{t('strainsView.startGrowing')}</Button>
                            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-700" aria-label={t('common.close')}><PhosphorIcons.X className="w-6 h-6" /></button>
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto pr-2 mt-4 flex-grow space-y-6">
                       <p className="text-slate-300 italic">{strain.description}</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <DetailSection title={t('strainsView.strainModal.agronomicData')} icon={<PhosphorIcons.Plant />}>
                                <DetailItem label={t('strainsView.strainModal.difficulty')} value={t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)} />
                                <DetailItem label={t('strainsView.strainModal.yieldIndoor')} value={strain.agronomic.yieldDetails?.indoor} />
                                <DetailItem label={t('strainsView.strainModal.heightIndoor')} value={strain.agronomic.heightDetails?.indoor} />
                                <DetailItem label={t('strainsView.strainModal.floweringTime')} value={`${strain.floweringTimeRange || strain.floweringTime} ${t('common.units.weeks')}`} />
                           </DetailSection>
                           <DetailSection title="Cannabinoid Profile" icon={<PhosphorIcons.Sparkle />}>
                               <DetailItem label="THC" value={strain.thcRange || `${strain.thc}%`} />
                               <DetailItem label="CBD" value={strain.cbdRange || `${strain.cbd}%`} />
                               <DetailItem label={t('common.genetics')} value={strain.genetics} />
                           </DetailSection>
                       </div>
                       <DetailSection title="Aroma & Terpene Profile" icon={<PhosphorIcons.Leafy />}>
                            <DetailItem label={t('strainsView.strainModal.aromas')} value={strain.aromas} />
                            <DetailItem label={t('strainsView.strainModal.dominantTerpenes')} value={strain.dominantTerpenes} />
                       </DetailSection>

                        <DetailSection title={t('strainsView.strainModal.notes')} icon={<PhosphorIcons.BookOpenText />}>
                             <div className="bg-slate-800 p-3 rounded-md">
                                <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    readOnly={!isEditingNotes}
                                    className={`w-full bg-transparent resize-none focus:outline-none ${isEditingNotes ? 'ring-1 ring-primary-500 rounded p-1' : ''}`}
                                    placeholder="Add your personal notes..."
                                />
                                <div className="text-right mt-2">
                                    <Button size="sm" onClick={() => {
                                        if (isEditingNotes) updateNoteForStrain(strain.id, noteContent);
                                        setIsEditingNotes(!isEditingNotes);
                                    }}>
                                        {isEditingNotes ? t('strainsView.strainModal.saveNotes') : t('strainsView.strainModal.editNotes')}
                                    </Button>
                                </div>
                            </div>
                        </DetailSection>
                        
                        <DetailSection title="AI Grow Tips" icon={<PhosphorIcons.Brain />}>
                           {isTipLoading ? (
                                <p className="text-slate-400 animate-pulse">{loadingMessage || t('ai.generating')}</p>
                           ) : aiTip ? (
                               <Card className="bg-slate-800">
                                   <h4 className="font-bold text-primary-300">{aiTip.title}</h4>
                                   <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiTip.content }}></div>
                                   <div className="text-right mt-2">
                                       <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                onSaveTip(strain, aiTip);
                                                setIsTipSaved(true);
                                            }}
                                            disabled={isTipSaved}
                                        >
                                            {isTipSaved ? (
                                                <>
                                                    <PhosphorIcons.CheckCircle className="w-4 h-4 mr-1.5" weight="fill" />
                                                    {t('strainsView.tips.saved')}
                                                </>
                                            ) : (
                                                <>
                                                    <PhosphorIcons.ArchiveBox className="w-4 h-4 mr-1.5" />
                                                    {t('strainsView.tips.saveButton')}
                                                </>
                                            )}
                                        </Button>
                                   </div>
                               </Card>
                           ) : (
                               <Button size="sm" onClick={handleGetAiTips}>{t('strainsView.strainModal.getAiTips')}</Button>
                           )}
                       </DetailSection>

                        {similarStrains.length > 0 && (
                             <DetailSection title={t('strainsView.strainModal.similarStrains')} icon={<PhosphorIcons.Leafy />}>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                     {similarStrains.map(s => <Card key={s.id} className="text-center p-2"><p className="text-sm font-semibold">{s.name}</p></Card>)}
                                </div>
                           </DetailSection>
                        )}
                    </div>
                     <div className="mt-4 pt-4 border-t border-slate-700 flex-shrink-0 sm:hidden">
                        <Button onClick={() => setIsSetupModalOpen(true)} className="w-full">{t('strainsView.startGrowing')}</Button>
                    </div>
                </Card>
            </div>
        </>
    );
};