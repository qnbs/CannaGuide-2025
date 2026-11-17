// Ambient module declarations for optional ML/native dependencies.
// These allow typecheck to pass in lite mode (--no-optional).

declare module '@xenova/transformers' {
    export type Pipeline = (...args: unknown[]) => Promise<unknown>
    export function pipeline(
        task: string,
        model?: string,
        options?: Record<string, unknown>,
    ): Promise<Pipeline>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const env: Record<string, any>
}

declare module '@mlc-ai/web-llm' {
    export class MLCEngine {
        reload(model: string, config?: Record<string, unknown>): Promise<void>
        chat: {
            completions: {
                create(params: Record<string, unknown>): Promise<Record<string, unknown>>
            }
        }
        unload(): Promise<void>
    }
    export function CreateMLCEngine(
        model: string,
        config?: Record<string, unknown>,
    ): Promise<MLCEngine>
}

// WebGPU types (not available in all TS lib targets)
interface GPU {
    requestAdapter(options?: Record<string, unknown>): Promise<GPUAdapter | null>
}

interface GPUAdapter {
    readonly limits: GPUSupportedLimits
    readonly isFallbackAdapter?: boolean
    readonly features?: Set<string>
    requestDevice(descriptor?: Record<string, unknown>): Promise<GPUDevice>
}

interface GPUDevice {
    readonly limits: GPUSupportedLimits
}

interface GPUSupportedLimits {
    readonly maxBufferSize: number
    readonly maxStorageBufferBindingSize: number
    readonly maxComputeWorkgroupSizeX: number
    [key: string]: unknown
}

// No `Navigator.gpu` augmentation here: TypeScript 7's DOM lib declares
// `Navigator extends NavigatorGPU` with a required `gpu`, and an optional one
// conflicts with it (TS2430). Callers check `'gpu' in navigator` first, which narrows
// the type under TypeScript 6 as well, so neither version needs this declaration.

// -- Tauri v2 optional native packages --

declare module '@tauri-apps/plugin-notification' {
    export function sendNotification(options: {
        title: string
        body?: string | undefined
    }): Promise<void>
    export function isPermissionGranted(): Promise<boolean>
    export function requestPermission(): Promise<'granted' | 'denied' | 'default'>
}

declare module '@tauri-apps/plugin-dialog' {
    export interface DialogFilter {
        name: string
        extensions: string[]
    }
    export function save(options?: {
        defaultPath?: string | undefined
        filters?: DialogFilter[] | undefined
    }): Promise<string | null>
    export function open(options?: {
        defaultPath?: string | undefined
        multiple?: boolean | undefined
        filters?: DialogFilter[] | undefined
    }): Promise<string | null>
}

declare module '@tauri-apps/api/core' {
    export function invoke<T = void>(cmd: string, args?: Record<string, unknown>): Promise<T>
    /** Subset of the real class: desktopLifecycleService streams download progress. */
    export class Channel<T = unknown> {
        constructor(onmessage?: (response: T) => void)
        id: number
        onmessage: (response: T) => void
    }
}
