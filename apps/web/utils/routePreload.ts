import { View } from '@/types'

type PreloadFn = () => Promise<unknown>

const VIEW_PRELOADERS: Partial<Record<View, PreloadFn>> = {
    [View.Plants]: () => import('@/components/views/PlantsView'),
    [View.Strains]: () =>
        import('@/components/views/strains/StrainsView').then((m) => ({ default: m.StrainsView })),
    [View.Equipment]: () =>
        import('@/components/views/equipment/EquipmentView').then((m) => ({
            default: m.EquipmentView,
        })),
    [View.Knowledge]: () =>
        import('@/components/views/KnowledgeView').then((m) => ({ default: m.KnowledgeView })),
    [View.Settings]: () => import('@/components/views/settings/SettingsView'),
}

/**
 * Preload the default home view and the last active main tab during idle time.
 * Uses `requestIdleCallback` when available; falls back to `setTimeout`.
 */
export const scheduleRoutePreloads = (views: View[]): void => {
    const unique = [...new Set(views)]
    const run = () => {
        for (const view of unique) {
            const loader = VIEW_PRELOADERS[view]
            if (loader) {
                void loader().catch(() => {
                    // Non-fatal — lazy() will load on navigation
                })
            }
        }
    }

    if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(run, { timeout: 4000 })
    } else {
        window.setTimeout(run, 400)
    }
}
