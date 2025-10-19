import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseVirtualizerOptions {
  count: number;
  getScrollElement: () => HTMLElement | null;
  estimateSize: number;
  overscan?: number;
}

export const useVirtualizer = ({
  count,
  getScrollElement,
  estimateSize,
  overscan = 5,
}: UseVirtualizerOptions) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollElement = getScrollElement();
    if (scrollElement) {
      setScrollTop(scrollElement.scrollTop);
    }
  }, [getScrollElement]);

  useEffect(() => {
    const scrollElement = getScrollElement();
    if (scrollElement) {
      const updateContainerHeight = () => setContainerHeight(scrollElement.clientHeight);
      
      updateContainerHeight();
      handleScroll(); // initial measurement
      
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      
      // Also update on resize
      const resizeObserver = new ResizeObserver(updateContainerHeight);
      resizeObserver.observe(scrollElement);

      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        resizeObserver.unobserve(scrollElement);
      };
    }
  }, [handleScroll, getScrollElement]);

  const { virtualItems, totalSize } = useMemo(() => {
    const totalSize = count * estimateSize;

    const startIndex = Math.max(0, Math.floor(scrollTop / estimateSize) - overscan);
    const endIndex = Math.min(
      count - 1,
      startIndex + Math.ceil(containerHeight / estimateSize) + 2 * overscan
    );
    
    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        offsetTop: i * estimateSize,
        height: estimateSize,
      });
    }
    return { virtualItems: items, totalSize };
  }, [count, estimateSize, scrollTop, overscan, containerHeight]);

  return {
    virtualItems,
    totalSize,
  };
};
