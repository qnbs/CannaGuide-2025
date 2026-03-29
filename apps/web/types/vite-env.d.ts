/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
    readonly VITE_SENTRY_DSN: string
    readonly VITE_SEEDFINDER_API_KEY: string
    readonly VITE_CANSATIVA_API_KEY: string
    readonly VITE_CANNLYTICS_API_KEY: string
    readonly VITE_STRAINAPI_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
