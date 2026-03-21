/// <reference lib="webworker" />

/**
 * Dedicated Web Worker for SD-Turbo image generation via Transformers.js.
 *
 * Isolates GPU-heavy diffusion work from the main thread to keep the UI
 * responsive during 512×512 image synthesis.
 *
 * Protocol:
 *   Main → Worker: ImageGenWorkerRequest
 *   Worker → Main: ImageGenWorkerResponse (progress updates + final result)
 */

type TransformersModule = typeof import('@xenova/transformers')

interface ImageGenWorkerRequest {
    id: string
    prompt: string
    numSteps: number
    guidanceScale: number
    seed: number | null
    width: number
    height: number
    modelId: string
}

interface ImageGenProgress {
    phase: 'loading' | 'encoding' | 'denoising' | 'decoding' | 'complete'
    percent: number
    elapsedMs: number
}

interface ImageGenWorkerResponse {
    id: string
    result?: {
        dataUrl: string
        latencyMs: number
        backend: string
    }
    progress?: ImageGenProgress
    error?: string
}

let transformersPromise: Promise<TransformersModule> | null = null

const getTransformers = (): Promise<TransformersModule> => {
    if (!transformersPromise) {
        transformersPromise = (async () => {
            const mod = await import('@xenova/transformers')
            if (mod.env?.backends?.onnx?.wasm) {
                mod.env.backends.onnx.wasm.proxy = false
            }
            if (mod.env) {
                mod.env.allowLocalModels = false
            }
            return mod
        })()
    }
    return transformersPromise
}

/** Convert RawImage to base64 PNG data URL using OffscreenCanvas. */
const rawImageToDataUrl = async (rawImage: {
    data: Uint8ClampedArray
    width: number
    height: number
}): Promise<string> => {
    const { width, height, data } = rawImage
    // Prefer OffscreenCanvas in Worker context
    if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')
        if (ctx) {
            // Copy data to a fresh Uint8ClampedArray backed by a plain ArrayBuffer
            // to satisfy the ImageData constructor's type constraint
            const srcBuffer =
                data.buffer instanceof ArrayBuffer ? data.buffer : new ArrayBuffer(data.byteLength)
            const pixels = new Uint8ClampedArray(srcBuffer.slice(0))
            const imageData = new ImageData(pixels, width, height)
            ctx.putImageData(imageData, 0, 0)
            const blob = await canvas.convertToBlob({ type: 'image/png' })
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = () => reject(new Error('Failed to convert blob to data URL'))
                reader.readAsDataURL(blob)
            })
        }
    }
    // Fallback: manual BMP-like encoding (shouldn't normally be needed in modern workers)
    throw new Error('OffscreenCanvas not available in this Worker context')
}

const sendProgress = (
    id: string,
    phase: ImageGenProgress['phase'],
    percent: number,
    startTime: number,
): void => {
    const response: ImageGenWorkerResponse = {
        id,
        progress: {
            phase,
            percent: Math.round(percent),
            elapsedMs: Math.round(performance.now() - startTime),
        },
    }
    self.postMessage(response)
}

self.onmessage = async (e: MessageEvent<ImageGenWorkerRequest>) => {
    const data = e.data
    if (!data?.id || !data?.prompt || !data?.modelId) {
        const response: ImageGenWorkerResponse = {
            id: data?.id ?? 'unknown',
            error: 'Invalid image generation request: id, prompt, and modelId are required',
        }
        self.postMessage(response)
        return
    }

    const { id, prompt, numSteps, guidanceScale, seed, modelId } = data
    const startTime = performance.now()

    try {
        // Phase 1: Load Transformers.js and pipeline
        sendProgress(id, 'loading', 0, startTime)

        const transformers = await getTransformers()

        sendProgress(id, 'loading', 50, startTime)

        // Load the diffusion pipeline
        // SD-Turbo uses AutoPipelineForText2Image in Transformers.js v3
        const pipeline = await (
            transformers as unknown as {
                AutoPipelineForText2Image: {
                    from_pretrained: (
                        modelId: string,
                        options: Record<string, unknown>,
                    ) => Promise<{
                        (
                            prompt: string,
                            options: Record<string, unknown>,
                        ): Promise<{
                            images: Array<{
                                data: Uint8ClampedArray
                                width: number
                                height: number
                            }>
                        }>
                    }>
                }
            }
        ).AutoPipelineForText2Image.from_pretrained(modelId, {
            dtype: 'fp32',
            device: typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm',
            progress_callback: (progress: { status: string; progress?: number }) => {
                if (progress.status === 'progress' && typeof progress.progress === 'number') {
                    sendProgress(id, 'loading', 50 + progress.progress * 0.5, startTime)
                }
            },
        })

        sendProgress(id, 'encoding', 0, startTime)

        // Phase 2-4: Run diffusion
        sendProgress(id, 'denoising', 0, startTime)

        const generateOptions: Record<string, unknown> = {
            num_inference_steps: numSteps,
            guidance_scale: guidanceScale,
            callback: (step: number, total: number) => {
                sendProgress(id, 'denoising', (step / total) * 100, startTime)
            },
        }

        if (seed !== null) {
            generateOptions.seed = seed
        }

        const output = await pipeline(prompt, generateOptions)

        sendProgress(id, 'decoding', 50, startTime)

        // Phase 5: Convert to data URL
        const rawImage = output.images[0]
        if (!rawImage) {
            throw new Error('No image generated — model returned empty output.')
        }
        const dataUrl = await rawImageToDataUrl(rawImage)

        const latencyMs = Math.round(performance.now() - startTime)
        const backend = typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm'

        sendProgress(id, 'complete', 100, startTime)

        const response: ImageGenWorkerResponse = {
            id,
            result: {
                dataUrl,
                latencyMs,
                backend,
            },
        }
        self.postMessage(response)
    } catch (err) {
        const response: ImageGenWorkerResponse = {
            id,
            error: err instanceof Error ? err.message : 'Image generation failed in worker',
        }
        self.postMessage(response)
    }
}
