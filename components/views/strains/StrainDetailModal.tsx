import React, { useState, useEffect, useMemo } from 'react';
import { Strain, AIResponse, StructuredGrowTips } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { geminiService } from '@/services/geminiService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { strainService } from '@/services/strainService';
import { useAppStore } from '@/stores/useAppStore';
import { selectHasAvailableSlots } from '@/stores/selectors';

// --- Sub-components for better structure ---

const DetailSection: React.FC<{ title: string, children: React.ReactNode, icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div>
        <h3 className="text-lg font-bold text-primary-400 flex items-center gap-2 mb-2">
            {icon} {title}
        </h3>
        <div className="pl-8 text-sm space-y-2">{children}</div>
    </div>
);

const DetailItem: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex flex-col sm:flex-row justify-between py-2 border-b border-slate-700/50">
        <span className="font-semibold text-slate-300">{label}:</span>
        <div className="text-slate-100 text-left sm:text-right">{children}</div>
    </div>
);

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full">{children}</span>
);

const DifficultyMeter: React.FC<{ difficulty: Strain['agronomic']['difficulty'] }> = ({ difficulty }) => {
    const { t } = useTranslations();
    const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    };

    return (
        <div className="flex items-center gap-2" title={difficultyLabels[difficulty]}>
            <div className="flex">
                <PhosphorIcons.Cannabis className={`w-5 h-5 ${difficulty === 'Easy' ? 'text-green-500' : difficulty === 'Medium' ? 'text-amber-500' : 'text-red-500'}`} />
                <PhosphorIcons.Cannabis className={`w-5 h-5 ${difficulty === 'Medium' ? 'text-amber-500' : difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                <PhosphorIcons.Cannabis className={`w-5 h-5 ${difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
            </div>
            <span>{difficultyLabels[difficulty]}</span>
        </div>
    );
};

const StructuredTipDisplay: React.FC<{ tips: StructuredGrowTips, onSave: () => void, isSaved: boolean }> = ({ tips, onSave, isSaved }) => {
    const { t } = useTranslations();

    const tipCategories = [
        { key: 'nutrientTip', icon: <PhosphorIcons.Flask />, label: t('strainsView.tips.form.categories.nutrientTip') },
        { key: 'trainingTip', icon: <PhosphorIcons.Scissors />, label: t('strainsView.tips.form.categories.trainingTip') },
        { key: 'environmentalTip', icon: <PhosphorIcons.Fan />, label: t('strainsView.tips.form.categories.environmentalTip') },
        { key: 'proTip', icon: <PhosphorIcons.Sparkle />, label: t('strainsView.tips.form.categories.proTip') },
    ];

    return (
        <Card className="bg-slate-800 animate-fade-in">
            <div className="space-y-4">
                {tipCategories.map(cat => (
                    <div key={cat.key}>
                        <h4 className="font-bold text-primary-300 flex items-center gap-2 mb-1">
                            {cat.icon}
                            {cat.label}
                        </h4>
                        <p className="text-sm text-slate-300 pl-8">{tips[cat.key as keyof StructuredGrowTips]}</p>
                    </div>
                ))}
            </div>
            <div className="text-right mt-4">
                <Button size="sm" variant="secondary" onClick={onSave} disabled={isSaved}>
                    {isSaved ? <><PhosphorIcons.CheckCircle className="w-4 h-4 mr-1.5" weight="fill" /> {t('strainsView.tips.saved')}</> : <><PhosphorIcons.ArchiveBox className="w-4 h-4 mr-1.5" /> {t('strainsView.tips.saveButton')}</>}
                </Button>
            </div>
        </Card>
    );
};


// --- Main Modal Component ---

interface StrainDetailModalProps {
    strain: Strain;
    onSaveTip: (strain: Strain, tip: AIResponse) => void;
}

export const StrainDetailModal: React.FC<StrainDetailModalProps> = ({ strain, onSaveTip }) => {
    const { t } = useTranslations();
    const {
        isFavorite,
        toggleFavorite,
        closeDetailModal,
        addNotification,
        getNoteForStrain,
        updateNoteForStrain,
        initiateGrow,
        selectStrain
    } = useAppStore(state => ({
        isFavorite: state.favoriteIds.has(strain.id),
        toggleFavorite: state.toggleFavorite,
        closeDetailModal: state.closeDetailModal,
        addNotification: state.addNotification,
        getNoteForStrain: (id: string) => state.strainNotes[id] || '',
        updateNoteForStrain: state.updateNoteForStrain,
        initiateGrow: state.initiateGrow,
        selectStrain: state.selectStrain,
    }));
    const hasAvailableSlots = useAppStore(selectHasAvailableSlots);
    const onClose = closeDetailModal;
    const modalRef = useFocusTrap(true);
    
    const [noteContent, setNoteContent] = useState('');
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [similarStrains, setSimilarStrains] = useState<Strain[]>([]);
    const [structuredTip, setStructuredTip] = useState<StructuredGrowTips | null>(null);
    const [isTipLoading, setIsTipLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [isTipSaved, setIsTipSaved] = useState(false);
    const [tipRequest, setTipRequest] = useState({
        focus: 'overall',
        stage: 'all',
        experience: 'advanced'
    });

    useEffect(() => {
        setNoteContent(getNoteForStrain(strain.id));
        setSimilarStrains(strainService.getSimilarStrains(strain));
        setStructuredTip(null);
        setIsTipSaved(false);
    }, [strain, getNoteForStrain]);
    
     useEffect(() => {
        if (isTipLoading) {
            const messages = geminiService.getDynamicLoadingMessages({ 
                useCase: 'growTips',
                data: {
                    strainName: strain.name,
                    focus: t(`strainsView.tips.form.focusOptions.${tipRequest.focus}`),
                    stage: t(`strainsView.tips.form.stageOptions.${tipRequest.stage}`)
                }
            }, t);
            let messageIndex = 0;
            const updateLoadingMessage = () => {
                setLoadingMessage(messages[messageIndex % messages.length]);
                messageIndex++;
            };
            
            updateLoadingMessage();
            const intervalId = setInterval(updateLoadingMessage, 2000);
            return () => clearInterval(intervalId);
        }
    }, [isTipLoading, t, strain.name, tipRequest]);

    const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];
    const typeClasses = { Sativa: 'text-amber-400', Indica: 'text-indigo-400', Hybrid: 'text-blue-400' };
    const isFav = isFavorite;

    const handleGetAiTips = async () => {
        setIsTipLoading(true);
        setStructuredTip(null);
        setIsTipSaved(false);
        try {
            const focusText = t(`strainsView.tips.form.focusOptions.${tipRequest.focus}`);
            const stageText = t(`strainsView.tips.form.stageOptions.${tipRequest.stage}`);
            const experienceText = t(`strainsView.tips.form.experienceOptions.${tipRequest.experience}`);

            const result = await geminiService.getStrainGrowTips(strain, { focus: focusText, stage: stageText, experience: experienceText }, t);
            setStructuredTip(result);
        } catch (err) {
            const errorMessageKey = err instanceof Error ? err.message : 'ai.error.unknown';
            const errorMessage = t(errorMessageKey) === errorMessageKey ? t('ai.error.unknown') : t(errorMessageKey);
            addNotification(errorMessage, 'error');
        }
        setIsTipLoading(false);
    };

    const handleSaveTip = () => {
        if (!structuredTip) return;

        const title = t('strainsView.tips.getTipsFor', { name: strain.name });
        const content = `
            <h3>${t('strainsView.tips.form.categories.nutrientTip')}</h3>
            <p>${structuredTip.nutrientTip}</p>
            <h3>${t('strainsView.tips.form.categories.trainingTip')}</h3>
            <p>${structuredTip.trainingTip}</p>
            <h3>${t('strainsView.tips.form.categories.environmentalTip')}</h3>
            <p>${structuredTip.environmentalTip}</p>
            <h3>${t('strainsView.tips.form.categories.proTip')}</h3>
            <p>${structuredTip.proTip}</p>
        `;
        
        onSaveTip(strain, { title, content });
        setIsTipSaved(true);
    };

    const handleSaveNote = () => {
        updateNoteForStrain(strain.id, noteContent);
        setIsEditingNotes(false);
        addNotification(t('strainsView.strainModal.saveNotes'), 'success');
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-overlay-animate" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="strain-modal-title">
                <Card ref={modalRef} className="w-full max-w-4xl h-auto max-h-[90vh] flex flex-col modal-content-animate" onClick={(e) => e.stopPropagation()}>
                    <header className="flex justify-between items-start flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <TypeIcon className={`w-12 h-12 flex-shrink-0 ${typeClasses[strain.type]}`} />
                            <div>
                                <h2 id="strain-modal-title" className="text-3xl font-bold font-display text-primary-300">{strain.name}</h2>
                                <p className="text-slate-400">{strain.type} {strain.typeDetails && `- ${strain.typeDetails}`}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <div title={!hasAvailableSlots ? t('plantsView.notifications.allSlotsFull') : undefined}>
                                <Button onClick={() => initiateGrow(strain)} disabled={!hasAvailableSlots} className="hidden sm:inline-flex">{t('strainsView.startGrowing')}</Button>
                            </div>
                            <Button variant="secondary" onClick={() => toggleFavorite(strain.id)} aria-pressed={isFav} className="favorite-btn-glow p-2">
                                <PhosphorIcons.Heart weight={isFav ? 'fill' : 'regular'} className={`w-5 h-5 ${isFav ? 'is-favorite' : ''}`} />
                            </Button>
                            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-700" aria-label={t('common.close')}><PhosphorIcons.X className="w-6 h-6" /></button>
                        </div>
                    </header>
                    
                     <div className="sm:hidden mt-4 flex-shrink-0" title={!hasAvailableSlots ? t('plantsView.notifications.allSlotsFull') : undefined}>
                        <Button onClick={() => initiateGrow(strain)} disabled={!hasAvailableSlots} className="w-full">{t('strainsView.startGrowing')}</Button>
                    </div>

                    <div className="overflow-y-auto pr-2 mt-4 flex-grow space-y-6">
                       {strain.description && <p className="text-slate-300 italic">{strain.description}</p>}
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                           <div className="space-y-6">
                               <DetailSection title={t('strainsView.strainModal.agronomicData')} icon={<PhosphorIcons.Plant />}>
                                    <DetailItem label={t('strainsView.strainModal.difficulty')}><DifficultyMeter difficulty={strain.agronomic.difficulty} /></DetailItem>
                                    <DetailItem label={t('strainsView.strainModal.yieldIndoor')}>{strain.agronomic.yieldDetails?.indoor || 'N/A'}</DetailItem>
                                    <DetailItem label={t('strainsView.strainModal.heightIndoor')}>{strain.agronomic.heightDetails?.indoor || 'N/A'}</DetailItem>
                                    <DetailItem label={t('strainsView.strainModal.floweringTime')}>{`${strain.floweringTimeRange || strain.floweringTime} ${t('common.units.weeks')}`}</DetailItem>
                               </DetailSection>

                                {similarStrains.length > 0 && (
                                     <DetailSection title={t('strainsView.strainModal.similarStrains')} icon={<PhosphorIcons.Leafy />}>
                                        <div className="grid grid-cols-2 gap-2">
                                             {similarStrains.map(s => 
                                                <button key={s.id} onClick={() => selectStrain(s)} className="p-2 text-center rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                                                    <p className="text-sm font-semibold">{s.name}</p>
                                                </button>
                                            )}
                                        </div>
                                   </DetailSection>
                                )}
                           </div>

                            <div className="space-y-6">
                                <DetailSection title="Cannabinoid Profile" icon={<PhosphorIcons.Sparkle />}>
                                   <DetailItem label="THC">{strain.thcRange || `${strain.thc}%`}</DetailItem>
                                   <DetailItem label="CBD">{strain.cbdRange || `${strain.cbd}%`}</DetailItem>
                                   <DetailItem label={t('common.genetics')}>{strain.genetics || 'N/A'}</DetailItem>
                               </DetailSection>

                               <DetailSection title="Aroma & Terpene Profile" icon={<PhosphorIcons.Drop />}>
                                    <DetailItem label={t('strainsView.strainModal.aromas')}>
                                        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                                            {(strain.aromas || []).map(a => <Tag key={a}>{a}</Tag>)}
                                        </div>
                                    </DetailItem>
                                    <DetailItem label={t('strainsView.strainModal.dominantTerpenes')}>
                                        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                                            {(strain.dominantTerpenes || []).map(terp => <Tag key={terp}>{terp}</Tag>)}
                                        </div>
                                    </DetailItem>
                               </DetailSection>
                            </div>
                       </div>

                        <DetailSection title={t('strainsView.strainModal.notes')} icon={<PhosphorIcons.BookOpenText />}>
                             <div className="bg-slate-800 p-3 rounded-md">
                                <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    onClick={() => !isEditingNotes && setIsEditingNotes(true)}
                                    readOnly={!isEditingNotes}
                                    className={`w-full bg-transparent resize-none focus:outline-none min-h-[60px] ${isEditingNotes ? 'ring-1 ring-primary-500 rounded p-2' : ''}`}
                                    placeholder={t('strainsView.addStrainModal.aromasPlaceholder')}
                                />
                                {isEditingNotes && (
                                    <div className="text-right mt-2 flex gap-2 justify-end">
                                        <Button size="sm" variant="secondary" onClick={() => { setIsEditingNotes(false); setNoteContent(getNoteForStrain(strain.id)) }}>{t('common.cancel')}</Button>
                                        <Button size="sm" onClick={handleSaveNote}>{t('strainsView.strainModal.saveNotes')}</Button>
                                    </div>
                                )}
                            </div>
                        </DetailSection>
                        
                        <DetailSection title={t('strainsView.tips.form.title')} icon={<PhosphorIcons.Brain />}>
                           <p className="text-sm text-slate-400 mb-4 -mt-2">{t('strainsView.tips.form.description')}</p>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">{t('strainsView.tips.form.focus')}</label>
                                        <select value={tipRequest.focus} onChange={e => setTipRequest(p => ({...p, focus: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm">
                                            {Object.keys(t('strainsView.tips.form.focusOptions')).map(k => <option key={k} value={k}>{t(`strainsView.tips.form.focusOptions.${k}`)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">{t('strainsView.tips.form.stage')}</label>
                                        <select value={tipRequest.stage} onChange={e => setTipRequest(p => ({...p, stage: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm">
                                            {Object.keys(t('strainsView.tips.form.stageOptions')).map(k => <option key={k} value={k}>{t(`strainsView.tips.form.stageOptions.${k}`)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">{t('strainsView.tips.form.experience')}</label>
                                        <select value={tipRequest.experience} onChange={e => setTipRequest(p => ({...p, experience: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm">
                                            {Object.keys(t('strainsView.tips.form.experienceOptions')).map(k => <option key={k} value={k}>{t(`strainsView.tips.form.experienceOptions.${k}`)}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <Button size="sm" onClick={handleGetAiTips} disabled={isTipLoading} className="w-full">
                                    {isTipLoading ? loadingMessage : t('strainsView.tips.form.generate')}
                                </Button>
                                {isTipLoading && <div className="text-center text-sm text-slate-400 animate-pulse">{loadingMessage || t('ai.generating')}</div>}
                                {structuredTip && !isTipLoading && (
                                    <StructuredTipDisplay tips={structuredTip} onSave={handleSaveTip} isSaved={isTipSaved} />
                                )}
                            </div>
                       </DetailSection>
                    </div>
                </Card>
            </div>
        </>
    );
};