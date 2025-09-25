import React, { useState, useEffect } from 'react';
import { Strain, AIResponse } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { strainService } from '@/services/strainService';
import { useAppStore } from '@/stores/useAppStore';
import { selectHasAvailableSlots } from '@/stores/selectors';
import { Modal } from '@/components/common/Modal';
import { StrainAiTips } from './StrainAiTips';

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
        getNoteForStrain,
        updateNoteForStrain,
        initiateGrow,
        selectStrain,
    } = useAppStore(state => ({
        isFavorite: state.favoriteIds.has(strain.id),
        toggleFavorite: state.toggleFavorite,
        closeDetailModal: state.closeDetailModal,
        getNoteForStrain: (id: string) => state.strainNotes[id] || '',
        updateNoteForStrain: state.updateNoteForStrain,
        initiateGrow: state.initiateGrow,
        selectStrain: state.selectStrain,
    }));
    const hasAvailableSlots = useAppStore(selectHasAvailableSlots);
    
    const [noteContent, setNoteContent] = useState('');
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [similarStrains, setSimilarStrains] = useState<Strain[]>([]);
    
    useEffect(() => {
        setNoteContent(getNoteForStrain(strain.id));
        strainService.getSimilarStrains(strain).then(setSimilarStrains);
    }, [strain, getNoteForStrain]);
    
    const typeClasses = { Sativa: 'text-amber-400', Indica: 'text-indigo-400', Hybrid: 'text-blue-400' };
    const isFav = isFavorite;
    
    const TypeDisplay = () => {
        const Icon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];
        if (!Icon) return <div className="w-12 h-12 flex-shrink-0 bg-slate-700 rounded-full" />;
        return <Icon className={`w-12 h-12 flex-shrink-0 ${typeClasses[strain.type]}`} />;
    };

    const handleSaveNote = () => {
        updateNoteForStrain(strain.id, noteContent);
        setIsEditingNotes(false);
        useAppStore.getState().addNotification(t('strainsView.strainModal.saveNotes'), 'success');
    };

    return (
        <Modal isOpen={true} onClose={closeDetailModal} size="4xl">
             <header className="flex justify-between items-start flex-shrink-0">
                <div className="flex items-center gap-4">
                    <TypeDisplay />
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
                    <button type="button" onClick={closeDetailModal} className="p-2 rounded-full hover:bg-slate-700" aria-label={t('common.close')}><PhosphorIcons.X className="w-6 h-6" /></button>
                </div>
            </header>
            
            <div className="sm:hidden mt-4 flex-shrink-0" title={!hasAvailableSlots ? t('plantsView.notifications.allSlotsFull') : undefined}>
                <Button onClick={() => initiateGrow(strain)} disabled={!hasAvailableSlots} className="w-full">{t('strainsView.startGrowing')}</Button>
            </div>

            <div className="mt-4 space-y-6">
                {strain.description && <p className="text-slate-300 italic">{strain.description}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-6">
                        <DetailSection title={t('strainsView.strainModal.agronomicData')} icon={<PhosphorIcons.Plant />}>
                            <DetailItem label={t('strainsView.strainModal.difficulty')}><DifficultyMeter difficulty={strain.agronomic?.difficulty || 'Medium'} /></DetailItem>
                            <DetailItem label={t('strainsView.strainModal.yieldIndoor')}>{strain.agronomic?.yieldDetails?.indoor || 'N/A'}</DetailItem>
                            <DetailItem label={t('strainsView.strainModal.yieldOutdoor')}>{strain.agronomic?.yieldDetails?.outdoor || 'N/A'}</DetailItem>
                            <DetailItem label={t('strainsView.strainModal.heightIndoor')}>{strain.agronomic?.heightDetails?.indoor || 'N/A'}</DetailItem>
                            <DetailItem label={t('strainsView.strainModal.heightOutdoor')}>{strain.agronomic?.heightDetails?.outdoor || 'N/A'}</DetailItem>
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
                
                <StrainAiTips strain={strain} onSaveTip={onSaveTip} />

            </div>
        </Modal>
    );
};