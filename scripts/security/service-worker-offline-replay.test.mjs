import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import { MessageChannel } from 'node:worker_threads'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const serviceWorkerSource = readFileSync(join(repositoryRoot, 'apps/web/public/sw.js'), 'utf8')
const syncHelpersStart = serviceWorkerSource.indexOf('function openDB()')
const syncHelpersEnd = serviceWorkerSource.indexOf(
    '// Background Sync event listener',
    syncHelpersStart,
)
assert.ok(syncHelpersStart >= 0 && syncHelpersEnd > syncHelpersStart)
const syncHelpersSource = serviceWorkerSource.slice(syncHelpersStart, syncHelpersEnd)
const ackConstants = serviceWorkerSource.match(
    /const REPLAY_ACTION_ACK_TYPE = .*\nconst REPLAY_ACTION_ACK_TIMEOUT_MS = .*/u,
)
assert.ok(ackConstants, 'the service worker declares its replay acknowledgement contract')

function createSyncHarness({ records, clients }) {
    const remaining = records.map(({ key, value }) => ({ key, value: { ...value } }))
    const deleted = []
    const eventOrder = []

    const database = {
        transaction: (_storeName, mode) => {
            const transaction = {}
            let completedReads = 0
            let readCompletionScheduled = false
            const maybeCompleteReads = () => {
                if (mode !== 'readonly' || completedReads !== 2 || readCompletionScheduled) return
                readCompletionScheduled = true
                setImmediate(() => transaction.oncomplete?.())
            }
            const store = {
                getAll: () => {
                    const request = {}
                    setImmediate(() => {
                        request.result = remaining.map(({ value }) => ({ ...value }))
                        request.onsuccess?.()
                        completedReads += 1
                        maybeCompleteReads()
                    })
                    return request
                },
                getAllKeys: () => {
                    const request = {}
                    setImmediate(() => {
                        request.result = remaining.map(({ key }) => key)
                        request.onsuccess?.()
                        completedReads += 1
                        maybeCompleteReads()
                    })
                    return request
                },
                delete: (key) => {
                    eventOrder.push(`delete:${key}`)
                    deleted.push(key)
                    const index = remaining.findIndex((record) => record.key === key)
                    if (index >= 0) remaining.splice(index, 1)
                    setImmediate(() => transaction.oncomplete?.())
                },
            }
            transaction.objectStore = () => store
            return transaction
        },
    }

    const context = {
        indexedDB: {
            open: () => {
                const request = {}
                setImmediate(() => {
                    request.result = database
                    request.onsuccess?.()
                })
                return request
            },
        },
        self: { clients: { matchAll: async () => clients } },
        MessageChannel,
        setTimeout: (callback, delay, ...args) =>
            setTimeout(callback, Math.min(delay, 25), ...args),
        clearTimeout,
        console: { debug: () => undefined },
        eventOrder,
    }
    const executable = `
        const DB_NAME = 'CannaGuideDB'
        const DB_VERSION = 4
        const OFFLINE_ACTIONS_STORE = 'offline_actions'
        const REMINDER_DB_NAME = 'CannaGuideReminderDB'
        const REMINDER_DB_VERSION = 1
        const REMINDER_STORE = 'grow_reminders'
        const REMINDER_COOLDOWN_MS = 14400000
        ${ackConstants[0]}
        ${syncHelpersSource}
        globalThis.syncData = syncData
    `
    runInNewContext(executable, context)
    return {
        deleted,
        eventOrder,
        remaining,
        syncData: context.syncData,
    }
}

const queuedAction = {
    key: 27,
    value: {
        type: 'simulation/addJournalEntry',
        plantId: 'plant-1',
        entry: { id: 'journal-1', createdAt: 1_700_000_000_000 },
        idempotencyKey: 'journal-entry-plant-1-journal-1',
    },
}

test('service worker retains queued actions when there is no window client', async () => {
    const harness = createSyncHarness({ records: [queuedAction], clients: [] })

    await assert.rejects(harness.syncData(), /No window client is available/u)
    assert.deepEqual(harness.deleted, [])
    assert.equal(harness.remaining.length, 1)
})

test('service worker retains queued actions when the client does not acknowledge replay', async () => {
    const client = { postMessage: () => undefined }
    const harness = createSyncHarness({ records: [queuedAction], clients: [client] })

    await assert.rejects(harness.syncData(), /did not acknowledge persisted state/u)
    assert.deepEqual(harness.deleted, [])
    assert.equal(harness.remaining.length, 1)
})

test('service worker deletes an action only after a matching persisted-state acknowledgement', async () => {
    const client = {
        postMessage: (message, ports) => {
            const replyPort = ports[0]
            setTimeout(() => {
                replyPort.postMessage({
                    type: 'REPLAY_OFFLINE_ACTION_ACK',
                    queueId: message.queueId,
                    persisted: true,
                })
            }, 1)
        },
    }
    const harness = createSyncHarness({ records: [queuedAction], clients: [client] })

    await harness.syncData()

    assert.deepEqual(harness.deleted, [27])
    assert.equal(harness.remaining.length, 0)
    assert.deepEqual(harness.eventOrder, ['delete:27'])
})
