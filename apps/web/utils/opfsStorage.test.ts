import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isOpfsAvailable, opfsStorage } from './opfsStorage'

describe('opfsStorage', () => {
    describe('isOpfsAvailable', () => {
        it('returns false when navigator.storage.getDirectory is missing', () => {
            const original = navigator.storage
            Object.defineProperty(navigator, 'storage', {
                value: {},
                configurable: true,
            })
            expect(isOpfsAvailable()).toBe(false)
            Object.defineProperty(navigator, 'storage', {
                value: original,
                configurable: true,
            })
        })

        it('returns false when getDirectory is not a function', () => {
            const original = navigator.storage
            Object.defineProperty(navigator, 'storage', {
                value: { getDirectory: 'not-a-function' },
                configurable: true,
            })
            expect(isOpfsAvailable()).toBe(false)
            Object.defineProperty(navigator, 'storage', {
                value: original,
                configurable: true,
            })
        })

        it('returns true when getDirectory is available', () => {
            const original = navigator.storage
            Object.defineProperty(navigator, 'storage', {
                value: { getDirectory: vi.fn() },
                configurable: true,
            })
            expect(isOpfsAvailable()).toBe(true)
            Object.defineProperty(navigator, 'storage', {
                value: original,
                configurable: true,
            })
        })
    })

    describe('singleton export', () => {
        it('exposes all expected methods', () => {
            expect(typeof opfsStorage.isAvailable).toBe('function')
            expect(typeof opfsStorage.write).toBe('function')
            expect(typeof opfsStorage.read).toBe('function')
            expect(typeof opfsStorage.getInfo).toBe('function')
            expect(typeof opfsStorage.delete).toBe('function')
            expect(typeof opfsStorage.list).toBe('function')
            expect(typeof opfsStorage.getCacheSize).toBe('function')
            expect(typeof opfsStorage.clear).toBe('function')
        })
    })

    describe('OPFS operations (mocked)', () => {
        let mockWritable: { write: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> }
        let mockFileHandle: {
            createWritable: ReturnType<typeof vi.fn>
            getFile: ReturnType<typeof vi.fn>
        }
        let mockDirHandle: {
            getFileHandle: ReturnType<typeof vi.fn>
            removeEntry: ReturnType<typeof vi.fn>
            [Symbol.asyncIterator]: ReturnType<typeof vi.fn>
        }

        beforeEach(() => {
            mockWritable = {
                write: vi.fn().mockResolvedValue(undefined),
                close: vi.fn().mockResolvedValue(undefined),
            }
            mockFileHandle = {
                createWritable: vi.fn().mockResolvedValue(mockWritable),
                getFile: vi
                    .fn()
                    .mockResolvedValue({ arrayBuffer: () => new ArrayBuffer(8), size: 8 }),
            }
            mockDirHandle = {
                getFileHandle: vi.fn().mockResolvedValue(mockFileHandle),
                removeEntry: vi.fn().mockResolvedValue(undefined),
                [Symbol.asyncIterator]: vi.fn().mockReturnValue({
                    next: vi
                        .fn()
                        .mockResolvedValueOnce({
                            value: ['model.onnx', mockFileHandle],
                            done: false,
                        })
                        .mockResolvedValue({ done: true }),
                }),
            }

            const mockRoot = {
                getDirectoryHandle: vi.fn().mockResolvedValue(mockDirHandle),
            }

            Object.defineProperty(navigator, 'storage', {
                value: {
                    getDirectory: vi.fn().mockResolvedValue(mockRoot),
                },
                configurable: true,
            })
        })

        it('write stores data via writable stream', async () => {
            const data = new ArrayBuffer(16)
            await opfsStorage.write('test-model', data)
            expect(mockDirHandle.getFileHandle).toHaveBeenCalledWith('test-model', {
                create: true,
            })
            expect(mockWritable.write).toHaveBeenCalledWith(data)
            expect(mockWritable.close).toHaveBeenCalled()
        })

        it('read returns ArrayBuffer for existing file', async () => {
            const result = await opfsStorage.read('test-model')
            expect(result).toBeInstanceOf(ArrayBuffer)
            expect(mockDirHandle.getFileHandle).toHaveBeenCalledWith('test-model')
        })

        it('read returns null when file not found', async () => {
            mockDirHandle.getFileHandle.mockRejectedValueOnce(new Error('NotFoundError'))
            const result = await opfsStorage.read('missing')
            expect(result).toBeNull()
        })

        it('getInfo returns size for existing file', async () => {
            const info = await opfsStorage.getInfo('test-model')
            expect(info).toEqual({ size: 8 })
        })

        it('delete removes entry from directory', async () => {
            const result = await opfsStorage.delete('test-model')
            expect(result).toBe(true)
            expect(mockDirHandle.removeEntry).toHaveBeenCalledWith('test-model')
        })

        it('delete returns false on error', async () => {
            mockDirHandle.removeEntry.mockRejectedValueOnce(new Error('NotFoundError'))
            const result = await opfsStorage.delete('missing')
            expect(result).toBe(false)
        })
    })
})
