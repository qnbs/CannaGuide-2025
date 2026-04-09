import { useRef, useEffect } from 'react'

const FOCUSABLE_SELECTORS =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export const useFocusTrap = (isOpen: boolean) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const previouslyFocusedElement = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (!isOpen || !containerRef.current) return

        previouslyFocusedElement.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null

        const focusableElements = Array.from(
            containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
        )

        let timerId: ReturnType<typeof setTimeout> | undefined

        if (focusableElements.length > 0) {
            // Delay focus to allow for modal transitions
            timerId = setTimeout(() => {
                const firstElement = focusableElements[0]
                firstElement?.focus()
            }, 100)
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab' || !containerRef.current) return

            const focusableContent = Array.from(
                containerRef.current.querySelectorAll(FOCUSABLE_SELECTORS),
            ) as HTMLElement[]

            if (focusableContent.length === 0) {
                e.preventDefault()
                return
            }

            const firstElement = focusableContent[0]
            const lastElement = focusableContent.at(-1)
            const activeElement = document.activeElement

            if (e.shiftKey && activeElement === firstElement) {
                // Shift + Tab
                lastElement?.focus()
                e.preventDefault()
                return
            }

            if (!e.shiftKey && activeElement === lastElement) {
                // Tab
                firstElement?.focus()
                e.preventDefault()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            if (timerId !== undefined) clearTimeout(timerId)
            document.removeEventListener('keydown', handleKeyDown)
            previouslyFocusedElement.current?.focus()
        }
    }, [isOpen])

    return containerRef
}
