// ---------------------------------------------------------------------------
// Ambient type declarations for Porcupine WASM packages (optional dependencies)
// ---------------------------------------------------------------------------
// These packages are declared as optionalDependencies and stubbed by
// optionalMlPlugin() in vite.config.ts when not installed.
// ---------------------------------------------------------------------------

declare module '@picovoice/porcupine-web' {
    export const BuiltInKeyword: Record<string, string>

    export const PorcupineWorker: {
        create: (
            accessKey: string,
            keywords: Array<{ builtin: string; sensitivity?: number }>,
            detectionCallback: (detection: { label: string; index: number }) => void,
            options?: { processErrorCallback?: (error: Error) => void },
        ) => Promise<unknown>
    }
}

declare module '@picovoice/web-voice-processor' {
    export const WebVoiceProcessor: {
        subscribe: (engine: unknown) => Promise<void>
        unsubscribe: (engine: unknown) => Promise<void>
    }
}
