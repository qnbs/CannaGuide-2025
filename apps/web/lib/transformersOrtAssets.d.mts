import type { Plugin } from 'vite'

export declare const TRANSFORMERS_ORT_VERSION: string
export declare const TRANSFORMERS_ORT_DIR: string
export declare const TRANSFORMERS_ORT_WASM: Readonly<
    Record<string, { readonly size: number; readonly sha256: string }>
>
export declare function resolveTransformersOrtPackageDir(fromFile: string | URL): string | null
export declare function readVerifiedTransformersOrtWasm(
    packageDir: string,
    manifest?: Readonly<Record<string, { readonly size: number; readonly sha256: string }>>,
    version?: string,
): Map<string, Buffer>
export declare function transformersOrtAssetsPlugin(fromFile: string | URL): Plugin
