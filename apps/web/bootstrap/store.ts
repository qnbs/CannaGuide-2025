import { createAppStore, createAppStoreSync, type AppStore } from '@/stores/store'
import { renderAppWithStore } from './render'

export type HydratedStores = {
    shellStore: AppStore
    hydratedStore: AppStore
}

/** Paint shell immediately, then swap in IndexedDB-hydrated Redux state. */
export const hydrateApplicationStores = async (): Promise<HydratedStores> => {
    const shellStore = createAppStoreSync()
    renderAppWithStore(shellStore)

    const hydratedStore = await createAppStore()
    renderAppWithStore(hydratedStore)

    return { shellStore, hydratedStore }
}
