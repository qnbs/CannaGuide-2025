import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit'
import type { PayloadAction, EntityState } from '@reduxjs/toolkit'
import type {
    SavedSetup,
    Strain,
    SavedStrainTip,
    StructuredGrowTips,
    SavedExport,
} from '../../types'
import type { RootState } from '../store'
import type { SimpleExportFormat } from '@/components/common/DataExportModal'
import { getT } from '@/i18n'
import { getUISnapshot } from '../useUIStore'
import { normalizeImageDataUrl } from '@/utils/imageDataUrl'

const getExportService = async () => {
    const module = await import('@/services/exportService')
    return module.exportService
}

export const savedSetupsAdapter = createEntityAdapter<SavedSetup>()
export const savedStrainTipsAdapter = createEntityAdapter<SavedStrainTip>()
export const savedExportsAdapter = createEntityAdapter<SavedExport>()

export interface SavedItemsState {
    savedSetups: EntityState<SavedSetup, string>
    savedStrainTips: EntityState<SavedStrainTip, string>
    savedExports: EntityState<SavedExport, string>
}

const initialState: SavedItemsState = {
    savedSetups: savedSetupsAdapter.getInitialState(),
    savedStrainTips: savedStrainTipsAdapter.getInitialState(),
    savedExports: savedExportsAdapter.getInitialState(),
}

export const addSetup = createAsyncThunk<SavedSetup, Omit<SavedSetup, 'id' | 'createdAt'>>(
    'savedItems/addSetup',
    async (setupData, { rejectWithValue }) => {
        const newSetup: SavedSetup = {
            ...setupData,
            id: `setup-${Date.now()}`,
            createdAt: Date.now(),
        }

        try {
            return newSetup
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save setup'
            return rejectWithValue(message)
        }
    },
)

export const exportAndSaveStrains = createAsyncThunk<
    void,
    { strains: Strain[]; format: SimpleExportFormat; fileName: string; sourceDescription: string },
    { state: RootState }
>(
    'savedItems/exportStrains',
    async ({ strains, format, fileName, sourceDescription }, { dispatch }) => {
        const t = getT()
        const exportService = await getExportService()
        try {
            if (format === 'pdf') {
                exportService.exportStrainsAsPdf(strains, fileName, t)
            } else {
                exportService.exportStrainsAsTxt(strains, fileName, t)
            }

            dispatch(
                addExport({
                    name: fileName,
                    format,
                    strainIds: strains.map((s) => s.id),
                    sourceDescription,
                }),
            )

            getUISnapshot().addNotification({
                message: t('common.successfullyExported_other', {
                    count: strains.length,
                    format: format.toUpperCase(),
                }),
                type: 'success',
            })
            getUISnapshot().closeExportModal()
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            getUISnapshot().addNotification({ message, type: 'error' })
            getUISnapshot().closeExportModal()
        }
    },
)

export const exportStrainTips = createAsyncThunk<
    void,
    { tips: SavedStrainTip[]; format: 'pdf' | 'txt'; fileName: string },
    { state: RootState }
>('savedItems/exportStrainTips', async ({ tips, format, fileName }) => {
    const t = getT()
    const exportService = await getExportService()
    exportService.exportStrainTips(tips, format, fileName, t)

    getUISnapshot().addNotification({
        message: t('common.successfullyExported_other', {
            count: tips.length,
            format: format.toUpperCase(),
        }),
        type: 'success',
    })
})

export const exportSetups = createAsyncThunk<
    void,
    { setups: SavedSetup[]; format: 'pdf' | 'txt'; fileName: string },
    { state: RootState }
>('savedItems/exportSetups', async ({ setups, format, fileName }) => {
    const t = getT()
    const exportService = await getExportService()
    if (format === 'pdf') {
        exportService.exportSetupsAsPdf(setups, fileName, t)
    } else {
        exportService.exportSetupsAsTxt(setups, fileName, t)
    }
    getUISnapshot().addNotification({
        message: t('common.successfullyExported_other', {
            count: setups.length,
            format: format.toUpperCase(),
        }),
        type: 'success',
    })
})

