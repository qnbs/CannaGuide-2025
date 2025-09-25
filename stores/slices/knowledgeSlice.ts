import { KnowledgeProgress } from '@/types';
import type { StoreSet } from '@/stores/useAppStore';

export interface KnowledgeSlice {
    knowledgeProgress: KnowledgeProgress;
    toggleKnowledgeProgressItem: (sectionId: string, itemId: string) => void;
}

export const createKnowledgeSlice = (set: StoreSet): KnowledgeSlice => ({
    knowledgeProgress: {},
    toggleKnowledgeProgressItem: (sectionId, itemId) => set(state => {
        const progress = state.knowledgeProgress[sectionId] || [];
        const index = progress.indexOf(itemId);
        if (index > -1) {
            progress.splice(index, 1);
        } else {
            progress.push(itemId);
        }
        state.knowledgeProgress[sectionId] = progress;
    }),
});