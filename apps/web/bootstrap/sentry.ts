import { initSentry } from '@/services/sentryService'

/** Initialize error tracking before any other bootstrap step. */
export const initBootstrapSentry = (): void => {
    initSentry()
}
