import { Strain } from '../../types'
import {
    createSlice,
    PayloadAction,
    createEntityAdapter,
    EntityState,
    createAsyncThunk,
} from '@reduxjs/toolkit'
import type { RootState } from '../store'
import { addNotification, closeAddModal } from './uiSlice'
import { getT } from '@/i18n'

export const userStrainsAdapter = createEntityAdapter<Strain>()

export type UserStrainsState = EntityState<Strain, string>

const initialState: UserStrainsState = userStrainsAdapter.getInitialState()

export const addUserStrainWithValidation = createAsyncThunk<void, Strain, { state: RootState }>(
    'userStrains/addUserStrainWithValidation',
    (strain, { dispatch, getState }) => {
        const { userStrains } = getState()
        const existingStrains = userStrainsAdapter.getSelectors().selectAll(userStrains)
        const isDuplicate = existingStrains.some(
            (s) => s.name.toLowerCase() === strain.name.toLowerCase(),
        )

        if (isDuplicate) {
            // FIX: The translation function `t` must be obtained by calling `getT()`.
            const t = getT();
            dispatch(
                addNotification({
                    message: t('strainsView.addStrainModal.validation.duplicate', {
                        name: strain.name,
                    }),
                    type: 'error',
                }),
            )
            return
        }

        dispatch(userStrainsSlice.actions.addUserStrain(strain))
        dispatch(closeAddModal())
    },
)

export const updateUserStrainAndCloseModal = createAsyncThunk<void, Strain, { state: RootState }>(
    'userStrains/updateUserStrainAndCloseModal',
    (strain, { dispatch }) => {
        dispatch(userStrainsSlice.actions.updateUserStrain(strain))
        dispatch(closeAddModal())
    },
)

const userStrainsSlice = createSlice({
    name: 'userStrains',
    initialState,
    reducers: {
        addUserStrain: userStrainsAdapter.addOne,
        updateUserStrain: (state, action: PayloadAction<Strain>) => {
            userStrainsAdapter.updateOne(state, { id: action.payload.id, changes: action.payload })
        },
        deleteUserStrain: userStrainsAdapter.removeOne,
        setUserStrains: userStrainsAdapter.setAll,
    },
})

export const { addUserStrain, updateUserStrain, deleteUserStrain, setUserStrains } =
    userStrainsSlice.actions
export default userStrainsSlice.reducer