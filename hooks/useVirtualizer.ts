import { useState, useEffect, useCallback, useMemo, useRef, type MutableRefObject } from 'react'

interface UseVirtualizerOptions {
    count: number
    getScrollElement: () => HTMLElement | null
    estimateSize: number
    overscan?: number
}

interface VirtualItem {
    index: number
    offsetTop: number
    height: number
}

const updateMeasuredSize = (
    index: number,
    element: HTMLElement,
    measuredSizes: MutableRefObject<Map<number, number>>,
    onChanged: () => void,
): void => {
    const nextSize = Math.max(1, Math.round(element.getBoundingClientRect().height))
    const previousSize = measuredSizes.current.get(index)
    if (previousSize === nextSize) return
    measuredSizes.current.set(index, nextSize)
    onChanged()
}

const attachElementObserver = (
    index: number,
    element: HTMLElement,
    observers: MutableRefObject<Map<number, ResizeObserver>>,
    measuredSizes: MutableRefObject<Map<number, number>>,
    onChanged: () => void,
): void => {
    const observer = new ResizeObserver(() => {
        updateMeasuredSize(index, element, measuredSizes, onChanged)
    })
    observer.observe(element)
    observers.current.set(index, observer)
}

export const useVirtualizer = ({
    count,
    getScrollElement,
    estimateSize,
    overscan = 5,
}: UseVirtualizerOptions) => {
    const [scrollTop, setScrollTop] = useState(0)
    const [containerHeight, setContainerHeight] = useState(0)
    const [measureVersion, setMeasureVersion] = useState(0)
    const measuredSizesRef = useRef(new Map<number, number>())
    const observersRef = useRef(new Map<number, ResizeObserver>())
    const getScrollElementRef = useRef(getScrollElement)
    const refCallbacksRef = useRef(new Map<number, (element: HTMLElement | null) => void>())

    useEffect(() => {
        getScrollElementRef.current = getScrollElement
    }, [getScrollElement])

    const handleScroll = useCallback(() => {
        const scrollElement = getScrollElementRef.current()
        if (scrollElement) {
            setScrollTop(scrollElement.scrollTop)
        }
    }, [])

    useEffect(() => {
        const scrollElement = getScrollElementRef.current()
        if (scrollElement) {
            const updateContainerHeight = () => setContainerHeight(scrollElement.clientHeight)

            updateContainerHeight()
            scrollElement.addEventListener('scroll', handleScroll, { passive: true })

            // Also update on resize
            const resizeObserver = new ResizeObserver(updateContainerHeight)
            resizeObserver.observe(scrollElement)

            return () => {
                scrollElement.removeEventListener('scroll', handleScroll)
                resizeObserver.unobserve(scrollElement)
            }
        }
    }, [handleScroll])

    useEffect(
        () => () => {
            observersRef.current.forEach((observer) => observer.disconnect())
            observersRef.current.clear()
            measuredSizesRef.current.clear()
        },
        [],
    )

    const measureElement = useCallback((index: number) => {
        const cachedRef = refCallbacksRef.current.get(index)
        if (cachedRef) {
            return cachedRef
        }

        const refCallback = (element: HTMLElement | null) => {
            const existingObserver = observersRef.current.get(index)
            if (existingObserver) {
                existingObserver.disconnect()
                observersRef.current.delete(index)
            }

            if (!element) {
                return
            }

            const notifySizeChange = () => {
                setMeasureVersion((version) => version + 1)
            }

            updateMeasuredSize(index, element, measuredSizesRef, notifySizeChange)
            attachElementObserver(index, element, observersRef, measuredSizesRef, notifySizeChange)
        }

        refCallbacksRef.current.set(index, refCallback)
        return refCallback
    }, [])

    const { virtualItems, totalSize } = useMemo(() => {
        const resolvedSizes = Array.from(
            { length: count },
            (_, index) => measuredSizesRef.current.get(index) ?? estimateSize,
        )
        const offsets = new Array<number>(count + 1)
        offsets[0] = 0

        for (let index = 0; index < count; index += 1) {
            offsets[index + 1] = (offsets[index] ?? 0) + (resolvedSizes[index] ?? estimateSize)
        }

        const totalSize = offsets[count] ?? 0

        const findIndexForOffset = (offset: number) => {
            let low = 0
            let high = count
            while (low < high) {
                const mid = Math.floor((low + high) / 2)
                if ((offsets[mid + 1] ?? 0) <= offset) {
                    low = mid + 1
                } else {
                    high = mid
                }
            }
            return Math.min(low, Math.max(0, count - 1))
        }

        const startIndex = Math.max(0, findIndexForOffset(scrollTop) - overscan)
        const endIndex = Math.min(
            count - 1,
            findIndexForOffset(scrollTop + containerHeight) + overscan,
        )

        const items: VirtualItem[] = []
        for (let index = startIndex; index <= endIndex; index += 1) {
            items.push({
                index,
                offsetTop: offsets[index] ?? 0,
                height: resolvedSizes[index] ?? estimateSize,
            })
        }

        return { virtualItems: items, totalSize }
        // measureVersion triggers recalculation when element sizes are measured via ResizeObserver
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count, estimateSize, scrollTop, overscan, containerHeight, measureVersion])

    return {
        virtualItems,
        totalSize,
        measureElement,
    }
}
