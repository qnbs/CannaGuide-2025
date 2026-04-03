import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { indexedDB } from 'fake-indexeddb'

import { DB_NAME } from '@/constants'
import type { CalculatorHistoryEntry } from './dbService'

const deleteMainDb = async (): Promise<void> => {
    await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(DB_NAME)
        request.onsuccess = () => resolve()
        request.onerror = () => resolve()
        request.onblocked = () => resolve()
    })
}

const loadDb = async () => (await import('./dbService')).dbService

const makeEntry = (
    id: string,
    calculatorId: string,
    timestamp: number,
): CalculatorHistoryEntry => ({
    id,
    calculatorId,
    inputs: { roomVolume: 4, currentPpm: 400, targetPpm: 1200, ach: 1 },
    result: { initialBoostL: 9.3, maintenanceL_h: 4.8, status: 'enrichment' },
    timestamp,
})

describe('dbService calculator history', () => {
    beforeEach(async () => {
        await deleteMainDb()
    })

    afterEach(async () => {
        await deleteMainDb()
    })

    it('saves and retrieves a history entry', async () => {
        const db = await loadDb()
        const entry = makeEntry('co2-1', 'co2', Date.now())
        await db.saveCalculatorHistoryEntry(entry)
        const history = await db.getCalculatorHistory('co2')
        expect(history).toHaveLength(1)
        expect(history[0]?.id).toBe('co2-1')
    })

    it('returns empty array for unknown calculatorId', async () => {
        const db = await loadDb()
        const history = await db.getCalculatorHistory('nonexistent')
        expect(history).toHaveLength(0)
    })

    it('filters by calculatorId', async () => {
        const db = await loadDb()
        await db.saveCalculatorHistoryEntry(makeEntry('co2-1', 'co2', 1000))
        await db.saveCalculatorHistoryEntry(makeEntry('lh-1', 'lightHanging', 2000))
        const co2History = await db.getCalculatorHistory('co2')
        const lhHistory = await db.getCalculatorHistory('lightHanging')
        expect(co2History).toHaveLength(1)
        expect(lhHistory).toHaveLength(1)
        expect(co2History[0]?.id).toBe('co2-1')
        expect(lhHistory[0]?.id).toBe('lh-1')
    })

    it('returns entries sorted by timestamp descending', async () => {
        const db = await loadDb()
        await db.saveCalculatorHistoryEntry(makeEntry('co2-1', 'co2', 1000))
        await db.saveCalculatorHistoryEntry(makeEntry('co2-2', 'co2', 3000))
        await db.saveCalculatorHistoryEntry(makeEntry('co2-3', 'co2', 2000))
        const history = await db.getCalculatorHistory('co2')
        expect(history[0]?.id).toBe('co2-2')
        expect(history[1]?.id).toBe('co2-3')
        expect(history[2]?.id).toBe('co2-1')
    })

    it('overwrites an entry with the same id (put semantics)', async () => {
        const db = await loadDb()
        const entry = makeEntry('co2-1', 'co2', 1000)
        await db.saveCalculatorHistoryEntry(entry)
        const updated: CalculatorHistoryEntry = {
            ...entry,
            result: { initialBoostL: 15, maintenanceL_h: 6, status: 'enrichment' },
        }
        await db.saveCalculatorHistoryEntry(updated)
        const history = await db.getCalculatorHistory('co2')
        expect(history).toHaveLength(1)
        expect(history[0]?.result['initialBoostL']).toBe(15)
    })

    it('clears history for a specific calculator', async () => {
        const db = await loadDb()
        await db.saveCalculatorHistoryEntry(makeEntry('co2-1', 'co2', 1000))
        await db.saveCalculatorHistoryEntry(makeEntry('lh-1', 'lightHanging', 2000))
        await db.clearCalculatorHistory('co2')
        const co2History = await db.getCalculatorHistory('co2')
        const lhHistory = await db.getCalculatorHistory('lightHanging')
        expect(co2History).toHaveLength(0)
        expect(lhHistory).toHaveLength(1)
    })

    it('enforces FIFO cap of 20 entries per calculator', async () => {
        const db = await loadDb()
        for (let i = 1; i <= 22; i++) {
            await db.saveCalculatorHistoryEntry(makeEntry(`co2-${i}`, 'co2', i * 1000))
        }
        const history = await db.getCalculatorHistory('co2')
        expect(history.length).toBe(20)
        // The oldest entries (co2-1, co2-2) should be evicted
        const ids = history.map((e) => e.id)
        expect(ids).not.toContain('co2-1')
        expect(ids).not.toContain('co2-2')
        // The newest entry should be present
        expect(ids).toContain('co2-22')
    })
})
