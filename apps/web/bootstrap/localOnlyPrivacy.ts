import type { AppStore, RootState } from '@/stores/store'

/**
 * The local-only privacy step of runPostHydrationServices (bootstrap/postHydration.ts),
 * on its own, for a page that was refused as stale (bootstrap/mountHydratedApp.ts):
 * Sentry starts before hydration, so a local-only user's page must switch it off
 * even when none of the other services start. Keep it in step with the first
 * block of runPostHydrationServices.
 */
export const applyLocalOnlyPrivacy = async (hydratedStore: AppStore): Promise<void> => {
    const { setLocalOnlyMode } = await import('@/services/localOnlyModeService')
    const localOnly =
        (hydratedStore.getState() as RootState).settings.settings.privacy?.localOnlyMode === true
    setLocalOnlyMode(localOnly)
    if (localOnly) {
        const { disableSentry } = await import('@/services/sentryService')
        disableSentry()
    }
}
