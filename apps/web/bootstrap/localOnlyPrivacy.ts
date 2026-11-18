import type { AppStore, RootState } from '@/stores/store'

/**
 * The local-only privacy step of runPostHydrationServices (bootstrap/postHydration.ts),
 * on its own, for a page that was refused as stale (bootstrap/mountHydratedApp.ts):
 * Sentry starts only after hydration, so a local-only user's stale page must settle it
 * as off (and drop the errors remembered so far) even when no other service starts. Keep it in step with the first
 * block of runPostHydrationServices.
 */
export const applyLocalOnlyPrivacy = async (hydratedStore: AppStore): Promise<void> => {
    const { setLocalOnlyMode } = await import('@/services/localOnlyModeService')
    const localOnly =
        (hydratedStore.getState() as RootState).settings.settings.privacy?.localOnlyMode === true
    setLocalOnlyMode(localOnly)
    if (localOnly) {
        // Settles error reporting as off and drops what was remembered before hydration.
        // A non-local-only stale page does not start Sentry either: it is only a notice
        // until the reload (stopAsStale).
        const { resolveSentryAfterHydration } = await import('@/services/sentryService')
        resolveSentryAfterHydration(true)
    }
}
