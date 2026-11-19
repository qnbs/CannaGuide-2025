import type { AppStore, RootState } from '@/stores/store'

/**
 * The local-only privacy step of runPostHydrationServices (bootstrap/postHydration.ts),
 * on its own, for a page that was refused as stale (bootstrap/mountHydratedApp.ts): no
 * other service starts on such a page, but the code it has already loaded must still
 * read the user's saved Local-Only setting. Keep it in step with the first block of
 * runPostHydrationServices.
 */
export const applyLocalOnlyPrivacy = async (hydratedStore: AppStore): Promise<void> => {
    const { setLocalOnlyMode } = await import('@/services/localOnlyModeService')
    const localOnly =
        (hydratedStore.getState() as RootState).settings.settings.privacy?.localOnlyMode === true
    setLocalOnlyMode(localOnly)
}
