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

declare module '@tensorflow/tfjs' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export function loadLayersModel(path: string): Promise<any>
    export function tensor(data: unknown, shape?: number[]): Record<string, unknown>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export function tensor2d(data: any, shape?: number[]): any
    export function tidy<T>(fn: () => T): T
    export function dispose(tensors: unknown): void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export function sequential(...args: any[]): any
    export const layers: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dense(config: any): any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: ((...args: any[]) => any) | undefined
    }
    export const train: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        adam(learningRate?: number): any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: ((...args: any[]) => any) | undefined
    }
    export const env: Record<string, unknown>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export type Tensor = any
}

declare module '@tauri-apps/api/core' {
    export function invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T>
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

interface Navigator {
    readonly gpu?: GPU
}
