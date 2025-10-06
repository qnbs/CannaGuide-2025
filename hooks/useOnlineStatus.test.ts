import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { useOnlineStatus } from './useOnlineStatus';

describe('useOnlineStatus', () => {
  const onlineSpy = vi.spyOn(navigator, 'onLine', 'get');

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return false when online', () => {
    onlineSpy.mockReturnValue(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('should return true when offline', () => {
    onlineSpy.mockReturnValue(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('should update status when online event is fired', () => {
    onlineSpy.mockReturnValue(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current).toBe(false);
  });

  it('should update status when offline event is fired', () => {
    onlineSpy.mockReturnValue(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(true);
  });
});
