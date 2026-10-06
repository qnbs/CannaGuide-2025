const BUILD_VERSION = /^[0-9A-Za-z][0-9A-Za-z.+-]*\+[0-9a-f]{40}$/i

/** Accept only a stamped continuous-web build version. Anything else falls back. */
export function deployVersionFromPayload(payload: unknown, fallback: string): string {
    if (!payload || typeof payload !== 'object') return fallback
    const buildVersion = Reflect.get(payload, 'buildVersion')
    if (typeof buildVersion === 'string' && BUILD_VERSION.test(buildVersion)) return buildVersion
    return fallback
}

/**
 * Read the post-build stamp. Turbo may replay an older JS bundle, so the
 * commit identity lives in version.json rather than in __APP_VERSION__.
 */
export async function readDeployVersion(fallback: string = __APP_VERSION__): Promise<string> {
    try {
        const base = import.meta.env.BASE_URL || '/'
        const prefix = base.endsWith('/') ? base : `${base}/`
        const response = await fetch(`${prefix}version.json`, { cache: 'no-store' })
        if (!response.ok) return fallback
        return deployVersionFromPayload(await response.json(), fallback)
    } catch {
        return fallback
    }
}
