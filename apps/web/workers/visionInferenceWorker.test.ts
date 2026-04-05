import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Imports (module-level globals are only used inside function bodies,
// so importing before stubs are set is safe -- the stubs must be in place
// before calling preprocessImage() in a test body, not at import time.)
// ---------------------------------------------------------------------------

import { mapToCannabisTerm, preprocessImage } from '@/workers/visionInferenceWorker'

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
})
