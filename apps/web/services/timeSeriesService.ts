// ---------------------------------------------------------------------------
// timeSeriesService — Time-Series IoT Data Storage with Automatic Aggregation
//
// Persists high-frequency sensor readings to IndexedDB and automatically
// aggregates older data to keep the database compact:
//   - Raw readings: retained for 24 hours
//   - Hourly averages: retained for 7 days
//   - Daily averages: retained indefinitely
//
// Storage layout (IndexedDB object store "sensor_timeseries"):
//   key: auto-increment
//   value: TimeSeriesEntry { deviceId, timestamp, resolution, temperatureC,
//          humidityPercent, vpd, ph, sampleCount }
//
// Compaction runs at most once per hour, triggered by new writes.
// ---------------------------------------------------------------------------

import type { SensorReading } from '@/stores/sensorStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimeSeriesResolution = 'raw' | 'hourly' | 'daily'

export interface TimeSeriesEntry {
    id?: number
    deviceId: string
    timestamp: number
    resolution: TimeSeriesResolution
    temperatureC: number
    humidityPercent: number
    vpd: number | null
    ph: number | null
    sampleCount: number
}

export interface TimeSeriesQueryOptions {
    deviceId: string
    from: number
    to: number
    resolution?: TimeSeriesResolution
    limit?: number
}

export interface AggregatedStats {
    avgTemperature: number
    avgHumidity: number
    avgVpd: number | null
    avgPh: number | null
    minTemperature: number
    maxTemperature: number
    minHumidity: number
    maxHumidity: number
    sampleCount: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TS_DB_NAME = 'CannaGuideTimeSeriesDB'
const TS_DB_VERSION = 1
const TS_STORE = 'sensor_timeseries'

const MS_PER_HOUR = 3_600_000
const MS_PER_DAY = 86_400_000

/** Raw readings older than 24 h are eligible for hourly aggregation. */
const RAW_RETENTION_MS = MS_PER_DAY

/** Hourly entries older than 7 days are eligible for daily aggregation. */
const HOURLY_RETENTION_MS = 7 * MS_PER_DAY

/** Minimum interval between compaction runs (1 hour). */
const COMPACTION_COOLDOWN_MS = MS_PER_HOUR

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let tsDb: IDBDatabase | null = null
let tsDbPromise: Promise<IDBDatabase> | null = null
let lastCompactionTs = 0

const buildBucketKey = (deviceId: string, bucketStart: number): string =>
    `${deviceId}::${bucketStart}`

const parseBucketKey = (key: string): { deviceId: string; bucketStart: number } => {
    const [deviceId = '', bucketRaw = '0'] = key.split('::')
    return {
        deviceId,
        bucketStart: Number(bucketRaw),
    }
}

const groupEntriesByBucket = (
    entries: TimeSeriesEntry[],
    bucketSize: number,
): Map<string, TimeSeriesEntry[]> => {
    const buckets = new Map<string, TimeSeriesEntry[]>()

    for (const entry of entries) {
        const bucketStart = Math.floor(entry.timestamp / bucketSize) * bucketSize
        const key = buildBucketKey(entry.deviceId, bucketStart)
        const existing = buckets.get(key)
        if (existing) {
            existing.push(entry)
            continue
        }
        buckets.set(key, [entry])
    }

    return buckets
}

const buildAggregatedEntry = (
    entries: TimeSeriesEntry[],
    targetResolution: TimeSeriesResolution,
    deviceId: string,
    bucketStart: number,
): Omit<TimeSeriesEntry, 'id'> => {
    let sumTemp = 0
    let sumHum = 0
    let sumVpd = 0
    let sumPh = 0
    let vpdCount = 0
    let phCount = 0
    let totalSamples = 0

    for (const entry of entries) {
        const weight = entry.sampleCount
        sumTemp += entry.temperatureC * weight
        sumHum += entry.humidityPercent * weight
        totalSamples += weight

        if (entry.vpd != null) {
            sumVpd += entry.vpd * weight
            vpdCount += weight
        }
        if (entry.ph != null) {
            sumPh += entry.ph * weight
            phCount += weight
        }
    }

    return {
        deviceId,
        timestamp: bucketStart,
        resolution: targetResolution,
        temperatureC: sumTemp / totalSamples,
        humidityPercent: sumHum / totalSamples,
        vpd: vpdCount > 0 ? sumVpd / vpdCount : null,
        ph: phCount > 0 ? sumPh / phCount : null,
        sampleCount: totalSamples,
    }
}

// ---------------------------------------------------------------------------
// Database connection
// ---------------------------------------------------------------------------

const openTsDb = (): Promise<IDBDatabase> => {
    if (tsDb) return Promise.resolve(tsDb)
    if (tsDbPromise) return tsDbPromise

    tsDbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(TS_DB_NAME, TS_DB_VERSION)

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result
            if (!db.objectStoreNames.contains(TS_STORE)) {
                const store = db.createObjectStore(TS_STORE, {
                    keyPath: 'id',
                    autoIncrement: true,
                })
                store.createIndex('by_device_time', ['deviceId', 'timestamp'], {
                    unique: false,
                })
                store.createIndex('by_resolution_time', ['resolution', 'timestamp'], {
                    unique: false,
                })
                store.createIndex('by_device_resolution', ['deviceId', 'resolution'], {
                    unique: false,
                })
            }
        }

