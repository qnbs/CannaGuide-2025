import { useEffect, useRef } from 'react'

/**
 * Generic hook for subscribing to DOM events with automatic cleanup.
 *
 * Uses a ref to keep the handler stable across renders, preventing
 * unnecessary re-subscriptions.
 */
export function useEventListener(
    eventName: string,
    handler: (event: Event) => void,
    target?: EventTarget | null,
): void {
    const savedHandler = useRef(handler)

    useEffect(() => {
        savedHandler.current = handler
    }, [handler])

    useEffect(() => {
        const eventTarget = target ?? window
        if (!eventTarget.addEventListener) return

        const listener = (event: Event): void => savedHandler.current(event)
        eventTarget.addEventListener(eventName, listener)

        return () => {
            eventTarget.removeEventListener(eventName, listener)
        }
    }, [eventName, target])
}
