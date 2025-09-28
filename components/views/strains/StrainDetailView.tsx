import React, { useState, useEffect } from 'react';
import { Strain, AIResponse } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { strainService } from '@/services/strainService';
// FIX: Corrected imports for Redux
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectHasAvailableSlots, selectFavoriteIds } from '@/stores/selectors';
import { toggleFavorite } from '@/stores/slices/favoritesSlice';
import { initiateGrowFromStrainList } from '@/stores/slices/uiSlice';
import { updateNote } from '@/stores/slices/notesSlice';
import { StrainAiTips } from './StrainAiTips';
import { Tabs } from '@/components/common/Tabs';
import { InfoSection } from '@/components/common/InfoSection';
import { AttributeDisplay } from '@/components/common/AttributeDisplay';
import { Speakable } from '@/components/common/Speakable';

// --- Sub-components for better structure ---

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
    const difficultyMap = { Easy: { level: 1, color: 'text-green-500' }, Medium: { level: 2, color: 'text-amber-500' }, Hard: { level: 3, color: 'text-red-500' },};
    const { level, color } = difficultyMap[difficulty || 'Medium'];

    return (
        <div className="flex items-center gap-2 justify-end" title={difficultyLabels[difficulty]}>
            <span>{difficultyLabels[difficulty]}</span>
            <div className="flex">
                {[...Array(3)].map((_, i) => (
                    <PhosphorIcons.Cannabis key={i} className={`w-5 h-5 ${i < level ? color : 'text-slate-700'}`} />
                ))}
            </div>
        </div>
    );
};

const OverviewTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslations();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoSection title={t('common.description')}>
                <Speakable elementId={`strain-desc-${strain.id}`}>
                    <p className="text-slate-300 italic text-sm">{strain.description || 'No description available.'}</p>
                </Speakable>
            </InfoSection>
            <InfoSection title="Cannabinoid Profile">
                <div className="space-y-2">
                    <AttributeDisplay label={t('common.genetics')} value={strain.genetics} />
                    <AttributeDisplay label={t('strainsView.table.thc')} value={strain.thcRange || `${strain.thc?.toFixed(1)}%`} />
                    <AttributeDisplay label={t('strainsView.table.cbd')} value={strain.cbdRange || `${strain.cbd?.toFixed(1)}%`} />
                </div>
            </InfoSection>
        </div>
    );
};

const AgronomicsTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslations();
    return (
        <InfoSection title={t('strainsView.strainModal.agronomicData')}>
            <div className="space-y-2">
                <AttributeDisplay label={t('strainsView.strainModal.difficulty')} value={<DifficultyMeter difficulty={strain.agronomic?.difficulty || 'Medium'} />} />
                <AttributeDisplay label={t('strainsView.strainModal.yieldIndoor')} value={strain.agronomic?.yieldDetails?.indoor} />
                <AttributeDisplay label={t('strainsView.strainModal.yieldOutdoor')} value={strain.agronomic?.yieldDetails?.outdoor} />
                <AttributeDisplay label={t('strainsView.strainModal.heightIndoor')} value={strain.agronomic?.heightDetails?.indoor} />
                <AttributeDisplay label={t('strainsView.strainModal.heightOutdoor')} value={strain.agronomic?.heightDetails?.outdoor} />
                <AttributeDisplay label={t('strainsView.strainModal.floweringTime')} value={`${strain.floweringTimeRange || strain.floweringTime} ${t('common.units.weeks')}`} />
            </div>
        </InfoSection>
    );
};

const ProfileTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslations();
    return (
        <InfoSection title="Aroma & Terpene Profile">
            <div className="space-y-4">
                <AttributeDisplay
                    label={t('strainsView.strainModal.aromas')}
                    value={
                        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                            {(strain.aromas || []).map(a => <Tag key={a}>{a}</Tag>)}
                        </div>
                    }
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.dominantTerpenes')}
                    value={
                        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                            {(strain.dominantTerpenes || []).map(terp => <Tag key={terp}>{terp}</Tag>)}
                        </div>
                    }
                />
            </div>
        </InfoSection>
    );
};

const NotesTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslations();
    const dispatch = useAppDispatch();
    const note = useAppSelector(state => state.notes.strainNotes[strain.id] || '');
    
    const [noteContent, setNoteContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setNoteContent(note);
    }, [strain, note]);

    const handleSaveNote = () => {
        dispatch(updateNote({ strainId: strain.id, note: noteContent }));
        setIsEditing(false);
    };

    return (
        <InfoSection title={t('strainsView.strainModal.notes')}>
            <div className="bg-slate-800 p-3 rounded-md">
                <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    onClick={() => !isEditing && setIsEditing(true)}
                    readOnly={!isEditing}
                    className={`w-full bg-transparent resize-none focus:outline-none min-h-[150px] ${isEditing ? 'ring-1 ring-primary-500 rounded p-2' : 'p-2'}`}
                    placeholder={t('strainsView.addStrainModal.aromasPlaceholder')}
                />
                {isEditing && (
                    <div className="text-right mt-2 flex gap-2 justify-end">
                        <Button size="sm" variant="secondary" onClick={() => { setIsEditing(false); setNoteContent(note); }}>{t('common.cancel')}</Button>
                        <Button size="sm" onClick={handleSaveNote}>{t('strainsView.strainModal.saveNotes')}</Button>
                    </div>
                )}
            </div>
        </InfoSection>
    );
};