        request.onsuccess = (event) => {
            tsDb = (event.target as IDBOpenDBRequest).result
            tsDb.onclose = () => {
                tsDb = null
                tsDbPromise = null
            }
            tsDb.onversionchange = () => {
                tsDb?.close()
                tsDb = null
                tsDbPromise = null
            }
            resolve(tsDb)
        }

        request.onerror = (event) => {
            tsDbPromise = null
            console.debug(
                '[timeSeriesService] IndexedDB error:',
                (event.target as IDBOpenDBRequest).error,
            )
            reject((event.target as IDBOpenDBRequest).error)
        }
    })

    return tsDbPromise
}

// ---------------------------------------------------------------------------
// VPD calculation (Magnus‐formula approximation)
// ---------------------------------------------------------------------------

const calculateVpd = (tempC: number, humidityPercent: number): number => {
    const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3))
    return Math.max(0, svp * (1 - humidityPercent / 100))
}

const buildRawEntry = (deviceId: string, reading: SensorReading): Omit<TimeSeriesEntry, 'id'> => ({
    deviceId,
    timestamp: reading.receivedAt,
    resolution: 'raw',
    temperatureC: reading.temperatureC,
    humidityPercent: reading.humidityPercent,
    vpd: calculateVpd(reading.temperatureC, reading.humidityPercent),
    ph: reading.ph ?? null,
    sampleCount: 1,
})

interface StatsAccumulator {
    sumTemp: number
    sumHum: number
    sumVpd: number
    sumPh: number
    minTemp: number
    maxTemp: number
    minHum: number
    maxHum: number
    vpdCount: number
    phCount: number
    totalSamples: number
}

const createStatsAccumulator = (): StatsAccumulator => ({
    sumTemp: 0,
    sumHum: 0,
    sumVpd: 0,
    sumPh: 0,
    minTemp: Infinity,
    maxTemp: -Infinity,
    minHum: Infinity,
    maxHum: -Infinity,
    vpdCount: 0,
    phCount: 0,
    totalSamples: 0,
})

const updateStatsAccumulator = (acc: StatsAccumulator, entry: TimeSeriesEntry): void => {
    const weight = entry.sampleCount
    acc.sumTemp += entry.temperatureC * weight
    acc.sumHum += entry.humidityPercent * weight
    acc.minTemp = Math.min(acc.minTemp, entry.temperatureC)
    acc.maxTemp = Math.max(acc.maxTemp, entry.temperatureC)
    acc.minHum = Math.min(acc.minHum, entry.humidityPercent)
    acc.maxHum = Math.max(acc.maxHum, entry.humidityPercent)
    acc.totalSamples += weight

    if (entry.vpd != null) {
        acc.sumVpd += entry.vpd * weight
        acc.vpdCount += weight
    }

    if (entry.ph != null) {
        acc.sumPh += entry.ph * weight
        acc.phCount += weight
    }
}

