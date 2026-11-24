import { i18nPromise } from '@/i18n'
import { leaveDesktopServiceWorker, registerServiceWorker } from './serviceWorker'
import { mountHydratedApp } from './mountHydratedApp'

/** How long a desktop start waits for its one-time reload before it goes on without it. */
export const DESKTOP_RELOAD_FALLBACK_MS = 4000

export const startApp = async (): Promise<void> => {
    // A desktop page an older build's worker still controls reloads once without it (#931).
    // The reload is asynchronous; if it never happens, the window must not stay blank, so
    // the start goes on after a while. A page that did reload never reaches the timer.
    if (await leaveDesktopServiceWorker()) {
        await new Promise((resolve) => setTimeout(resolve, DESKTOP_RELOAD_FALLBACK_MS))
    }
    await i18nPromise
    registerServiceWorker()
    await mountHydratedApp()
}
