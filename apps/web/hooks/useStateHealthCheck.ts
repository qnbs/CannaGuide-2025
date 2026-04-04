// ---------------------------------------------------------------------------
// useStateHealthCheck
//
// Development-only hook that detects state inconsistencies between the Redux
// and Zustand layers. Produces console.warn messages in DEV mode and is
// completely tree-shaken in production builds (import.meta.env.DEV guard).
//
// Mount once in AppContainer or the root render tree.
// Has zero render output and zero production overhead.
// ---------------------------------------------------------------------------

import { useEffect } from 'react'
import { useUIStore } from '@/stores/useUIStore'
import { useAppSelector } from '@/stores/store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HealthCheckResult {
    passed: boolean
    message?: string
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/** Verify that onboarding progress is consistent between Redux and Zustand. */
function checkOnboardingSync(reduxCompleted: boolean, zustandStep: number): HealthCheckResult {
    // If Redux marks onboarding as completed but Zustand still shows a mid-flow
    // step (> 0), there may be a stale Zustand hydration.
    if (reduxCompleted && zustandStep > 0) {
        return {
            passed: false,
            message:
                '[StateHealthCheck] Onboarding inconsistency: Redux onboardingCompleted=true ' +
                'but Zustand onboardingStep=' +
                String(zustandStep) +
                '. ' +
                'This may indicate a stale Zustand hydration. ' +
                'Expected onboardingStep=0 when onboarding is complete.',
        }
    }
    return { passed: true }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Development-only state health check hook.
 * Mount it once near the root of the component tree (e.g. AppContainer).
 *
 * In production builds (import.meta.env.DEV === false) this function returns
 * immediately without registering any effects.
 */
export function useStateHealthCheck(): void {
    if (!import.meta.env.DEV) return

    // eslint-disable-next-line react-hooks/rules-of-hooks -- only called in DEV; safe
    const reduxOnboardingCompleted = useAppSelector((s) => s.settings.settings.onboardingCompleted)
    // eslint-disable-next-line react-hooks/rules-of-hooks -- only called in DEV; safe
    const zustandOnboardingStep = useUIStore((s) => s.onboardingStep)

    // eslint-disable-next-line react-hooks/rules-of-hooks -- only called in DEV; safe
    useEffect(() => {
        const result = checkOnboardingSync(reduxOnboardingCompleted, zustandOnboardingStep)
        if (!result.passed && result.message) {
            console.warn(result.message)
        }
    }, [reduxOnboardingCompleted, zustandOnboardingStep])
}
