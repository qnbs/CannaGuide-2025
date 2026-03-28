import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAsync } from './useAsync'

describe('useAsync', () => {
    it('starts loading when enabled', () => {
        const asyncFn = vi.fn(() => new Promise<string>(() => {}))
        const { result } = renderHook(() => useAsync(asyncFn, [], true))
        expect(result.current.isLoading).toBe(true)
        expect(result.current.error).toBeNull()
        expect(result.current.data).toBeNull()
    })

    it('resolves with data', async () => {
        const asyncFn = vi.fn(async () => 42)
        const { result } = renderHook(() => useAsync(asyncFn, [], true))

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })
        expect(result.current.data).toBe(42)
        expect(result.current.error).toBeNull()
    })

    it('handles rejection and sets error', async () => {
        const asyncFn = vi.fn(async () => {
            throw new Error('boom')
        })
        const { result } = renderHook(() => useAsync(asyncFn, [], true))

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })
        expect(result.current.error).toBe('boom')
        expect(result.current.data).toBeNull()
    })

    it('does not run when enabled is false', () => {
        const asyncFn = vi.fn(async () => 'result')
        const { result } = renderHook(() => useAsync(asyncFn, [], false))
        expect(asyncFn).not.toHaveBeenCalled()
        expect(result.current.isLoading).toBe(false)
        expect(result.current.data).toBeNull()
    })

    it('cancels stale calls on unmount', async () => {
        let resolveFn: (v: string) => void
        const asyncFn = vi.fn(
            () =>
                new Promise<string>((resolve) => {
                    resolveFn = resolve
                }),
        )
        const { result, unmount } = renderHook(() => useAsync(asyncFn, [], true))

        expect(result.current.isLoading).toBe(true)
        unmount()

        // Resolving after unmount should not cause state updates
        resolveFn!('late')
        await new Promise((r) => setTimeout(r, 10))
    })
})
