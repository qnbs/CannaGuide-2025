// ---------------------------------------------------------------------------
// pluginService — Dynamic Plugin Architecture for CannaGuide 2025
//
// Enables a modular extension system where users can load "plugins" for:
//   - Fertilizer/nutrient schedules (BioBizz, Canna, Advanced Nutrients, …)
//   - Hardware integrations (Shelly plugs, custom ESP32 firmware, …)
//   - Custom grow profiles / automation recipes
//
// Plugins are sandboxed descriptors — they declare capabilities and data, but
// do NOT execute arbitrary code. This keeps the system secure while still
// extensible.
//
// Storage: Plugin manifests are persisted in IndexedDB (metadata store)
// so they survive across sessions.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The category of functionality a plugin provides.
 */
export type PluginCategory = 'nutrient-schedule' | 'hardware' | 'grow-profile'

/**
 * Every plugin must declare a manifest that describes its capabilities.
 */
export interface PluginManifest {
    /** Unique plugin identifier (reverse-domain style recommended). */
    id: string
    /** Human-readable name. */
    name: string
    /** Version string following semver. */
    version: string
    /** Short description. */
    description: string
    /** Author name or organization. */
    author: string
    /** Plugin category. */
    category: PluginCategory
    /** Minimum CannaGuide app version required (numeric APP_VERSION). */
    minAppVersion?: number
    /** Icon URL (optional, relative to plugin package). */
    icon?: string
    /** Tags for search/filtering. */
    tags?: string[]
}

// ── Nutrient Schedule Plugin ────────────────────────────────────────────

export interface NutrientWeek {
    week: number
    stage: string
    products: Array<{
        name: string
        dosageMlPerLiter: number
    }>
    ecTarget?: number
    phTarget?: [number, number]
    notes?: string
}

export interface NutrientSchedulePlugin extends PluginManifest {
    category: 'nutrient-schedule'
    data: {
        brand: string
        scheduleName: string
        mediumTypes: Array<'Soil' | 'Coco' | 'Hydro'>
        weeks: NutrientWeek[]
        flushWeeks?: number[]
    }
}

// ── Hardware Plugin ─────────────────────────────────────────────────────

export interface HardwareCapability {
    type: 'relay' | 'sensor' | 'dimmer' | 'climate-control'
    description: string
}

export interface HardwareCommand {
    id: string
    name: string
    description: string
    /** MQTT topic template, e.g. "shellies/{deviceId}/relay/0/command" */
    topicTemplate?: string
    /** HTTP endpoint template, e.g. "http://{deviceIp}/relay/0?turn={action}" */
    httpTemplate?: string
    payloadSchema?: Record<string, string>
}

export interface HardwarePlugin extends PluginManifest {
    category: 'hardware'
    data: {
        manufacturer: string
        model: string
        protocol: 'mqtt' | 'http' | 'bluetooth'
        capabilities: HardwareCapability[]
        commands: HardwareCommand[]
        discoveryTopic?: string
    }
}

// ── Grow Profile Plugin ─────────────────────────────────────────────────

export interface GrowProfileStage {
    stage: string
    durationDays: number
    lightHours: number
    tempRange: [number, number]
    humidityRange: [number, number]
    ecRange: [number, number]
    phRange: [number, number]
    notes?: string
}

export interface GrowProfilePlugin extends PluginManifest {
    category: 'grow-profile'
    data: {
        profileName: string
        mediumType: 'Soil' | 'Coco' | 'Hydro'
        stages: GrowProfileStage[]
        totalDurationDays: number
    }
}

export type CannaGuidePlugin = NutrientSchedulePlugin | HardwarePlugin | GrowProfilePlugin

// ── Plugin State ────────────────────────────────────────────────────────

