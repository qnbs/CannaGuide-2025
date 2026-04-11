import type { ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

export function ReloadPrompt(): ReactNode | null {
    const { t } = useTranslation()
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW()

    if (!needRefresh) {
        return null
    }

    return (
        <div className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] sm:bottom-4 right-4 z-50 max-w-sm rounded-lg border border-emerald-600/50 bg-slate-900/95 p-4 shadow-xl backdrop-blur-sm">
            <p className="mb-3 text-sm text-slate-200">
                {t('common.pwaUpdate.message', 'Neues Update verfuegbar!')}
            </p>
            <div className="flex gap-2 justify-end">
                <Button variant="primary" size="sm" onClick={() => updateServiceWorker(true)}>
                    {t('common.pwaUpdate.reload', 'Neu laden')}
                </Button>
            </div>
        </div>
    )
}
