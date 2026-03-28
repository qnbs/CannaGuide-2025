import { describe, it, expect, beforeEach } from 'vitest'
import { pluginService } from './pluginService'
import type { NutrientSchedulePlugin, HardwarePlugin, GrowProfilePlugin } from './pluginService'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const biobizzPlugin: NutrientSchedulePlugin = {
    id: 'com.biobizz.organic-schedule',
    name: 'BioBizz Organic Schedule',
    version: '1.0.0',
    description: 'Complete BioBizz organic nutrient schedule for soil grows.',
    author: 'BioBizz',
    category: 'nutrient-schedule',
    tags: ['organic', 'soil', 'biobizz'],
    data: {
        brand: 'BioBizz',
        scheduleName: 'Organic Grow & Bloom',
        mediumTypes: ['Soil'],
        weeks: [
            {
                week: 1,
                stage: 'Seedling',
                products: [{ name: 'Bio-Grow', dosageMlPerLiter: 1 }],
                ecTarget: 0.6,
                phTarget: [6.0, 6.5],
            },
            {
                week: 4,
                stage: 'Vegetative',
                products: [
                    { name: 'Bio-Grow', dosageMlPerLiter: 3 },
                    { name: 'Fish-Mix', dosageMlPerLiter: 2 },
                ],
                ecTarget: 1.2,
                phTarget: [6.0, 6.5],
            },
            {
                week: 8,
                stage: 'Flowering',
                products: [
                    { name: 'Bio-Bloom', dosageMlPerLiter: 4 },
                    { name: 'Top-Max', dosageMlPerLiter: 3 },
                ],
                ecTarget: 1.6,
                phTarget: [6.0, 6.5],
            },
        ],
        flushWeeks: [10, 11],
    },
}

const shellyPlugin: HardwarePlugin = {
    id: 'com.shelly.plug-s',
    name: 'Shelly Plug S',
    version: '1.0.0',
    description: 'Control Shelly Plug S smart outlets for light/fan automation.',
    author: 'Shelly',
    category: 'hardware',
    tags: ['shelly', 'smart-plug', 'relay'],
    data: {
        manufacturer: 'Shelly',
        model: 'Plug S',
        protocol: 'http',
        capabilities: [
            { type: 'relay', description: 'On/Off relay for connected device' },
            { type: 'sensor', description: 'Power consumption monitoring' },
        ],
        commands: [
            {
                id: 'toggle',
                name: 'Toggle Relay',
                description: 'Toggle the relay on or off',
                httpTemplate: 'http://{deviceIp}/relay/0?turn={action}',
                payloadSchema: { action: 'on | off' },
            },
        ],
        discoveryTopic: 'shellies/announce',
    },
}

