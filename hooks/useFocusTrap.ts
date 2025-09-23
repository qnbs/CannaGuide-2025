import { useRef, useEffect } from 'react';

const FOCUSABLE_SELECTORS = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const useFocusTrap = (isOpen: boolean) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            previouslyFocusedElement.current = document.activeElement as HTMLElement;

            const focusableElements = Array.from(
                containerRef.current.querySelectorAll(FOCUSABLE_SELECTORS)
            ) as HTMLElement[];

            if (focusableElements.length > 0) {
                // Delay focus to allow for modal transitions
                setTimeout(() => {
                    const firstElement = focusableElements[0];
                    firstElement?.focus();
                }, 100);
            }

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key !== 'Tab' || !containerRef.current) return;

                const focusableContent = Array.from(
                    containerRef.current.querySelectorAll(FOCUSABLE_SELECTORS)
                ) as HTMLElement[];

                if (focusableContent.length === 0) {
                    e.preventDefault();
                    return;
                }

                const firstElement = focusableContent[0];
                const lastElement = focusableContent[focusableContent.length - 1];
                const activeElement = document.activeElement;

                if (e.shiftKey) { // Shift + Tab
                    if (activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else { // Tab
                    if (activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            };

            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                previouslyFocusedElement.current?.focus();
            };
        }
    }, [isOpen]);

    return containerRef;
};