const BUILD_VERSION = /^[0-9A-Za-z][0-9A-Za-z.+-]*\+[0-9a-f]{40}$/i
const RUNNING_BUILD_META = 'cannaguide-build'
const DEPLOY_VERSION_TIMEOUT_MS = 2000

/** Accept only a stamped continuous-web build version. Anything else falls back. */
export function deployVersionFromPayload(payload: unknown, fallback: string): string {
    if (!payload || typeof payload !== 'object') return fallback
    const buildVersion = Reflect.get(payload, 'buildVersion')
    if (typeof buildVersion === 'string' && BUILD_VERSION.test(buildVersion)) return buildVersion
    return fallback
}

/**
 * Identity of the document this tab actually loaded. The stamp script writes
 * the meta tag into dist/index.html after Turbo, so a stale tab keeps its own
 * build instead of adopting a newer version.json from the network.
 */
export function readRunningBuildVersion(fallback: string = __APP_VERSION__): string {
    if (typeof document === 'undefined') return fallback
    const content = document
        .querySelector(`meta[name="${RUNNING_BUILD_META}"]`)
        ?.getAttribute('content')
    if (typeof content === 'string' && BUILD_VERSION.test(content)) return content
    return fallback
}

/**
 * Identity of the deployment currently served. Use this for an available
 * update, not for the release of the JavaScript already running in the tab.
 */
export async function readDeployVersion(
    fallback: string = __APP_VERSION__,
    timeoutMs: number = DEPLOY_VERSION_TIMEOUT_MS,
): Promise<string> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
        const base = import.meta.env.BASE_URL || '/'
        const prefix = base.endsWith('/') ? base : `${base}/`
        const response = await fetch(`${prefix}version.json`, {
            cache: 'no-store',
            signal: controller.signal,
        })
        if (!response.ok) return fallback
        return deployVersionFromPayload(await response.json(), fallback)
    } catch {
        return fallback
    } finally {
        clearTimeout(timer)
    }
}
