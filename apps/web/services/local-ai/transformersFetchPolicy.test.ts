// Tests for @cannaguide/ai-core/ml run in the web suite, like
// transformersOrtOrigin.test.ts: packages/ai-core has no test runner of its own,
// and this is where its only consumers (and their aliases) are configured.
import { describe, expect, it } from 'vitest'
import {
    type CacheLookup,
    ModelDownloadBlockedError,
    NO_LOCAL_MODELS_PATH,
    applyLocalOnlyToTransformersEnv,
    isRemoteDownloadRefusal,
    TRANSFORMERS_CACHE_NAME,
    isTransformersModelCached,
    prepareTransformersLoad,
    transformersConfigUrl,
    type TransformersFetchEnv,
} from '@cannaguide/ai-core/ml'

/** A browser cache holding exactly `urls` in the transformers.js cache. */
const cacheWith = (urls: string[]): CacheLookup => ({
    open: (name) =>
        Promise.resolve({
            match: (url) =>
                Promise.resolve(
                    name === TRANSFORMERS_CACHE_NAME && urls.includes(url)
                        ? new Response('{}')
                        : undefined,
                ),
        }),
})

const MODEL = 'Xenova/all-MiniLM-L6-v2'
const CONFIG = `https://huggingface.co/${MODEL}/resolve/main/config.json`

describe('transformers.js download policy (GH #700)', () => {
    it('builds the cache key transformers.js stores a config under', () => {
        expect(transformersConfigUrl({}, MODEL)).toBe(CONFIG)
        expect(
            transformersConfigUrl(
                { remoteHost: 'https://mirror.example', remotePathTemplate: '/{model}/{revision}' },
                MODEL,
            ),
        ).toBe(`https://mirror.example/${MODEL}/main/config.json`)
    })

    it('finds a downloaded model, and nothing without a cache', async () => {
        expect(await isTransformersModelCached({}, MODEL, cacheWith([CONFIG]))).toBe(true)
        expect(await isTransformersModelCached({}, 'Xenova/other', cacheWith([CONFIG]))).toBe(false)
        // This test environment has no CacheStorage, as a private window may not.
        expect(await isTransformersModelCached({}, MODEL)).toBe(false)
        const broken: CacheLookup = {
            open: () => Promise.reject(new Error('SecurityError')),
        }
        expect(await isTransformersModelCached({}, MODEL, broken)).toBe(false)
    })

    it('without Local-Only Mode downloads as usual', async () => {
        const env: TransformersFetchEnv = { allowLocalModels: true, allowRemoteModels: false }
        await prepareTransformersLoad(env, MODEL, false, cacheWith([]))
        expect(env).toMatchObject({ allowLocalModels: false, allowRemoteModels: true })
    })

    it('in Local-Only Mode refuses a model that is not downloaded, before any request', async () => {
        const env: TransformersFetchEnv = { allowLocalModels: false, allowRemoteModels: true }
        const refusal = prepareTransformersLoad(env, MODEL, true, cacheWith([]))

        await expect(refusal).rejects.toBeInstanceOf(ModelDownloadBlockedError)
        await expect(refusal).rejects.toMatchObject({ modelId: MODEL })
        // Remote is off already: a download of this model under way fails at its next file.
        expect(env.allowRemoteModels).toBe(false)
    })

    it('in Local-Only Mode loads a downloaded model from the cache only', async () => {
        const env: TransformersFetchEnv = { allowLocalModels: false, allowRemoteModels: true }
        await prepareTransformersLoad(env, MODEL, true, cacheWith([CONFIG]))
        // Remote off; local on (needed to read the cache) but pointed at a path
        // fetch rejects, so the app origin's SPA page is never cached as a model file.
        expect(env).toMatchObject({
            allowLocalModels: true,
            allowRemoteModels: false,
            localModelPath: NO_LOCAL_MODELS_PATH,
        })
        expect(String(env.localModelPath)).not.toMatch(/^(https?|data|blob|about):/u)
    })

    it('switches a loaded env to cache-only, for a load already under way', () => {
        const env: TransformersFetchEnv = { allowLocalModels: false, allowRemoteModels: true }
        applyLocalOnlyToTransformersEnv(env)
        expect(env).toMatchObject({
            allowLocalModels: true,
            allowRemoteModels: false,
            localModelPath: NO_LOCAL_MODELS_PATH,
        })
    })

    it('recognises the errors transformers.js throws for a refused download', () => {
        // Both messages of transformers.js 2.17.2 (src/utils/hub.js) when remote is off.
        expect(
            isRemoteDownloadRefusal(
                new Error(
                    '`local_files_only=true` or `env.allowRemoteModels=false` and file was not found locally at "x".',
                ),
            ),
        ).toBe(true)
        expect(
            isRemoteDownloadRefusal(
                new Error(
                    '`env.allowRemoteModels=false`, but attempted to load a remote file from: y.',
                ),
            ),
        ).toBe(true)
        expect(isRemoteDownloadRefusal(new Error('WebGPU context lost'))).toBe(false)
        expect(isRemoteDownloadRefusal('env.allowRemoteModels=false')).toBe(false)
    })
})
