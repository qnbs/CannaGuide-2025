type TransformersModule = typeof import('@xenova/transformers')

export type LocalAiPipeline = (input: unknown, options?: Record<string, unknown>) => Promise<unknown>

let transformersModulePromise: Promise<TransformersModule> | null = null

export const getTransformersModule = async (): Promise<TransformersModule> => {
    if (!transformersModulePromise) {
        transformersModulePromise = import('@xenova/transformers')
    }

    return transformersModulePromise
}

export const loadTransformersPipeline = async (
    task: string,
    modelId: string,
    options: Record<string, unknown>,
): Promise<LocalAiPipeline> => {
    const { pipeline } = await getTransformersModule()
    return pipeline(task as never, modelId, options as never) as Promise<LocalAiPipeline>
}
