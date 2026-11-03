import { isLocalOnlyMode } from '@/services/localOnlyModeService'

/**
 * Outbound network gate for Local-Only Mode (GH #683, #700, #717, #655).
 *
 * Local-Only Mode used to be a flag each service checked on its own, so any
 * caller that forgot the check (MQTT, cloud TTS) still reached the network.
 * Callers that talk to a destination outside the app go through this module
 * instead: it classifies the destination and, while Local-Only Mode is on,
 * refuses anything that leaves the device or the local network.
 *
 * The contract (also in docs/ARCHITECTURE.md):
 * - `inline` (data:, blob:) and `same-origin` (the app's own assets) are always
 *   allowed: they do not leave the browser or reach only the host the app was
 *   loaded from.
 * - `private-network` (loopback, RFC 1918, link-local, unique-local IPv6,
 *   `.local`, `.home.arpa`) is allowed only for callers that opt in, i.e. the
 *   MQTT clients, so a broker on the user's own LAN keeps working. A host name
 *   that merely resolves to a LAN address is not recognised and counts as public.
 * - `public` is refused. A URL that cannot be parsed counts as public.
 */

export type DestinationKind = 'inline' | 'same-origin' | 'private-network' | 'public'

export interface EgressOptions {
    /** Allow the user's own LAN while Local-Only Mode is on (MQTT brokers). */
    allowPrivateNetwork?: boolean
}

/**
 * Only the origin is kept: a broker URL may carry `user:password@`, and a path
 * or query may carry an identifier, neither of which belongs in a log or status.
 */
const describeDestination = (destination: string | URL): string => {
    try {
        const { protocol, host } = new URL(destination, globalThis.location?.origin)
        return `${protocol}//${host}`
    } catch {
        return '(unparsable URL)'
    }
}

export class EgressBlockedError extends Error {
    /** The refused destination's origin, without credentials, path or query. */
    readonly destination: string

    constructor(destination: string | URL) {
        const origin = describeDestination(destination)
        super(`Blocked by Local-Only Mode: ${origin}`)
        this.name = 'EgressBlockedError'
        this.destination = origin
    }
}

const INLINE_PROTOCOLS = new Set(['data:', 'blob:'])

const PRIVATE_SUFFIXES = ['.local', '.home.arpa', '.localhost']

/** [first octet, lowest second octet, highest second octet] of each private IPv4 range. */
const PRIVATE_IPV4_RANGES: readonly (readonly [number, number, number])[] = [
    [10, 0, 255], // 10.0.0.0/8
    [127, 0, 255], // loopback 127.0.0.0/8
    [172, 16, 31], // 172.16.0.0/12
    [192, 168, 168], // 192.168.0.0/16
    [169, 254, 254], // link-local 169.254.0.0/16
]

const isPrivateIpv4 = (host: string): boolean => {
    const match = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/u.exec(host)
    if (!match) return false
    const first = Number(match[1])
    const second = Number(match[2])
    return PRIVATE_IPV4_RANGES.some(
        ([octet, low, high]) => first === octet && second >= low && second <= high,
    )
}

/** Loopback, unique-local (fc00::/7) and link-local (fe80::/10) IPv6. */
const isPrivateIpv6 = (host: string): boolean => {
    if (!host.startsWith('[') || !host.endsWith(']')) return false
    const address = host.slice(1, -1).toLowerCase()
    return address === '::1' || /^f[cd]/u.test(address) || /^fe[89ab]/u.test(address)
}

const isPrivateHostName = (host: string): boolean =>
    host === 'localhost' || PRIVATE_SUFFIXES.some((suffix) => host.endsWith(suffix))

const isPrivateHost = (host: string): boolean =>
    isPrivateHostName(host) || isPrivateIpv4(host) || isPrivateIpv6(host)

const appOrigin = (): string | undefined => globalThis.location?.origin

/** Lower case, without the root dot of a fully qualified name (`broker.local.`). */
const normalizeHost = (hostname: string): string => hostname.toLowerCase().replace(/\.$/u, '')

const parse = (destination: string | URL): URL | undefined => {
    try {
        return new URL(destination, appOrigin())
    } catch {
        return undefined
    }
}

export const classifyDestination = (destination: string | URL): DestinationKind => {
    const url = parse(destination)
    if (!url) return 'public'
    if (INLINE_PROTOCOLS.has(url.protocol)) return 'inline'
    if (url.origin === appOrigin()) return 'same-origin'
    return isPrivateHost(normalizeHost(url.hostname)) ? 'private-network' : 'public'
}

const ALWAYS_ALLOWED: ReadonlySet<DestinationKind> = new Set(['inline', 'same-origin'])

/** Whether a request to `destination` may go out now. */
export const isEgressAllowed = (
    destination: string | URL,
    options: EgressOptions = {},
): boolean => {
    if (!isLocalOnlyMode()) return true
    const kind = classifyDestination(destination)
    if (ALWAYS_ALLOWED.has(kind)) return true
    return kind === 'private-network' && options.allowPrivateNetwork === true
}

/** Throws EgressBlockedError when a request to `destination` may not go out. */
export const assertEgressAllowed = (
    destination: string | URL,
    options: EgressOptions = {},
): void => {
    if (!isEgressAllowed(destination, options)) throw new EgressBlockedError(destination)
}

/**
 * `fetch` behind the gate: rejects with EgressBlockedError instead of sending.
 * The gate sees only the first URL, so in Local-Only Mode a redirect is refused
 * (`redirect: 'error'`) rather than followed to a host it never checked.
 */
export const egressFetch = (
    destination: string | URL,
    init?: RequestInit,
    options: EgressOptions = {},
): Promise<Response> => {
    if (!isEgressAllowed(destination, options)) {
        return Promise.reject(new EgressBlockedError(destination))
    }
    return fetch(destination, isLocalOnlyMode() ? { ...init, redirect: 'error' } : init)
}
