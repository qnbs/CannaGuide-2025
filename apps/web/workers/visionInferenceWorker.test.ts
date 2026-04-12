import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Imports (module-level globals are only used inside function bodies,
// so importing before stubs are set is safe -- the stubs must be in place
// before calling preprocessImage() in a test body, not at import time.)
// ---------------------------------------------------------------------------

import {
    autoWhiteBalance,
    mapToCannabisTerm,
    preprocessImage,
} from '@/workers/visionInferenceWorker'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('visionInferenceWorker utilities', () => {
    // ---- mapToCannabisTerm --------------------------------------------------

    describe('mapToCannabisTerm', () => {
        it('maps a known PlantVillage label to the correct cannabis term', () => {
            expect(mapToCannabisTerm('Tomato___Spider_mites Two-spotted_spider_mite')).toBe(
                'spider_mites',
            )
        })

        it('applies fallback strip-prefix normalisation for unmapped labels', () => {
            // Expected: strip 'Unknown___', replace spaces with _, lowercase
            expect(mapToCannabisTerm('Unknown___Some_Disease')).toBe('some_disease')
        })
    })

    // ---- preprocessImage ----------------------------------------------------

    describe('preprocessImage', () => {
        const SIZE = 224

        beforeAll(() => {
            // Use ES6 classes (not arrow functions) as mock constructors.
            // Arrow functions cannot be called with `new`, so vi.fn().mockImplementation
            // with an arrow function would fail with "is not a constructor".
            const whitePixels = new Uint8ClampedArray(SIZE * SIZE * 4).fill(255)
            const mockCtx = {
                putImageData: (_d: unknown, _x: number, _y: number) => {
                    /* no-op */
                },
                drawImage: (..._args: unknown[]) => {
                    /* no-op */
                },
                getImageData: (_x: number, _y: number, _w: number, _h: number) => ({
                    data: whitePixels,
                    width: SIZE,
                    height: SIZE,
                }),
            }

            class MockOffscreenCanvas {
                getContext(_type: string) {
                    return mockCtx
                }
            }
            class MockImageData {
                data: Uint8ClampedArray
                width: number
                height: number
                constructor(data: Uint8ClampedArray, w: number, h: number) {
                    this.data = data
                    this.width = w
                    this.height = h
                }
            }

            vi.stubGlobal('OffscreenCanvas', MockOffscreenCanvas)
            vi.stubGlobal('ImageData', MockImageData)
        })

        afterAll(() => {
            vi.unstubAllGlobals()
        })

        it('produces Float32Array of correct shape with all values in ImageNet range', () => {
            const src = {
                data: new Uint8ClampedArray(4 * 4 * 4).fill(255),
                width: 4,
                height: 4,
            }
            const tensor = preprocessImage(src)

            expect(tensor).toBeInstanceOf(Float32Array)
            expect(tensor.length).toBe(3 * SIZE * SIZE)

            // ImageNet-normalised white pixel: (1 - mean) / std.
            // R: (1-0.485)/0.229 ~ 2.25   G: (1-0.456)/0.224 ~ 2.43   B: (1-0.406)/0.225 ~ 2.64
            // All should be within [-3, 3] for any pixel value [0, 255].
            for (let i = 0; i < tensor.length; i++) {
                const v = tensor[i] ?? 0
                expect(v).toBeGreaterThanOrEqual(-3)
                expect(v).toBeLessThanOrEqual(3)
            }
        })
    })

    // ---- autoWhiteBalance ---------------------------------------------------

    describe('autoWhiteBalance', () => {
        beforeAll(() => {
            class MockImageData {
                data: Uint8ClampedArray
                width: number
                height: number
                constructor(data: Uint8ClampedArray, w: number, h: number) {
                    this.data = data
                    this.width = w
                    this.height = h
                }
            }
            vi.stubGlobal('ImageData', MockImageData)
        })

        afterAll(() => {
            vi.unstubAllGlobals()
        })

        it('neutralises a strong red/purple LED tint towards equal channels', () => {
            // Simulate 2x2 image with heavy red/purple cast (LED grow light)
            // R=200, G=60, B=120 -> strong red bias
            const data = new Uint8ClampedArray(2 * 2 * 4)
            for (let i = 0; i < 4; i++) {
                data[i * 4] = 200 // R
                data[i * 4 + 1] = 60 // G
                data[i * 4 + 2] = 120 // B
                data[i * 4 + 3] = 255 // A
            }
            const input = { data, width: 2, height: 2 } as ImageData

            const result = autoWhiteBalance(input)

            // After white balance, all channels should converge toward the same avg
            // The global average is (200+60+120)/3 = ~126.67
            // R should decrease, G should increase, B should stay similar
            const r = result.data[0] ?? 0
            const g = result.data[1] ?? 0
            const b = result.data[2] ?? 0

            // Channels should be much closer to each other than the original
            const spread = Math.max(r, g, b) - Math.min(r, g, b)
            const originalSpread = 200 - 60 // 140
            expect(spread).toBeLessThan(originalSpread / 2)

            // All values should equal ~127 (the global mean)
            expect(r).toBeGreaterThanOrEqual(120)
            expect(r).toBeLessThanOrEqual(135)
            expect(g).toBeGreaterThanOrEqual(120)
            expect(g).toBeLessThanOrEqual(135)
            expect(b).toBeGreaterThanOrEqual(120)
            expect(b).toBeLessThanOrEqual(135)
        })

        it('preserves alpha channel unchanged', () => {
            const data = new Uint8ClampedArray([100, 150, 200, 128])
            const input = { data, width: 1, height: 1 } as ImageData

            const result = autoWhiteBalance(input)
            expect(result.data[3]).toBe(128)
        })

        it('returns input unchanged for near-black images', () => {
            const data = new Uint8ClampedArray([0, 0, 0, 255])
            const input = { data, width: 1, height: 1 } as ImageData

            const result = autoWhiteBalance(input)
            expect(result.data[0]).toBe(0)
            expect(result.data[1]).toBe(0)
            expect(result.data[2]).toBe(0)
        })

        it('leaves neutral images mostly unchanged', () => {
            // Gray image: R=G=B=128 -> no correction needed
            const data = new Uint8ClampedArray(4 * 4 * 4)
            for (let i = 0; i < 16; i++) {
                data[i * 4] = 128
                data[i * 4 + 1] = 128
                data[i * 4 + 2] = 128
                data[i * 4 + 3] = 255
            }
            const input = { data, width: 4, height: 4 } as ImageData

            const result = autoWhiteBalance(input)
            expect(result.data[0]).toBe(128)
            expect(result.data[1]).toBe(128)
            expect(result.data[2]).toBe(128)
        })
    })
})