const buildAggregatedStats = (acc: StatsAccumulator): AggregatedStats => ({
    avgTemperature: acc.sumTemp / acc.totalSamples,
    avgHumidity: acc.sumHum / acc.totalSamples,
    avgVpd: acc.vpdCount > 0 ? acc.sumVpd / acc.vpdCount : null,
    avgPh: acc.phCount > 0 ? acc.sumPh / acc.phCount : null,
    minTemperature: acc.minTemp,
    maxTemperature: acc.maxTemp,
    minHumidity: acc.minHum,
    maxHumidity: acc.maxHum,
    sampleCount: acc.totalSamples,
})

const readEligibleEntries = async (
    db: IDBDatabase,
    sourceResolution: TimeSeriesResolution,
    olderThan: number,
): Promise<TimeSeriesEntry[]> =>
    new Promise<TimeSeriesEntry[]>((resolve, reject) => {
        const tx = db.transaction(TS_STORE, 'readonly')
        tx.onerror = () => reject(tx.error)

        const index = tx.objectStore(TS_STORE).index('by_resolution_time')
        const range = IDBKeyRange.bound([sourceResolution, 0], [sourceResolution, olderThan])
        const results: TimeSeriesEntry[] = []

        const req = index.openCursor(range)
        req.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
            if (!cursor) {
                resolve(results)
                return
            }
            results.push(cursor.value as TimeSeriesEntry)
            cursor.continue()
        }
    })

const writeAggregatesAndDeleteOriginals = async (
    db: IDBDatabase,
    buckets: Map<string, TimeSeriesEntry[]>,
    targetResolution: TimeSeriesResolution,
): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(TS_STORE, 'readwrite')
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        const store = tx.objectStore(TS_STORE)

        for (const [key, entries] of buckets) {
            const { deviceId, bucketStart } = parseBucketKey(key)
            store.add(buildAggregatedEntry(entries, targetResolution, deviceId, bucketStart))

            for (const entry of entries) {
                if (entry.id != null) store.delete(entry.id)
            }
        }
    })
}

// ---------------------------------------------------------------------------
// Core write
// ---------------------------------------------------------------------------