const savedItemsSlice = createSlice({
    name: 'savedItems',
    initialState,
    reducers: {
        updateSetup: (state, action: PayloadAction<SavedSetup>) => {
            savedSetupsAdapter.updateOne(state.savedSetups, {
                id: action.payload.id,
                changes: action.payload,
            })
        },
        deleteSetup: (state, action: PayloadAction<string>) => {
            savedSetupsAdapter.removeOne(state.savedSetups, action.payload)
        },
        deleteMultipleSetups: (state, action: PayloadAction<string[]>) => {
            savedSetupsAdapter.removeMany(state.savedSetups, action.payload)
        },
        addStrainTip: (
            state,
            action: PayloadAction<{
                strain: Strain
                tip: StructuredGrowTips
                title: string
                imageUrl?: string | undefined
            }>,
        ) => {
            const { strain, tip, title, imageUrl } = action.payload
            const normalizedImageUrl = normalizeImageDataUrl(imageUrl)
            if (
                !tip ||
                !tip.nutrientTip ||
                !tip.trainingTip ||
                !tip.environmentalTip ||
                !tip.proTip
            ) {
                console.error(
                    '[savedItemsSlice] Attempted to save an empty or invalid structured strain tip. Aborted.',
                )
                return
            }
            const newTip: SavedStrainTip = {
                ...tip,
                id: `tip-${strain.id}-${Date.now()}`,
                createdAt: Date.now(),
                strainId: strain.id,
                strainName: strain.name,
                title,
                imageUrl: normalizedImageUrl,
            }
            savedStrainTipsAdapter.addOne(state.savedStrainTips, newTip)
        },
        updateStrainTip: (state, action: PayloadAction<SavedStrainTip>) => {
            savedStrainTipsAdapter.updateOne(state.savedStrainTips, {
                id: action.payload.id,
                changes: action.payload,
            })
        },
        deleteStrainTip: (state, action: PayloadAction<string>) => {
            savedStrainTipsAdapter.removeOne(state.savedStrainTips, action.payload)
        },
        addExport: (state, action: PayloadAction<Omit<SavedExport, 'id' | 'createdAt'>>) => {
            const newExport: SavedExport = {
                ...action.payload,
                id: `export-${Date.now()}`,
                createdAt: Date.now(),
            }
            savedExportsAdapter.addOne(state.savedExports, newExport)
        },
        updateExport: (state, action: PayloadAction<SavedExport>) => {
            savedExportsAdapter.updateOne(state.savedExports, {
                id: action.payload.id,
                changes: action.payload,
            })
        },
        deleteExport: (state, action: PayloadAction<string>) => {
            savedExportsAdapter.removeOne(state.savedExports, action.payload)
        },
        deleteMultipleExports: (state, action: PayloadAction<string[]>) => {
            savedExportsAdapter.removeMany(state.savedExports, action.payload)
        },
        // For migration
        setSavedSetups: (state, action: PayloadAction<SavedSetup[]>) => {
            savedSetupsAdapter.setAll(state.savedSetups, action.payload)
        },
        setSavedStrainTips: (state, action: PayloadAction<SavedStrainTip[]>) => {
            savedStrainTipsAdapter.setAll(state.savedStrainTips, action.payload)
        },
        setSavedExports: (state, action: PayloadAction<SavedExport[]>) => {
            savedExportsAdapter.setAll(state.savedExports, action.payload)
        },
    },
    extraReducers: (builder) => {
        builder.addCase(addSetup.fulfilled, (state, action) => {
            savedSetupsAdapter.addOne(state.savedSetups, action.payload)
        })
    },
})

export const {
    updateSetup,
    deleteSetup,
    deleteMultipleSetups,
    addStrainTip,
    updateStrainTip,
    deleteStrainTip,
    addExport,
    updateExport,
    deleteExport,
    deleteMultipleExports,
    setSavedSetups,
    setSavedStrainTips,
    setSavedExports,
} = savedItemsSlice.actions

export default savedItemsSlice.reducer
