import React, { useState, memo } from 'react';
import { SavedSetup } from '@/types';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { EditSetupModal } from './EditSetupModal';
import { SetupCard } from './SetupCard';

interface SavedSetupsViewProps {
    savedSetups: SavedSetup[];
    updateSetup: (updatedSetup: SavedSetup) => void;
    deleteSetup: (setupId: string) => void;
}

const SavedSetupsViewComponent: React.FC<SavedSetupsViewProps> = ({ savedSetups, updateSetup, deleteSetup }) => {
    const { t } = useTranslation();
    const [editingSetup, setEditingSetup] = useState<SavedSetup | null>(null);

    const handleUpdateSave = (updatedSetup: SavedSetup) => {
        updateSetup(updatedSetup);
        setEditingSetup(null);
    };

    const sortedSetups = [...savedSetups].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div>
            {editingSetup && (
                <EditSetupModal
                    setup={editingSetup}
                    onClose={() => setEditingSetup(null)}
                    onSave={handleUpdateSave}
                />
            )}
            <h2 className="text-2xl font-bold text-primary-400 mb-4">{t('equipmentView.tabs.setups')}</h2>
            {sortedSetups.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                    <PhosphorIcons.ArchiveBox className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="font-semibold">{t('equipmentView.savedSetups.noSetups.title')}</h3>
                    <p className="text-sm">{t('equipmentView.savedSetups.noSetups.subtitle')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedSetups.map(setup => (
                        <SetupCard
                            key={setup.id}
                            setup={setup}
                            onEdit={() => setEditingSetup(setup)}
                            onDelete={() => {
                                if (window.confirm(t('equipmentView.savedSetups.deleteConfirm'))) {
                                    deleteSetup(setup.id);
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const SavedSetupsView = memo(SavedSetupsViewComponent);