const SimilarStrainsSection: React.FC<{ currentStrain: Strain; onSelect: (strain: Strain) => void }> = ({ currentStrain, onSelect }) => {
    const { t } = useTranslations();
    const [similar, setSimilar] = useState<Strain[]>([]);

    useEffect(() => {
        strainService.getSimilarStrains(currentStrain, 4).then(setSimilar);
    }, [currentStrain]);

    if (similar.length === 0) return null;

    return (
        <InfoSection title={t('strainsView.strainDetail.similarStrains')} icon={<PhosphorIcons.Leafy />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {similar.map(strain => (
                    <Card key={strain.id} className="p-2 cursor-pointer" onClick={() => onSelect(strain)}>
                        <h4 className="font-semibold text-primary-300">{strain.name}</h4>
                        <p className="text-xs text-slate-400">{strain.type}</p>
                    </Card>
                ))}
            </div>
        </InfoSection>
    );
};


interface StrainDetailViewProps {
    strain: Strain;
    allStrains: Strain[];
    onBack: () => void;
    onSaveTip: (strain: Strain, tip: AIResponse) => void;
}

export const StrainDetailView: React.FC<StrainDetailViewProps> = ({ strain, allStrains, onBack, onSaveTip }) => {
    const { t } = useTranslations();
    const dispatch = useAppDispatch();
    const favoriteIds = useAppSelector(selectFavoriteIds);
    const isFavorite = favoriteIds.has(strain.id);
    const hasAvailableSlots = useAppSelector(selectHasAvailableSlots);

    const [activeTab, setActiveTab] = useState('overview');
    const [currentStrain, setCurrentStrain] = useState(strain);
    
    useEffect(() => {
        setCurrentStrain(strain);
        setActiveTab('overview');
    }, [strain]);

    const tabs: { id: string; label: string; icon: React.ReactNode; }[] = [
        { id: 'overview', label: t('strainsView.strainDetail.tabs.overview'), icon: <PhosphorIcons.Book /> },
        { id: 'agronomics', label: t('strainsView.strainDetail.tabs.agronomics'), icon: <PhosphorIcons.Ruler /> },
        { id: 'profile', label: t('strainsView.strainDetail.tabs.profile'), icon: <PhosphorIcons.Sparkle /> },
        { id: 'notes', label: t('strainsView.strainDetail.tabs.notes'), icon: <PhosphorIcons.BookOpenText /> },
        { id: 'aiTips', label: t('strainsView.strainDetail.tabs.aiTips'), icon: <PhosphorIcons.Brain /> },
    ];
    
    const typeClasses = { Sativa: 'text-amber-400', Indica: 'text-indigo-400', Hybrid: 'text-blue-400' };
    const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[currentStrain.type];

    return (
        <div className="animate-fade-in space-y-6">
            <header>
                 <div className="flex items-center justify-between">
                    <Button variant="secondary" onClick={onBack}>
                        <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                        {t('common.back')}
                    </Button>
                    <div className="flex items-center gap-2">
                        <div title={!hasAvailableSlots ? t('plantsView.notifications.allSlotsFull') : undefined}>
                            <Button onClick={() => dispatch(initiateGrowFromStrainList(currentStrain))} disabled={!hasAvailableSlots} size="sm" className="hidden sm:inline-flex">{t('strainsView.startGrowing')}</Button>
                        </div>
                        <Button variant="secondary" onClick={() => dispatch(toggleFavorite(currentStrain.id))} aria-pressed={isFavorite} className={`favorite-btn-glow p-2 ${isFavorite ? 'is-favorite' : ''}`}>
                            <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                    {TypeIcon && <TypeIcon className={`w-12 h-12 flex-shrink-0 ${typeClasses[currentStrain.type]}`} />}
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold font-display text-primary-300">{currentStrain.name}</h1>
                        <p className="text-slate-400">{currentStrain.type} {currentStrain.typeDetails && `- ${currentStrain.typeDetails}`}</p>
                    </div>
                </div>
            </header>

            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="mt-6">
                {activeTab === 'overview' && <OverviewTab strain={currentStrain} />}
                {activeTab === 'agronomics' && <AgronomicsTab strain={currentStrain} />}
                {activeTab === 'profile' && <ProfileTab strain={currentStrain} />}
                {activeTab === 'notes' && <NotesTab strain={currentStrain} />}
                {activeTab === 'aiTips' && <StrainAiTips strain={currentStrain} onSaveTip={onSaveTip} />}
            </div>
            
            <SimilarStrainsSection currentStrain={currentStrain} onSelect={setCurrentStrain} />

        </div>
    );
};