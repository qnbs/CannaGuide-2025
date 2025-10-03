import { useEffect, useRef, RefObject } from 'react'

type Event = MouseEvent | TouchEvent

/**
 * A custom React hook that triggers a callback when a click occurs outside of the referenced element.
 *
 * @param handler - The function to call when an outside click is detected.
 * @returns A ref object to be attached to the element you want to monitor for outside clicks.
 */
export const useOutsideClick = <T extends HTMLElement = HTMLElement>(
    handler: (event: Event) => void
): RefObject<T> => {
    const ref = useRef<T>(null)

    useEffect(() => {
        const listener = (event: Event) => {
            const el = ref.current
            // Do nothing if clicking ref's element or descendent elements
            if (!el || el.contains(event.target as Node)) {
                return
            }
            handler(event)
        }

        document.addEventListener('mousedown', listener)
        document.addEventListener('touchstart', listener)

        return () => {
            document.removeEventListener('mousedown', listener)
            document.removeEventListener('touchstart', listener)
        }
    }, [ref, handler]) // Reload only if ref or handler changes

    return ref
}
