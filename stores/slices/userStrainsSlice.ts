import { Strain } from '../../types';
import { createSlice, PayloadAction, createEntityAdapter, EntityState } from '@reduxjs/toolkit';

export const userStrainsAdapter = createEntityAdapter<Strain>();

export type UserStrainsState = EntityState<Strain>;

const initialState: UserStrainsState = userStrainsAdapter.getInitialState();

const userStrainsSlice = createSlice({
    name: 'userStrains',
    initialState,
    reducers: {
        addUserStrain: userStrainsAdapter.addOne,
        updateUserStrain: (state, action: PayloadAction<Strain>) => {
            userStrainsAdapter.updateOne(state, { id: action.payload.id, changes: action.payload });
        },
        deleteUserStrain: userStrainsAdapter.removeOne,
        setUserStrains: userStrainsAdapter.setAll,
    }
});


export const { addUserStrain, updateUserStrain, deleteUserStrain, setUserStrains } = userStrainsSlice.actions;
export default userStrainsSlice.reducer;
