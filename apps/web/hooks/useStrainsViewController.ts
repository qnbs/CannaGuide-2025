import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Strain, StrainViewTab } from '@/types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { strainService } from '@/services/strainService'
import { useStrainFilters } from '@/hooks/useStrainFilters'
import { urlService } from '@/services/urlService'
import { useFiltersStore } from '@/stores/useFiltersStore'
import {
    selectUserStrains,
    selectUserStrainIds,
    selectFavoriteIds,
    selectSettings,
    selectSavedStrainTips,
    selectSavedExports,
    selectSavedExportsCount,
} from '@/stores/selectors'
import { useStrainsViewStore } from '@/stores/useStrainsViewStore'
import { useUIStore, getUISnapshot } from '@/stores/useUIStore'
import {
    toggleFavorite,
    addMultipleToFavorites,
} from '@/stores/slices/favoritesSlice'
import {
    addUserStrainWithValidation,
    updateUserStrainAndCloseModal,
} from '@/stores/slices/userStrainsSlice'
import { exportAndSaveStrains } from '@/stores/slices/savedItemsSlice'
import type { SimpleExportFormat } from '@/components/common/DataExportModal'
import { INITIAL_ADVANCED_FILTERS } from '@/constants'
import {
    getExportSourceTranslationKey,
    computeDrawerFilterCount,
    computeStrainsForCurrentTab,
    computeSortedAromasAndTerpenes,
    getStrainsViewTitles,
} from '@/components/views/strains/strainsViewHelpers'

