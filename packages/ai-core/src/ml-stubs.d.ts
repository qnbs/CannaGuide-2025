// Ambient module declarations for optional ML dependencies.
// These allow typecheck to pass when the packages are not installed
// (e.g. DevContainer lite mode with --no-optional).

declare module '@xenova/transformers' {
    const content: Record<string, unknown>
    export = content
}

declare module '@mlc-ai/web-llm' {
    const content: Record<string, unknown>
    export = content
}
