import { existsSync, readFileSync } from 'node:fs'
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
type IngressMember = (typeof INGRESS_MEMBERS)[number]

interface IngressHandler {
    /** Source file, relative to apps/web, that receives the data. */
    receiver: string
    /** Code that must appear in the receiver, e.g. 'launchQueue.setConsumer'. */
    marker: string
    /** Test file, relative to apps/web, that covers the receiver. */
    test: string
}

/**
 * Members the app handles. Add one only together with its receiver and a test
 * of it; the second test below checks that both files exist and that the
 * receiver contains the marker.
 */
const HANDLED_INGRESS: Readonly<Partial<Record<IngressMember, IngressHandler>>> = {}

const fromApp = (path: string): string => resolve(process.cwd(), path)

const manifest = JSON.parse(readFileSync(fromApp('public/manifest.json'), 'utf8')) as Record<
    string,
    unknown
>

/** What is missing for `handler` to count as a real receiver; empty when nothing is. */
const handlerProblems = (member: string, handler: IngressHandler): string[] => {
    if (!existsSync(fromApp(handler.receiver))) {
        return [`${member}: receiver ${handler.receiver} does not exist`]
    }
    const problems: string[] = []
    if (!readFileSync(fromApp(handler.receiver), 'utf8').includes(handler.marker)) {
        problems.push(`${member}: ${handler.receiver} does not contain ${handler.marker}`)
    }
    if (!existsSync(fromApp(handler.test))) {
        problems.push(`${member}: test ${handler.test} does not exist`)
    }
    return problems
}

describe('PWA manifest (GH #656)', () => {
    it('lists no share target, file handler or protocol handler the app does not receive', () => {
        const unhandled = INGRESS_MEMBERS.filter(
            (member) => member in manifest && HANDLED_INGRESS[member] === undefined,
        )

        expect(unhandled).toEqual([])
    })

    it('names, for every handled member, a receiver with its handler code and a test', () => {
        const problems = Object.entries(HANDLED_INGRESS).flatMap(([member, handler]) =>
            handler ? handlerProblems(member, handler) : [],
        )

        expect(problems).toEqual([])
    })

    it('rejects an entry whose receiver, handler code or test is missing', () => {
        const thisFile = 'bootstrap/manifest.test.ts'

        expect(
            handlerProblems('share_target', {
                receiver: 'missing.ts',
                marker: 'x',
                test: thisFile,
            }),
        ).toEqual(['share_target: receiver missing.ts does not exist'])
        expect(
            handlerProblems('share_target', {
                receiver: 'public/manifest.json',
                marker: 'launchQueue.setConsumer',
                test: 'missing.test.ts',
            }),
        ).toEqual([
            'share_target: public/manifest.json does not contain launchQueue.setConsumer',
            'share_target: test missing.test.ts does not exist',
        ])
        expect(
            handlerProblems('share_target', {
                receiver: thisFile,
                marker: 'HANDLED_INGRESS',
                test: thisFile,
            }),
        ).toEqual([])
    })
})