export const timeSeriesService = {
    /**
     * Persist a sensor reading as a raw time-series entry.
     * Triggers background compaction when the cooldown has elapsed.
     */
    async recordReading(deviceId: string, reading: SensorReading): Promise<void> {
        const entry = buildRawEntry(deviceId, reading)

        const db = await openTsDb()
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(TS_STORE, 'readwrite')
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            tx.objectStore(TS_STORE).add(entry)
        })

        const now = Date.now()
        if (now - lastCompactionTs > COMPACTION_COOLDOWN_MS) {
            lastCompactionTs = now
            this.runCompaction().catch((err) =>
                console.debug('[timeSeriesService] Compaction failed:', err),
            )
        }
    },

    /**
     * Batch-record multiple readings at once.
     */
    async recordBatch(deviceId: string, readings: SensorReading[]): Promise<void> {
        if (readings.length === 0) return

        const db = await openTsDb()
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(TS_STORE, 'readwrite')
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            const store = tx.objectStore(TS_STORE)

            for (const reading of readings) {
                store.add(buildRawEntry(deviceId, reading) satisfies Omit<TimeSeriesEntry, 'id'>)
            }
        })
    },

    // -----------------------------------------------------------------------
    // Query
    // -----------------------------------------------------------------------

    /**
     * Retrieve time-series entries for a device within a time range.
     * Automatically selects the best resolution when none is specified.
     */
    async query(options: TimeSeriesQueryOptions): Promise<TimeSeriesEntry[]> {
        const { deviceId, from, to, limit } = options
        const resolution = options.resolution ?? this.autoResolution(from, to)

        const db = await openTsDb()
        return new Promise<TimeSeriesEntry[]>((resolve, reject) => {
            const tx = db.transaction(TS_STORE, 'readonly')
            tx.onerror = () => reject(tx.error)

            const store = tx.objectStore(TS_STORE)
            const index = store.index('by_device_time')
            const range = IDBKeyRange.bound([deviceId, from], [deviceId, to])
            const results: TimeSeriesEntry[] = []

            const request = index.openCursor(range)
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
                if (!cursor) {
                    resolve(results)
                    return
                }

                const entry = cursor.value as TimeSeriesEntry
                if (entry.resolution === resolution) {
                    results.push(entry)
                    if (limit && results.length >= limit) {
                        resolve(results)
                        return
                    }
                }
                cursor.continue()
            }
        })
    },

    /**
     * Compute aggregated statistics for a device over a range.
     */
    async getStats(deviceId: string, from: number, to: number): Promise<AggregatedStats> {
        const entries = await this.query({ deviceId, from, to })

        if (entries.length === 0) {
            return {
                avgTemperature: 0,
                avgHumidity: 0,
                avgVpd: null,
                avgPh: null,
                minTemperature: 0,
                maxTemperature: 0,
                minHumidity: 0,
                maxHumidity: 0,
                sampleCount: 0,
            }
        }

        const acc = createStatsAccumulator()

        for (const e of entries) {
            updateStatsAccumulator(acc, e)
        }

        return buildAggregatedStats(acc)
    },

    // -----------------------------------------------------------------------
    // Compaction / Aggregation
    // -----------------------------------------------------------------------

    /**
     * Run the two-phase compaction:
     *   1. Raw readings older than 24 h -> hourly averages
     *   2. Hourly entries older than 7 days -> daily averages
     */
    async runCompaction(): Promise<{ aggregatedHourly: number; aggregatedDaily: number }> {
        const now = Date.now()
        const hourly = await this.aggregate('raw', now - RAW_RETENTION_MS, MS_PER_HOUR, 'hourly')
        const daily = await this.aggregate('hourly', now - HOURLY_RETENTION_MS, MS_PER_DAY, 'daily')
        return { aggregatedHourly: hourly, aggregatedDaily: daily }
    },

    /**
     * Generic aggregation: collapse entries of `sourceResolution` older than
     * `olderThan` into buckets of `bucketSize` ms, writing entries at
     * `targetResolution`, then deleting the originals.
     */
    async aggregate(
        sourceResolution: TimeSeriesResolution,
        olderThan: number,
        bucketSize: number,
        targetResolution: TimeSeriesResolution,
    ): Promise<number> {
        const db = await openTsDb()
        const eligible = await readEligibleEntries(db, sourceResolution, olderThan)

        if (eligible.length === 0) return 0
        const buckets = groupEntriesByBucket(eligible, bucketSize)
        await writeAggregatesAndDeleteOriginals(db, buckets, targetResolution)

        return eligible.length
    },

    // -----------------------------------------------------------------------
    // Utilities
    // -----------------------------------------------------------------------

    /**
     * Select the best resolution for a given time range.
     */
    autoResolution(from: number, to: number): TimeSeriesResolution {
        const span = to - from
        if (span <= MS_PER_DAY) return 'raw'
        if (span <= 7 * MS_PER_DAY) return 'hourly'
        return 'daily'
    },

    /**
     * Count total entries across all resolutions.
     */
    async getEntryCount(): Promise<number> {
        const db = await openTsDb()
        return new Promise<number>((resolve, reject) => {
            const tx = db.transaction(TS_STORE, 'readonly')
            tx.onerror = () => reject(tx.error)
            const req = tx.objectStore(TS_STORE).count()
            req.onsuccess = () => resolve(req.result)
        })
    },

    /**
     * Delete all time-series data for a specific device.
     */
    async clearDevice(deviceId: string): Promise<void> {
        const db = await openTsDb()
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(TS_STORE, 'readwrite')
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)

            const index = tx.objectStore(TS_STORE).index('by_device_time')
            const range = IDBKeyRange.bound([deviceId, 0], [deviceId, Number.MAX_SAFE_INTEGER])

            const req = index.openCursor(range)
            req.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
                if (!cursor) return
                cursor.delete()
                cursor.continue()
            }
        })
    },

    /**
     * Force-close the database connection (useful for testing).
     */
    close(): void {
        tsDb?.close()
        tsDb = null
        tsDbPromise = null
    },
}
