import { useEffect, useRef, RefObject, useCallback } from 'react'

type Event = MouseEvent | TouchEvent

/**
 * A custom React hook that triggers a callback when a click occurs outside of the referenced element.
 *
 * @param handler - The function to call when an outside click is detected.
 * @returns A ref object to be attached to the element you want to monitor for outside clicks.
 */
export const useOutsideClick = <T extends HTMLElement = HTMLElement>(
    handler: (event: Event) => void,
): RefObject<T | null> => {
    const ref = useRef<T>(null)
    const handlerRef = useRef(handler)
    handlerRef.current = handler

    const stableListener = useCallback((event: Event) => {
        const el = ref.current
        if (!el || (event.target instanceof Node && el.contains(event.target))) {
            return
        }
        handlerRef.current(event)
    }, [])

    useEffect(() => {
        document.addEventListener('mousedown', stableListener)
        document.addEventListener('touchstart', stableListener)

        return () => {
            document.removeEventListener('mousedown', stableListener)
            document.removeEventListener('touchstart', stableListener)
        }
    }, [stableListener])

    return ref
}
