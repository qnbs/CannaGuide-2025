import { describe, it, expect, beforeEach } from 'vitest'
import { storageService } from '@/services/storageService'
import { STORAGE_PREFIX } from '@/constants'

describe('StorageService', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    describe('setItem / getItem', () => {
        it('stores and retrieves a string value', () => {
            storageService.setItem('test-key', 'hello')
            expect(storageService.getItem('test-key', '')).toBe('hello')
        })

        it('stores and retrieves an object', () => {
            const obj = { foo: 'bar', num: 42 }
            storageService.setItem('obj-key', obj)
            expect(storageService.getItem('obj-key', {})).toEqual(obj)
        })

        it('stores and retrieves an array', () => {
            const arr = [1, 2, 3]
            storageService.setItem('arr-key', arr)
            expect(storageService.getItem('arr-key', [])).toEqual(arr)
        })

        it('returns default value for missing key', () => {
            expect(storageService.getItem('missing', 'default')).toBe('default')
        })

        it('stores with STORAGE_PREFIX in localStorage', () => {
            storageService.setItem('prefixed', 'value')
            const raw = localStorage.getItem(`${STORAGE_PREFIX}prefixed`)
            expect(raw).toBe('"value"')
        })

        it('stores numeric values', () => {
            storageService.setItem('num', 123)
            expect(storageService.getItem('num', 0)).toBe(123)
        })

        it('stores boolean values', () => {
            storageService.setItem('bool', true)
            expect(storageService.getItem('bool', false)).toBe(true)
        })
    })

    describe('removeItem', () => {
        it('removes an item from storage', () => {
            storageService.setItem('toRemove', 'value')
            storageService.removeItem('toRemove')
            expect(storageService.getItem('toRemove', 'default')).toBe('default')
        })

        it('does not throw when removing non-existent key', () => {
            expect(() => storageService.removeItem('nonexistent')).not.toThrow()
        })
    })

    describe('clearAll', () => {
        it('clears all localStorage data', () => {
            storageService.setItem('a', 1)
            storageService.setItem('b', 2)
            storageService.clearAll()
            expect(storageService.getItem('a', 'default')).toBe('default')
            expect(storageService.getItem('b', 'default')).toBe('default')
        })
    })
})
