// ---------------------------------------------------------------------------
// Porcupine Wake-Word Detection Service (v1.8 CannaVoice Pro)
// ---------------------------------------------------------------------------
// Provides WASM-based on-device wake-word detection via @picovoice/porcupine-web.
// 100% offline, no data leaves the device. BYOK AccessKey required.
// Falls back to regex hotword when unavailable or unconfigured.
// ---------------------------------------------------------------------------

import * as Sentry from '@sentry/browser'

// Lazy-loaded Porcupine types (optional dependency)
type PorcupineWorker = {
    start: () => Promise<void>
    stop: () => Promise<void>
    release: () => Promise<void>
}

type PorcupineDetectionCallback = (detection: { label: string; index: number }) => void

/** Porcupine service state. */
export type PorcupineState = 'uninitialized' | 'ready' | 'listening' | 'error' | 'disposed'

/** Callback invoked when wake-word is detected. */
export type WakeWordCallback = () => void

class PorcupineWakeWordService {
    private worker: PorcupineWorker | null = null
    private state: PorcupineState = 'uninitialized'
    private onWakeWordDetected: WakeWordCallback | null = null
    private initPromise: Promise<boolean> | null = null

    /** Current engine state. */
    getState(): PorcupineState {
        return this.state
    }

    /** Whether porcupine-web SDK could be loaded at all. */
    isAvailable(): boolean {
        return this.state === 'ready' || this.state === 'listening'
    }

    /** Register callback for wake-word detection. */
    setCallback(callback: WakeWordCallback): void {
        this.onWakeWordDetected = callback
    }

    /**
     * Init Porcupine WASM engine with user-provided access key and keyword.
     * Returns true on success, false on failure (lazy-load fail, bad key, etc.)
     */
    async init(accessKey: string, keyword: string): Promise<boolean> {
        if (this.state === 'ready' || this.state === 'listening') return true
        if (this.initPromise) return this.initPromise

        this.initPromise = this.doInit(accessKey, keyword)
        const success = await this.initPromise
        this.initPromise = null
        return success
    }

    private async doInit(accessKey: string, keyword: string): Promise<boolean> {
        try {
            // Dynamic import -- packages are optionalDependencies, may not be installed
            const [porcupineModule, processorModule] = await Promise.all([
                import('@picovoice/porcupine-web'),
                import('@picovoice/web-voice-processor'),
            ])

            const { PorcupineWorker: PorcupineWorkerCtor, BuiltInKeyword } = porcupineModule
            const { WebVoiceProcessor } = processorModule

            // Resolve built-in keyword enum value
            const kwEnum =
                BuiltInKeyword[keyword as keyof typeof BuiltInKeyword] ??
                BuiltInKeyword.COMPUTER ??
                'COMPUTER'

            const detectionCallback: PorcupineDetectionCallback = (detection) => {
                if (detection.index >= 0) {
                    this.onWakeWordDetected?.()
                }
            }

            const processErrorCallback = (error: Error): void => {
                console.error('[Porcupine] Processing error:', error.message)
                Sentry.captureException(error, { tags: { service: 'porcupine' } })
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- SDK dynamic import
            this.worker = (await PorcupineWorkerCtor.create(
                accessKey,
                [{ builtin: kwEnum, sensitivity: 0.65 }],
                detectionCallback,
                { processErrorCallback },
            )) as unknown as PorcupineWorker

            // Register with WebVoiceProcessor for mic -> PCM pipeline
            await WebVoiceProcessor.subscribe(this.worker)

            this.state = 'ready'
            return true
        } catch (err) {
            this.state = 'error'
            console.error('[Porcupine] Init failed:', err instanceof Error ? err.message : err)
            Sentry.captureException(err, { tags: { service: 'porcupine' } })
            return false
        }
    }

    /** Start listening for wake-word. */
    async start(): Promise<void> {
        if (this.state !== 'ready') return
        try {
            await this.worker?.start()
            this.state = 'listening'
        } catch (err) {
            console.error('[Porcupine] Start failed:', err instanceof Error ? err.message : err)
            this.state = 'error'
        }
    }

    /** Stop listening (keeps resources allocated). */
    async stop(): Promise<void> {
        if (this.state !== 'listening') return
        try {
            await this.worker?.stop()
            this.state = 'ready'
        } catch (err) {
            console.error('[Porcupine] Stop failed:', err instanceof Error ? err.message : err)
        }
    }

    /** Full cleanup -- release all resources. */
    async dispose(): Promise<void> {
        try {
            if (this.worker) {
                // Unsubscribe from WebVoiceProcessor
                try {
                    const { WebVoiceProcessor } = await import('@picovoice/web-voice-processor')
                    await WebVoiceProcessor.unsubscribe(this.worker)
                } catch {
                    // SDK may not be loaded -- ignore
                }
                await this.worker.release()
                this.worker = null
            }
        } catch (err) {
            console.error('[Porcupine] Dispose error:', err instanceof Error ? err.message : err)
        } finally {
            this.state = 'disposed'
            this.onWakeWordDetected = null
        }
    }
}

/** Singleton Porcupine wake-word service. */
export const porcupineWakeWordService = new PorcupineWakeWordService()
