import { Strain } from '../../types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserStrainsState {
    userStrains: Strain[];
}

const initialState: UserStrainsState = {
    userStrains: [],
};

const userStrainsSlice = createSlice({
    name: 'userStrains',
    initialState,
    reducers: {
        addUserStrain: (state, action: PayloadAction<Strain>) => {
            // Logic for preventing duplicates should be handled in the component or a thunk
            state.userStrains.push(action.payload);
        },
        updateUserStrain: (state, action: PayloadAction<Strain>) => {
            const index = state.userStrains.findIndex(s => s.id === action.payload.id);
            if (index !== -1) {
                state.userStrains[index] = action.payload;
            }
        },
        deleteUserStrain: (state, action: PayloadAction<string>) => {
            state.userStrains = state.userStrains.filter(s => s.id !== action.payload);
        },
         // For migration purposes
        setUserStrains: (state, action: PayloadAction<Strain[]>) => {
            state.userStrains = action.payload;
        }
    }
});


export const { addUserStrain, updateUserStrain, deleteUserStrain, setUserStrains } = userStrainsSlice.actions;
export default userStrainsSlice.reducer;
