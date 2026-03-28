import { useState, useCallback } from 'react'
import { useEventListener } from '@/hooks/useEventListener'

export const useOnlineStatus = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine)

    useEventListener(
        'offline',
        useCallback(() => setIsOffline(true), []),
    )
    useEventListener(
        'online',
        useCallback(() => setIsOffline(false), []),
    )

    return isOffline
}
