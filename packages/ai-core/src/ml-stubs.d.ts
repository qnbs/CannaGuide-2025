// Ambient module declarations for optional ML dependencies.
// These allow typecheck to pass when the packages are not installed
// (e.g. DevContainer lite mode with --no-optional).

declare module '@xenova/transformers' {
    export type Pipeline = (...args: unknown[]) => Promise<unknown>
    export function pipeline(
        task: string,
        model?: string,
        options?: Record<string, unknown>,
    ): Promise<Pipeline>

    /**
     * transformers.js embeds onnxruntime-web and exposes its env here, so
     * `env.backends.onnx.wasm.wasmPaths` is what points ORT at the CDN instead of
     * a bundled 25.6 MiB binary (see `loadTransformers`).
     *
     * The previous stub was `const content: Record<string, unknown>; export = content`,
     * which under esModuleInterop types the module as `{ default: ... }` -- so
     * `mod.env` did not exist and any use of it failed to compile. Declared as
     * named exports now, matching apps/web/types/optional-deps.d.ts, so both
     * workspaces describe this optional dependency the same way.
     */
    export const env: {
        backends?: { onnx?: { wasm?: { wasmPaths?: string; proxy?: boolean } } }
        allowLocalModels?: boolean
        [key: string]: unknown
    }
}

declare module '@mlc-ai/web-llm' {
    const content: Record<string, unknown>
    export = content
}
