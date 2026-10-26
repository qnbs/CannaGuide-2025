import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import { MessageChannel } from 'node:worker_threads'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const serviceWorkerSource = readFileSync(join(repositoryRoot, 'apps/web/public/sw.js'), 'utf8')
const clientHelpersStart = serviceWorkerSource.indexOf('function isApplicationWindowClient(')
const clientHelpersEnd = serviceWorkerSource.indexOf(
    '// Note: This app is client-only',
    clientHelpersStart,
)
assert.ok(clientHelpersStart >= 0 && clientHelpersEnd > clientHelpersStart)
const clientHelpersSource = serviceWorkerSource.slice(clientHelpersStart, clientHelpersEnd)
const syncHelpersStart = serviceWorkerSource.indexOf('function openDB()')
const syncHelpersEnd = serviceWorkerSource.indexOf(
    '// Background Sync event listener',
    syncHelpersStart,
)
assert.ok(syncHelpersStart >= 0 && syncHelpersEnd > syncHelpersStart)
const syncHelpersSource = serviceWorkerSource.slice(syncHelpersStart, syncHelpersEnd)
const replayConstants = serviceWorkerSource.match(
    /const REPLAY_ACTION_PROBE_TYPE = .*\nconst REPLAY_ACTION_READY_ACK_TYPE = .*\nconst REPLAY_ACTION_ACK_TYPE = .*\nconst REPLAY_ACTION_ACK_TIMEOUT_MS = .*/u,
)
assert.ok(replayConstants, 'the service worker declares its replay acknowledgement contract')

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
                get: (key) => {
                    const request = {}
                    setImmediate(() => {
                        request.result = remaining.find((record) => record.key === key)?.value
                        request.onsuccess?.()
                    })
                    return request
                },
                put: (value, key) => {
                    eventOrder.push(`put:${key}`)
                    const record = remaining.find((item) => item.key === key)
                    if (record) record.value = { ...value }
                    setImmediate(() => transaction.oncomplete?.())
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

    const scope = 'https://example.test/CannaGuide-2025/'
    const windowClients = clients.map((client) => ({
        url: scope,
        visibilityState: 'visible',
        focused: false,
        ...client,
    }))
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
        self: {
            registration: { scope },
            clients: { matchAll: async () => windowClients },
        },
        MessageChannel,
        URL,
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
        ${replayConstants[0]}
        ${clientHelpersSource}
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

    await assert.rejects(harness.syncData(), /No application window is available/u)
    assert.deepEqual(harness.deleted, [])
    assert.equal(harness.remaining.length, 1)
})

test('service worker retains queued actions when no application client acknowledges readiness', async () => {
    const client = { postMessage: () => undefined }
    const harness = createSyncHarness({ records: [queuedAction], clients: [client] })

    await assert.rejects(harness.syncData(), /No application window acknowledged readiness/u)
    assert.deepEqual(harness.deleted, [])
    assert.equal(harness.remaining.length, 1)
})

test('service worker defers replay while multiple app windows could hold stale snapshots', async () => {
    const messages = []
    const firstClient = {
        postMessage: (message) => messages.push(`first:${message.type}:${message.queueId}`),
    }
    const readyClient = {
        postMessage: (message, ports) => {
            messages.push(`ready:${message.type}:${message.queueId}`)
            setTimeout(() => {
                ports[0].postMessage({
                    type:
                        message.type === 'REPLAY_OFFLINE_ACTION_PROBE'
                            ? 'REPLAY_OFFLINE_ACTION_READY_ACK'
                            : 'REPLAY_OFFLINE_ACTION_ACK',
                    queueId: message.queueId,
                    ...(message.type === 'REPLAY_OFFLINE_ACTION_PROBE'
                        ? { ready: true }
                        : { persisted: true }),
                })
            }, 1)
        },
    }
    const harness = createSyncHarness({
        records: [queuedAction],
        clients: [firstClient, readyClient],
    })

    await assert.rejects(harness.syncData(), /Multiple application windows are open/u)

    assert.deepEqual(messages, [])
    assert.deepEqual(harness.deleted, [])
    assert.equal(harness.remaining.length, 1)
})

