import React from 'react'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { AddStrainModal } from './AddStrainModal'
import { FilterDrawer } from './FilterDrawer'
import { DataExportModal } from '@/components/common/DataExportModal'
import { getUISnapshot } from '@/stores/useUIStore'
import { deleteUserStrain, deleteMultipleUserStrains } from '@/stores/slices/userStrainsSlice'
import { removeMultipleFromFavorites } from '@/stores/slices/favoritesSlice'
import type { StrainsViewController } from '@/hooks/useStrainsViewController'

type StrainsViewModalsProps = Pick<
    StrainsViewController,
    | 't'
    | 'dispatch'
    | 'strainsViewState'
    | 'isAddModalOpen'
    | 'strainToEdit'
    | 'handleAddStrain'
    | 'handleUpdateStrain'
    | 'confirmDeleteId'
    | 'setConfirmDeleteId'
    | 'userStrains'
    | 'confirmBulkDelete'
    | 'setConfirmBulkDelete'
    | 'selectedIdsSet'
    | 'confirmRemoveFavorites'
    | 'setConfirmRemoveFavorites'
    | 'selectedStrainIds'
    | 'isExportModalOpen'
    | 'handleExport'
    | 'filteredStrains'
    | 'isDrawerOpen'
    | 'setIsDrawerOpen'
    | 'handleApplyFilters'
    | 'handleResetFilters'
    | 'tempFilterState'
    | 'setTempFilterState'
    | 'allAromas'
    | 'allTerpenes'
    | 'countForDrawer'
    | 'showFavoritesOnly'
    | 'setShowFavoritesOnly'
    | 'typeFilter'
    | 'handleToggleTypeFilter'
    | 'isAnyFilterActive'
>

export const StrainsViewModals: React.FC<StrainsViewModalsProps> = ({
    t,
    dispatch,
    strainsViewState,
    isAddModalOpen,
    strainToEdit,
    handleAddStrain,
    handleUpdateStrain,
    confirmDeleteId,
    setConfirmDeleteId,
    userStrains,
    confirmBulkDelete,
    setConfirmBulkDelete,
    selectedIdsSet,
    confirmRemoveFavorites,
    setConfirmRemoveFavorites,
    selectedStrainIds,
    isExportModalOpen,
    handleExport,
    filteredStrains,
    isDrawerOpen,
    setIsDrawerOpen,
    handleApplyFilters,
    handleResetFilters,
    tempFilterState,
    setTempFilterState,
    allAromas,
    allTerpenes,
    countForDrawer,
    showFavoritesOnly,
    setShowFavoritesOnly,
    typeFilter,
    handleToggleTypeFilter,
    isAnyFilterActive,
}) => {
    return (
        <>
            {isAddModalOpen && (
                <AddStrainModal
                    isOpen={true}
                    onClose={() => getUISnapshot().closeAddModal()}
                    onAddStrain={handleAddStrain}
                    onUpdateStrain={handleUpdateStrain}
                    strainToEdit={strainToEdit}
                />
            )}
            <ConfirmModal
                isOpen={confirmDeleteId !== null}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => {
                    if (confirmDeleteId) dispatch(deleteUserStrain(confirmDeleteId))
                }}
                title={t('common.delete')}
                message={t('strainsView.addStrainModal.validation.deleteConfirm', {
                    name: userStrains.find((s) => s.id === confirmDeleteId)?.name ?? '',
                })}
            />
            <ConfirmModal
                isOpen={confirmBulkDelete}
                onClose={() => setConfirmBulkDelete(false)}
                onConfirm={() => {
                    dispatch(deleteMultipleUserStrains(Array.from(selectedIdsSet)))
                    strainsViewState.clearStrainSelection()
                }}
                title={t('common.delete')}
                message={t('strainsView.exportsManager.deleteConfirmPlural_other', {
                    count: selectedIdsSet.size,
                })}
            />
            <ConfirmModal
                isOpen={confirmRemoveFavorites}
                onClose={() => setConfirmRemoveFavorites(false)}
                onConfirm={() => {
                    dispatch(removeMultipleFromFavorites(selectedStrainIds))
                    strainsViewState.clearStrainSelection()
                }}
                title={t('strainsView.bulkActions.removeFromFavorites')}
                message={t('strainsView.bulkActions.removeFavoritesConfirm', {
                    count: selectedIdsSet.size,
                })}
                isDestructive={false}
            />
            {isExportModalOpen && (
                <DataExportModal
                    isOpen={true}
                    onClose={() => getUISnapshot().closeExportModal()}
                    onExport={handleExport}
                    title={t('strainsView.exportModal.title')}
                    selectionCount={selectedIdsSet.size}
                    totalCount={filteredStrains.length}
                    translationBasePath="strainsView.exportModal"
                />
            )}
            <FilterDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                tempFilterState={tempFilterState}
                setTempFilterState={(f) => setTempFilterState((s) => ({ ...s, ...f }))}
                allAromas={allAromas}
                allTerpenes={allTerpenes}
                count={countForDrawer}
                showFavorites={showFavoritesOnly}
                onToggleFavorites={(val) => setShowFavoritesOnly(val)}
                typeFilter={typeFilter}
                onToggleTypeFilter={handleToggleTypeFilter}
                isAnyFilterActive={isAnyFilterActive}
            />
        </>
    )
}
