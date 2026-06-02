/** IndexedDB / service-worker offline queue action types. */
export const OFFLINE_ACTION_TYPES = {
    ADD_JOURNAL_ENTRY: 'simulation/addJournalEntry',
} as const

export type OfflineActionType = (typeof OFFLINE_ACTION_TYPES)[keyof typeof OFFLINE_ACTION_TYPES]

export const SW_MESSAGE_REPLAY_OFFLINE_ACTION = 'REPLAY_OFFLINE_ACTION' as const
