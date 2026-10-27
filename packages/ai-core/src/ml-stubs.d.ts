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
     * transformers.js embeds onnxruntime-web (1.14.0) and exposes its env here;
     * `env.backends.onnx.wasm.wasmPaths` is where that runtime fetches its wasm,
     * which `loadTransformers` points at the same-origin, digest-pinned copy.
     *
     * The previous stub was `const content: Record<string, unknown>; export = content`,
     * which under esModuleInterop types the module as `{ default: ... }` -- so
     * `mod.env` did not exist and any use of it failed to compile. Declared as
     * named exports now, matching apps/web/types/optional-deps.d.ts, so both
     * workspaces describe this optional dependency the same way.
     */
    export const env: {
        backends?:
            | {
                  onnx?:
                      | {
                            wasm?:
                                | { wasmPaths?: string | undefined; proxy?: boolean | undefined }
                                | undefined
                        }
                      | undefined
              }
            | undefined
        allowLocalModels?: boolean | undefined
        [key: string]: unknown
    }
}

/**
 * The one Vite-provided field `ml.ts` reads. ai-core is consumed as source by the
 * web app's Vite build, which replaces it statically; declared here because this
 * workspace does not load `vite/client` types. Identical to Vite's declaration,
 * so the two merge.
 */
interface ImportMetaEnv {
    readonly BASE_URL: string
}
interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '@mlc-ai/web-llm' {
    const content: Record<string, unknown>
    export = content
}

/**
 * Present so `ml.ts` still typechecks when optionalDependencies are omitted
 * (`pnpm install --no-optional`). When the package is installed, this merges
 * with its own `declare module 'onnxruntime-web'`.
 */
declare module 'onnxruntime-web' {
    export const env: {
        wasm: {
            numThreads?: number
            wasmPaths?: string | { wasm?: URL | string; mjs?: URL | string }
            wasmBinary?: ArrayBufferLike | Uint8Array
        }
    }
}