export function useStrainsViewController() {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const [allStrains, setAllStrains] = useState<Strain[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [_currentPage, setCurrentPage] = useState(1)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
    const [confirmRemoveFavorites, setConfirmRemoveFavorites] = useState(false)

    const settings = useAppSelector(selectSettings)
    const strainsViewState = useStrainsViewStore()
    const strainsViewTab = strainsViewState.strainsViewTab
    const strainsViewMode = strainsViewState.strainsViewMode
    const selectedStrainId = strainsViewState.selectedStrainId
    const selectedStrainIds = useMemo(
        () => strainsViewState.selectedStrainIds,
        [strainsViewState.selectedStrainIds],
    )

    useEffect(() => {
        const mainEl = document.getElementById('main-content')
        if (mainEl) mainEl.scrollTop = 0
    }, [strainsViewTab, selectedStrainId])

    const selectedStrainForDetail = useMemo(
        () => allStrains.find((s) => s.id === selectedStrainId) || null,
        [allStrains, selectedStrainId],
    )
    const rawUserStrains = useAppSelector(selectUserStrains)
    const userStrains = useMemo(() => rawUserStrains ?? [], [rawUserStrains])
    const rawUserStrainIds = useAppSelector(selectUserStrainIds)
    const userStrainIds = useMemo(() => rawUserStrainIds ?? new Set<string>(), [rawUserStrainIds])
    const rawFavoriteIds = useAppSelector(selectFavoriteIds)
    const favoriteIds = useMemo(() => rawFavoriteIds ?? new Set<string>(), [rawFavoriteIds])
    const rawSavedTips = useAppSelector(selectSavedStrainTips)
    const savedTips = useMemo(() => rawSavedTips ?? [], [rawSavedTips])
    const rawSavedExports = useAppSelector(selectSavedExports)
    const savedExports = useMemo(() => rawSavedExports ?? [], [rawSavedExports])
    const savedExportsCount = useAppSelector(selectSavedExportsCount) ?? 0
    const isAddModalOpen = useUIStore((s) => s.isAddModalOpen)
    const isExportModalOpen = useUIStore((s) => s.isExportModalOpen)
    const strainToEdit = useUIStore((s) => s.strainToEdit)
    const selectedIdsSet = useMemo(() => new Set<string>(selectedStrainIds), [selectedStrainIds])

    useEffect(() => {
        const queryString = window.location.search
        if (queryString) {
            const parsedState = urlService.parseQueryStringToFilterState(queryString)
            if (Object.keys(parsedState).length > 0) {
                useFiltersStore.getState().hydrateFilters(parsedState)
            }
        }
    }, [])

    const viewTitles = useMemo(
        () => getStrainsViewTitles(t, savedTips.length, savedExportsCount),
        [t, savedTips.length, savedExportsCount],
    )

    const loadStrains = useCallback(() => {
        strainService
            .getAllStrains()
            .then((strains) => {
                setAllStrains(strains)
                setLoadError(null)
                setIsLoading(false)
            })
            .catch((error: unknown) => {
                console.debug('[StrainsView] Failed to load strains.', error)
                setLoadError(t('strainsView.loadError'))
                setIsLoading(false)
            })
    }, [t])

    useEffect(() => {
        loadStrains()
    }, [loadStrains])

    const { allAromas, allTerpenes } = useMemo(
        () => computeSortedAromasAndTerpenes(allStrains, t),
        [allStrains, t],
    )

    const strainsForCurrentTab = useMemo(
        () => computeStrainsForCurrentTab(strainsViewTab, allStrains, userStrains, favoriteIds),
        [strainsViewTab, allStrains, userStrains, favoriteIds],
    )

    const {
        filteredStrains,
        isSearching,
        searchTerm,
        setSearchTerm,
        typeFilter,
        handleToggleTypeFilter,
        showFavoritesOnly,
        setShowFavoritesOnly,
        advancedFilters,
        setAdvancedFilters,
        letterFilter,
        handleSetLetterFilter,
        resetAllFilters,
        sort,
        handleSort,
        isAnyFilterActive,
        activeFilterCount,
    } = useStrainFilters(strainsForCurrentTab, settings.strainsView)

    useEffect(() => {
        setCurrentPage(1)
    }, [filteredStrains, strainsViewTab])

    const [tempFilterState, setTempFilterState] = useState(advancedFilters)
    useEffect(() => setTempFilterState(advancedFilters), [advancedFilters])

    const countForDrawer = useMemo(
        () =>
            computeDrawerFilterCount(strainsForCurrentTab, {
                searchTerm,
                showFavoritesOnly,
                typeFilter,
                letterFilter,
                favoriteIds,
                tempFilterState,
            }),
        [
            strainsForCurrentTab,
            searchTerm,
            showFavoritesOnly,
            typeFilter,
            letterFilter,
            favoriteIds,
            tempFilterState,
        ],
    )

    const handleApplyFilters = useCallback(() => {
        setAdvancedFilters(tempFilterState)
        setIsDrawerOpen(false)
    }, [setAdvancedFilters, tempFilterState])

    const handleResetFilters = useCallback(() => {
        resetAllFilters()
        setTempFilterState(INITIAL_ADVANCED_FILTERS)
        setIsDrawerOpen(false)
    }, [resetAllFilters])

    const handleOpenDrawer = useCallback(() => setIsDrawerOpen(true), [])
    const handleClearSelection = useCallback(
        () => strainsViewState.clearStrainSelection(),
        [strainsViewState],
    )
    const handleAddSelectedToFavorites = useCallback(
        () => dispatch(addMultipleToFavorites(selectedStrainIds)),
        [dispatch, selectedStrainIds],
    )
    const handleRemoveSelectedFromFavorites = useCallback(
        () => setConfirmRemoveFavorites(true),
        [],
    )
    const isUserStrain = useCallback((id: string) => userStrainIds.has(id), [userStrainIds])
    const handleAddStrain = useCallback(
        (strain: Strain) => dispatch(addUserStrainWithValidation(strain)),
        [dispatch],
    )
    const handleUpdateStrain = useCallback(
        (strain: Strain) => dispatch(updateUserStrainAndCloseModal(strain)),
        [dispatch],
    )
    const handleDeleteUserStrain = useCallback((id: string) => setConfirmDeleteId(id), [])
    const handleBulkDelete = useCallback(() => {
        if (strainsViewTab === StrainViewTab.MyStrains && selectedIdsSet.size > 0) {
            setConfirmBulkDelete(true)
        }
    }, [strainsViewTab, selectedIdsSet.size])
    const handleToggleFavorite = useCallback(
        (id: string) => dispatch(toggleFavorite(id)),
        [dispatch],
    )
    const handleExport = useCallback(
        (format: SimpleExportFormat) => {
            const source = selectedIdsSet.size > 0 ? 'selected' : 'all'
            let dataToExport: Strain[] = filteredStrains
            if (source === 'selected') {
                dataToExport = allStrains.filter((strain) => selectedIdsSet.has(strain.id))
            }
            if (dataToExport.length === 0) {
                getUISnapshot().addNotification({
                    message: t('common.noDataToExport'),
                    type: 'error',
                })
                getUISnapshot().closeExportModal()
                return
            }
            const sourceTranslationKey = getExportSourceTranslationKey(source, dataToExport.length)
            dispatch(
                exportAndSaveStrains({
                    strains: dataToExport,
                    format,
                    fileName: `CannaGuide_Strains_${new Date().toISOString().slice(0, 10)}`,
                    sourceDescription: t(sourceTranslationKey, { count: dataToExport.length }),
                }),
            )
        },
        [dispatch, t, selectedIdsSet, allStrains, filteredStrains],
    )
    const handleSelect = useCallback(
        (strain: Strain) => strainsViewState.setSelectedStrainId(strain.id),
        [strainsViewState],
    )
    const handleToggleSelection = useCallback(
        (id: string) => strainsViewState.toggleStrainSelection(id),
        [strainsViewState],
    )

    return {
        t,
        dispatch,
        strainsViewState,
        strainsViewTab,
        strainsViewMode,
        selectedStrainForDetail,
        viewTitles,
        isLoading,
        loadError,
        loadStrains,
        allStrains,
        userStrains,
        savedTips,
        savedExports,
        savedExportsCount,
        favoriteIds,
        selectedIdsSet,
        selectedStrainIds,
        filteredStrains,
        isSearching,
        searchTerm,
        setSearchTerm,
        sort,
        handleSort,
        letterFilter,
        handleSetLetterFilter,
        typeFilter,
        handleToggleTypeFilter,
        handleOpenDrawer,
        activeFilterCount,
        handleToggleSelection,
        handleSelect,
        handleToggleFavorite,
        isUserStrain,
        handleDeleteUserStrain,
        handleClearSelection,
        handleAddSelectedToFavorites,
        handleRemoveSelectedFromFavorites,
        handleBulkDelete,
        isAddModalOpen,
        isExportModalOpen,
        strainToEdit,
        confirmDeleteId,
        setConfirmDeleteId,
        confirmBulkDelete,
        setConfirmBulkDelete,
        confirmRemoveFavorites,
        setConfirmRemoveFavorites,
        handleAddStrain,
        handleUpdateStrain,
        handleExport,
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
        isAnyFilterActive,
        filteredStrainsLength: filteredStrains.length,
        searchTermForA11y: searchTerm,
    }
}

export type StrainsViewController = ReturnType<typeof useStrainsViewController>
