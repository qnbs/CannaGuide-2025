/**
 * A broker's refused CONNECT, as mqtt 5.16 reports it: an `error` whose `code` is the CONNACK
 * return code (MQTT 3.1.1) or reason code (MQTT 5), followed by a closed socket. Before 5.16
 * the socket stayed open, so nothing reconnected; now our own `close` handler would retry.
 *
 * Retrying cannot fix a refusal about the credentials, the authorization, the protocol, the
 * client id, a ban or a redirect, and would only hammer the broker and replace the error the
 * user needs to see. Those are permanent. A busy, unavailable or shutting-down broker, a quota
 * or an unspecified error is worth the usual backoff.
 */
const PERMANENT_REFUSALS: ReadonlySet<number> = new Set([
    // MQTT 3.1.1 return codes
    1, // unacceptable protocol version
    2, // identifier rejected
    4, // bad username or password
    5, // not authorized
    // MQTT 5 reason codes
    0x84, // unsupported protocol version
    0x85, // client identifier not valid
    0x86, // bad user name or password
    0x87, // not authorized
    0x8a, // banned
    0x8c, // bad authentication method
    0x9c, // use another server
    0x9d, // server moved
])

const REFUSAL_PREFIX = 'Connection refused:'

/** The reason code of a refused CONNECT that retrying cannot fix, or null. */
export const permanentConnackRefusal = (error: unknown): number | null => {
    if (!(error instanceof Error) || !error.message.startsWith(REFUSAL_PREFIX)) return null
    const code: unknown = Reflect.get(error, 'code')
    return typeof code === 'number' && PERMANENT_REFUSALS.has(code) ? code : null
}
