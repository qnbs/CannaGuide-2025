import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { StrainViewTab } from '@/types'

export interface StrainsViewState {
    strainsViewTab: StrainViewTab
    strainsViewMode: 'list' | 'grid'
    selectedStrainIds: string[]
    selectedStrainId: string | null
}

export interface StrainsViewActions {
    setStrainsViewState: (state: StrainsViewState) => void
    setStrainsViewTab: (tab: StrainViewTab) => void
    setSelectedStrainId: (id: string | null) => void
    setStrainsViewMode: (mode: 'list' | 'grid') => void
    toggleStrainSelection: (id: string) => void
    toggleAllStrainSelection: (ids: string[]) => void
    clearStrainSelection: () => void
}

const initialState: StrainsViewState = {
    strainsViewTab: StrainViewTab.All,
    strainsViewMode: 'list',
    selectedStrainIds: [],
    selectedStrainId: null,
}

export const useStrainsViewStore = create<StrainsViewState & StrainsViewActions>()(
    subscribeWithSelector((set) => ({
        ...initialState,

        setStrainsViewState: (state) => set(state),

        setStrainsViewTab: (tab) =>
            set({ strainsViewTab: tab, selectedStrainIds: [], selectedStrainId: null }),

        setSelectedStrainId: (id) => set({ selectedStrainId: id }),

        setStrainsViewMode: (mode) => set({ strainsViewMode: mode }),

        toggleStrainSelection: (id) =>
            set((state) => {
                const s = new Set(state.selectedStrainIds)
                if (s.has(id)) {
                    s.delete(id)
                } else {
                    s.add(id)
                }
                return { selectedStrainIds: Array.from(s) }
            }),

        toggleAllStrainSelection: (ids) =>
            set((state) => {
                const current = new Set(state.selectedStrainIds)
                const allSelected = ids.every((id) => current.has(id))
                if (allSelected) {
                    ids.forEach((id) => current.delete(id))
                } else {
                    ids.forEach((id) => current.add(id))
                }
                return { selectedStrainIds: Array.from(current) }
            }),

        clearStrainSelection: () => set({ selectedStrainIds: [] }),
    })),
)