export interface InstalledPlugin {
    manifest: CannaGuidePlugin
    installedAt: number
    enabled: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLUGINS_STORAGE_KEY = 'installed_plugins_v1'
const MAX_PLUGINS = 50

// ---------------------------------------------------------------------------
// In-memory registry
// ---------------------------------------------------------------------------

let plugins: Map<string, InstalledPlugin> = new Map()
let initialized = false

// ---------------------------------------------------------------------------
// Persistence helpers (uses localStorage for simplicity; could use IndexedDB
// metadata store for larger datasets)
// ---------------------------------------------------------------------------

const persistPlugins = (): void => {
    try {
        const serializable = Array.from(plugins.values())
        localStorage.setItem(PLUGINS_STORAGE_KEY, JSON.stringify(serializable))
    } catch {
        console.warn('[pluginService] Failed to persist plugins')
    }
}

const loadPlugins = (): void => {
    if (initialized) return
    try {
        const raw = localStorage.getItem(PLUGINS_STORAGE_KEY)
        if (raw) {
            const parsed = JSON.parse(raw) as InstalledPlugin[]
            if (Array.isArray(parsed)) {
                plugins = new Map(parsed.map((p) => [p.manifest.id, p]))
            }
        }
    } catch {
        console.warn('[pluginService] Failed to load persisted plugins')
    }
    initialized = true
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/
const PLUGIN_ID_REGEX = /^[\w][\w./-]{2,63}$/

const validateManifest = (manifest: CannaGuidePlugin): string[] => {
    const errors: string[] = []

    if (!manifest.id || !PLUGIN_ID_REGEX.test(manifest.id)) {
        errors.push('Invalid plugin ID. Must be 3-64 alphanumeric characters with dots/dashes.')
    }
    if (!manifest.name || manifest.name.length < 2 || manifest.name.length > 100) {
        errors.push('Plugin name must be 2-100 characters.')
    }
    if (!manifest.version || !SEMVER_REGEX.test(manifest.version)) {
        errors.push('Version must follow semver format (e.g. 1.0.0).')
    }
    if (
        !manifest.category ||
        !['nutrient-schedule', 'hardware', 'grow-profile'].includes(manifest.category)
    ) {
        errors.push('Invalid plugin category.')
    }
    if (!manifest.description || manifest.description.length > 500) {
        errors.push('Description is required and must be under 500 characters.')
    }
    if (!manifest.author || manifest.author.length > 100) {
        errors.push('Author is required and must be under 100 characters.')
    }

    return errors
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const pluginService = {
    /**
     * Initialize the plugin registry from persisted storage.
     */
    init(): void {
        loadPlugins()
    },

    /**
     * Install a plugin from its manifest descriptor.
     * Validates the manifest before installation.
     */
    install(manifest: CannaGuidePlugin): { success: boolean; errors: string[] } {
        loadPlugins()

        const errors = validateManifest(manifest)
        if (errors.length > 0) {
            return { success: false, errors }
        }

        if (plugins.size >= MAX_PLUGINS && !plugins.has(manifest.id)) {
            return {
                success: false,
                errors: [`Maximum of ${MAX_PLUGINS} plugins reached. Uninstall a plugin first.`],
            }
        }

        plugins.set(manifest.id, {
            manifest,
            installedAt: Date.now(),
            enabled: true,
        })

        persistPlugins()
        return { success: true, errors: [] }
    },

    /**
     * Uninstall a plugin by ID.
     */
    uninstall(pluginId: string): boolean {
        loadPlugins()
        const removed = plugins.delete(pluginId)
        if (removed) persistPlugins()
        return removed
    },

    /**
     * Enable or disable a plugin without uninstalling it.
     */
    setEnabled(pluginId: string, enabled: boolean): boolean {
        loadPlugins()
        const plugin = plugins.get(pluginId)
        if (!plugin) return false
        plugin.enabled = enabled
        persistPlugins()
        return true
    },

    /**
     * Get a specific installed plugin.
     */
    get(pluginId: string): InstalledPlugin | undefined {
        loadPlugins()
        return plugins.get(pluginId)
    },

    /**
     * List all installed plugins, optionally filtered by category.
     */
    list(category?: PluginCategory): InstalledPlugin[] {
        loadPlugins()
        const all = Array.from(plugins.values())
        if (!category) return all
        return all.filter((p) => p.manifest.category === category)
    },

    /**
     * List only enabled plugins of a given category.
     */
    listEnabled(category?: PluginCategory): InstalledPlugin[] {
        return this.list(category).filter((p) => p.enabled)
    },

    /**
     * Get all nutrient schedule plugins (enabled only).
     */
    getNutrientSchedules(): NutrientSchedulePlugin[] {
        return this.listEnabled('nutrient-schedule').map(
            (p) => p.manifest as NutrientSchedulePlugin,
        )
    },

    /**
     * Get all hardware plugins (enabled only).
     */
    getHardwarePlugins(): HardwarePlugin[] {
        return this.listEnabled('hardware').map((p) => p.manifest as HardwarePlugin)
    },

    /**
     * Get all grow profile plugins (enabled only).
     */
    getGrowProfiles(): GrowProfilePlugin[] {
        return this.listEnabled('grow-profile').map((p) => p.manifest as GrowProfilePlugin)
    },

    /**
     * Search plugins by name or tag.
     */
    search(query: string): InstalledPlugin[] {
        loadPlugins()
        const q = query.toLowerCase()
        return Array.from(plugins.values()).filter(
            (p) =>
                p.manifest.name.toLowerCase().includes(q) ||
                p.manifest.description.toLowerCase().includes(q) ||
                p.manifest.tags?.some((t) => t.toLowerCase().includes(q)),
        )
    },

    /**
     * Import a plugin from a JSON string (e.g. pasted or loaded from file).
     */
    importFromJson(json: string): { success: boolean; errors: string[] } {
        let parsed: unknown
        try {
            parsed = JSON.parse(json)
        } catch {
            return { success: false, errors: ['Invalid JSON.'] }
        }

        if (
            typeof parsed !== 'object' ||
            parsed === null ||
            !('id' in parsed) ||
            !('category' in parsed)
        ) {
            return {
                success: false,
                errors: ['JSON does not appear to be a valid plugin manifest.'],
            }
        }

        return this.install(parsed as CannaGuidePlugin)
    },

    /**
     * Export a plugin as a JSON string for sharing.
     */
    exportToJson(pluginId: string): string | null {
        const plugin = this.get(pluginId)
        if (!plugin) return null
        return JSON.stringify(plugin.manifest, null, 2)
    },

    /**
     * Reset all plugins (for testing or recovery).
     */
    reset(): void {
        plugins.clear()
        localStorage.removeItem(PLUGINS_STORAGE_KEY)
        initialized = false
    },
}
