import { i18nPromise } from '@/i18n'
import { registerServiceWorker } from './serviceWorker'
import { mountHydratedApp } from './mountHydratedApp'

export const startApp = async (): Promise<void> => {
    await i18nPromise
    registerServiceWorker()
    await mountHydratedApp()
}
