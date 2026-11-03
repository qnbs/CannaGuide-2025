import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Manifest members that make the browser hand data to the app: a share, a file
 * opened from the system, a custom protocol link. The browser offers them to the
 * user as soon as the manifest lists them, so listing one the app cannot receive
 * is a broken feature (GH #656: a POST share target and a `.cannaguide` file
 * handler had no service-worker POST route and no `launchQueue` consumer).
 */
const INGRESS_MEMBERS = ['share_target', 'file_handlers', 'protocol_handlers'] as const

/**
 * Members the app handles. Add one only together with its handler and a test of
 * that handler; each entry names where the data is received.
 */
const HANDLED_INGRESS: Readonly<Partial<Record<(typeof INGRESS_MEMBERS)[number], string>>> = {}

const manifest = JSON.parse(
    readFileSync(resolve(process.cwd(), 'public/manifest.json'), 'utf8'),
) as Record<string, unknown>

describe('PWA manifest (GH #656)', () => {
    it('lists no share target, file handler or protocol handler the app does not receive', () => {
        const unhandled = INGRESS_MEMBERS.filter(
            (member) => member in manifest && HANDLED_INGRESS[member] === undefined,
        )

        expect(unhandled).toEqual([])
    })
})
