import { i18nPromise } from '@/i18n'
import { leaveDesktopServiceWorker, registerServiceWorker } from './serviceWorker'
import { mountHydratedApp } from './mountHydratedApp'

export const startApp = async (): Promise<void> => {
    // A desktop page an older build's worker still controls reloads once without it (#931).
    if (await leaveDesktopServiceWorker()) return
    await i18nPromise
    registerServiceWorker()
    await mountHydratedApp()
}