const growProfile: GrowProfilePlugin = {
    id: 'org.cannaguide.coco-auto',
    name: 'Coco Autoflower Profile',
    version: '1.0.0',
    description: 'Optimized grow profile for autoflowers in coco coir.',
    author: 'CannaGuide',
    category: 'grow-profile',
    data: {
        profileName: 'Coco Autoflower Express',
        mediumType: 'Coco',
        totalDurationDays: 75,
        stages: [
            {
                stage: 'Seedling',
                durationDays: 10,
                lightHours: 20,
                tempRange: [24, 28],
                humidityRange: [65, 75],
                ecRange: [0.4, 0.8],
                phRange: [5.8, 6.2],
            },
            {
                stage: 'Vegetative',
                durationDays: 25,
                lightHours: 20,
                tempRange: [22, 28],
                humidityRange: [50, 65],
                ecRange: [1.0, 1.6],
                phRange: [5.8, 6.2],
            },
            {
                stage: 'Flowering',
                durationDays: 40,
                lightHours: 20,
                tempRange: [20, 26],
                humidityRange: [40, 55],
                ecRange: [1.2, 1.8],
                phRange: [5.8, 6.2],
            },
        ],
    },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('pluginService', () => {
    beforeEach(() => {
        pluginService.reset()
    })

    describe('install', () => {
        it('installs a valid nutrient schedule plugin', () => {
            const result = pluginService.install(biobizzPlugin)
            expect(result.success).toBe(true)
            expect(result.errors).toEqual([])
            expect(pluginService.list().length).toBe(1)
        })

        it('installs a valid hardware plugin', () => {
            const result = pluginService.install(shellyPlugin)
            expect(result.success).toBe(true)
        })

        it('installs a valid grow profile plugin', () => {
            const result = pluginService.install(growProfile)
            expect(result.success).toBe(true)
        })

        it('rejects a plugin with invalid ID', () => {
            const result = pluginService.install({ ...biobizzPlugin, id: 'x' })
            expect(result.success).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })

        it('rejects a plugin with missing version', () => {
            const result = pluginService.install({ ...biobizzPlugin, version: '' })
            expect(result.success).toBe(false)
        })

        it('overwrites an existing plugin on re-install', () => {
            pluginService.install(biobizzPlugin)
            const updated = { ...biobizzPlugin, version: '2.0.0' }
            const result = pluginService.install(updated)
            expect(result.success).toBe(true)
            expect(pluginService.get(biobizzPlugin.id)?.manifest.version).toBe('2.0.0')
        })
    })

    describe('uninstall', () => {
        it('removes an installed plugin', () => {
            pluginService.install(biobizzPlugin)
            expect(pluginService.uninstall(biobizzPlugin.id)).toBe(true)
            expect(pluginService.list().length).toBe(0)
        })

        it('returns false for unknown plugin', () => {
            expect(pluginService.uninstall('nonexistent')).toBe(false)
        })
    })

    describe('enable/disable', () => {
        it('disables and re-enables a plugin', () => {
            pluginService.install(biobizzPlugin)
            pluginService.setEnabled(biobizzPlugin.id, false)
            expect(pluginService.get(biobizzPlugin.id)?.enabled).toBe(false)
            expect(pluginService.listEnabled().length).toBe(0)

            pluginService.setEnabled(biobizzPlugin.id, true)
            expect(pluginService.listEnabled().length).toBe(1)
        })
    })

    describe('filtering', () => {
        it('filters by category', () => {
            pluginService.install(biobizzPlugin)
            pluginService.install(shellyPlugin)
            pluginService.install(growProfile)

            expect(pluginService.list('nutrient-schedule').length).toBe(1)
            expect(pluginService.list('hardware').length).toBe(1)
            expect(pluginService.list('grow-profile').length).toBe(1)
        })

        it('provides typed accessors for each category', () => {
            pluginService.install(biobizzPlugin)
            pluginService.install(shellyPlugin)
            pluginService.install(growProfile)

            expect(pluginService.getNutrientSchedules()).toHaveLength(1)
            expect(pluginService.getHardwarePlugins()).toHaveLength(1)
            expect(pluginService.getGrowProfiles()).toHaveLength(1)
        })
    })

    describe('search', () => {
        it('finds plugins by name', () => {
            pluginService.install(biobizzPlugin)
            pluginService.install(shellyPlugin)

            const results = pluginService.search('biobizz')
            expect(results.length).toBe(1)
            expect(results[0]?.manifest.id).toBe(biobizzPlugin.id)
        })

        it('finds plugins by tag', () => {
            pluginService.install(biobizzPlugin)
            const results = pluginService.search('organic')
            expect(results.length).toBe(1)
        })
    })

    describe('import/export', () => {
        it('exports and re-imports a plugin via JSON', () => {
            pluginService.install(biobizzPlugin)
            const json = pluginService.exportToJson(biobizzPlugin.id)
            expect(json).toBeTruthy()

            pluginService.reset()
            const result = pluginService.importFromJson(json!)
            expect(result.success).toBe(true)
            expect(pluginService.list().length).toBe(1)
        })

        it('rejects invalid JSON', () => {
            const result = pluginService.importFromJson('not-json')
            expect(result.success).toBe(false)
        })

        it('rejects JSON without required fields', () => {
            const result = pluginService.importFromJson('{"name": "test"}')
            expect(result.success).toBe(false)
        })
    })
})