test('service worker asks one ready app client to persist a replay', async () => {
    const messages = []
    const makeClient = (name) => ({
        focused: name === 'focused',
        postMessage: (message, ports) => {
            messages.push(`${name}:${message.type}`)
            setTimeout(() => {
                ports[0].postMessage(
                    message.type === 'REPLAY_OFFLINE_ACTION_PROBE'
                        ? {
                              type: 'REPLAY_OFFLINE_ACTION_READY_ACK',
                              queueId: message.queueId,
                              ready: true,
                          }
                        : {
                              type: 'REPLAY_OFFLINE_ACTION_ACK',
                              queueId: message.queueId,
                              persisted: true,
                          },
                )
            }, 1)
        },
    })
    const harness = createSyncHarness({
        records: [queuedAction],
        clients: [makeClient('focused')],
    })

    await harness.syncData()

    assert.deepEqual(harness.deleted, [27])
    assert.deepEqual(messages, [
        'focused:REPLAY_OFFLINE_ACTION_PROBE',
        'focused:REPLAY_OFFLINE_ACTION',
    ])
    assert.deepEqual(harness.eventOrder, ['delete:27'])
})

test('service worker ignores same-origin windows outside the application scope', async () => {
    const messages = []
    const makeReadyClient = (name, url) => ({
        url,
        postMessage: (message, ports) => {
            messages.push(`${name}:${message.type}`)
            setTimeout(() => {
                ports[0].postMessage(
                    message.type === 'REPLAY_OFFLINE_ACTION_PROBE'
                        ? {
                              type: 'REPLAY_OFFLINE_ACTION_READY_ACK',
                              queueId: message.queueId,
                              ready: true,
                          }
                        : {
                              type: 'REPLAY_OFFLINE_ACTION_ACK',
                              queueId: message.queueId,
                              persisted: true,
                          },
                )
            }, 1)
        },
    })
    const harness = createSyncHarness({
        records: [queuedAction],
        clients: [
            makeReadyClient('unrelated', 'https://example.test/other-app/'),
            makeReadyClient('prefix-lookalike', 'https://example.test/CannaGuide-2025-other/'),
            makeReadyClient('app', 'https://example.test/CannaGuide-2025/journal'),
        ],
    })

    await harness.syncData()

    assert.deepEqual(messages, ['app:REPLAY_OFFLINE_ACTION_PROBE', 'app:REPLAY_OFFLINE_ACTION'])
    assert.deepEqual(harness.deleted, [27])
})

test('service worker deletes an action only after a matching persisted-state acknowledgement', async () => {
    const client = {
        postMessage: (message, ports) => {
            const replyPort = ports[0]
            setTimeout(() => {
                replyPort.postMessage({
                    type:
                        message.type === 'REPLAY_OFFLINE_ACTION_PROBE'
                            ? 'REPLAY_OFFLINE_ACTION_READY_ACK'
                            : 'REPLAY_OFFLINE_ACTION_ACK',
                    queueId: message.queueId,
                    ...(message.type === 'REPLAY_OFFLINE_ACTION_PROBE'
                        ? { ready: true }
                        : { persisted: true }),
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

test('service worker quarantines permanently rejected actions and continues replay', async () => {
    const invalidAction = {
        key: 27,
        value: { type: 'unsupported/action', idempotencyKey: 'unsupported-27' },
    }
    const messages = []
    const client = {
        postMessage: (message, ports) => {
            messages.push(`client:${message.type}:${message.queueId}`)
            const replyPort = ports[0]
            setTimeout(() => {
                replyPort.postMessage(
                    message.type === 'REPLAY_OFFLINE_ACTION_PROBE'
                        ? {
                              type: 'REPLAY_OFFLINE_ACTION_READY_ACK',
                              queueId: message.queueId,
                              ready: true,
                          }
                        : message.queueId === 27
                          ? {
                                type: 'REPLAY_OFFLINE_ACTION_ACK',
                                queueId: message.queueId,
                                persisted: false,
                                rejected: true,
                            }
                          : {
                                type: 'REPLAY_OFFLINE_ACTION_ACK',
                                queueId: message.queueId,
                                persisted: true,
                            },
                )
            }, 1)
        },
    }
    const validAction = { key: 28, value: queuedAction.value }
    const harness = createSyncHarness({
        records: [invalidAction, validAction],
        clients: [client],
    })

    await harness.syncData()

    assert.deepEqual(harness.deleted, [28])
    assert.equal(harness.remaining.length, 1)
    assert.equal(harness.remaining[0].key, 27)
    assert.equal(harness.remaining[0].value.replayBlocked, true)
    assert.deepEqual(harness.eventOrder, ['put:27', 'delete:28'])
    assert.deepEqual(messages, [
        'client:REPLAY_OFFLINE_ACTION_PROBE:27',
        'client:REPLAY_OFFLINE_ACTION:27',
        'client:REPLAY_OFFLINE_ACTION:28',
    ])

    const messagesBeforeRetry = messages.length
    await harness.syncData()
    assert.equal(messages.length, messagesBeforeRetry)
})
