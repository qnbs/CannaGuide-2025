import { captureEarlyErrors } from '@/services/sentryService'

/**
 * First bootstrap step. Error reporting itself starts only after hydration, once the
 * saved Local-Only setting is known (resolveSentryAfterHydration); until then uncaught
 * errors are only remembered in memory, so nothing leaves the device early (GH #586).
 */
export const initBootstrapSentry = (): void => {
    captureEarlyErrors()
}
