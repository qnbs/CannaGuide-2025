// ---------------------------------------------------------------------------
// contextBridgeService -- Cross-Module Context Awareness for CannaGuide 2025
//
// Automatically builds rich, cross-module context for AI prompts based on
// the user's current view, selected plant, active diseases, recent journal
// entries, IoT state, and knowledge graph connections.
//
// This replaces ad-hoc context gathering scattered across views and
// centralizes it into a single, consistent service consumed by:
//   1. AI Mentor (MentorChatView)
//   2. Plant Advisor (ProactiveCoachService)
//   3. Disease Atlas (contextual tips)
//   4. Learning Paths (adaptive recommendations)
//   5. Sandbox (experiment context)
// ---------------------------------------------------------------------------

import { knowledgeGraph, type QueryContext, type CrossModuleLink } from './knowledgeGraphService'
import { View, KnowledgeViewTab } from '@/types'
import type { Plant, PlantStage, AppSettings } from '@/types'

// ---------------------------------------------------------------------------
// Context Snapshot -- immutable snapshot of current app context
// ---------------------------------------------------------------------------

export interface ContextSnapshot {
    /** Current main view (Plants, Strains, Knowledge, etc.) */
    readonly currentView: View
    /** Current sub-tab within the view */
    readonly currentTab?: KnowledgeViewTab | string | undefined
    /** Currently selected plant (if any) */
    readonly selectedPlant?: PlantContext | undefined
    /** Active plants summary */
    readonly activePlants: PlantContext[]
    /** Recent journal entries across all plants (last 10) */
    readonly recentJournal: JournalSummary[]
    /** Related knowledge graph links */
    readonly relatedKnowledge: CrossModuleLink[]
    /** User experience level */
    readonly userLevel: 'beginner' | 'intermediate' | 'expert'
    /** Current language */
    readonly language: string
    /** Active problems across all plants */
    readonly activeProblems: ProblemSummary[]
    /** Timestamp of snapshot creation */
    readonly timestamp: number
}

export interface PlantContext {
    readonly id: string
    readonly name: string
    readonly stage: PlantStage
    readonly health: number
    readonly strain: string
    readonly age: number
    readonly vpd?: number | undefined
    readonly problemCount: number
}

export interface JournalSummary {
    readonly plantName: string
    readonly type: string
    readonly notes: string
    readonly createdAt: number
}

export interface ProblemSummary {
    readonly plantName: string
    readonly type: string
    readonly severity: number
}

// ---------------------------------------------------------------------------
// Context Bridge Implementation
// ---------------------------------------------------------------------------

class ContextBridge {
    private _lastSnapshot: ContextSnapshot | undefined
    private _lastSnapshotTime = 0
    private readonly CACHE_TTL_MS = 5000

    /**
     * Build a full context snapshot from the current app state.
     * Cached for 5 seconds to avoid repeated computation.
     */
    buildSnapshot(params: {
        currentView: View
        currentTab?: KnowledgeViewTab | string
        selectedPlant?: Plant
        activePlants: Plant[]
        settings: AppSettings
    }): ContextSnapshot {
        const now = Date.now()
        if (
            this._lastSnapshot &&
            now - this._lastSnapshotTime < this.CACHE_TTL_MS &&
            this._lastSnapshot.currentView === params.currentView &&
            this._lastSnapshot.currentTab === params.currentTab
        ) {
            return this._lastSnapshot
        }

        // Ensure graph is initialized with plant data
        knowledgeGraph.initialize()
        if (params.activePlants.length > 0) {
            knowledgeGraph.injectPlants(params.activePlants)
        }

        // Build plant contexts
        const activePlants = params.activePlants.map(plantToContext)
        const selectedPlant = params.selectedPlant
            ? plantToContext(params.selectedPlant)
            : undefined

        // Gather recent journal entries
        const recentJournal = gatherRecentJournal(params.activePlants, 10)

        // Gather active problems
        const activeProblems = gatherActiveProblems(params.activePlants)

        // Build knowledge graph query context
        const queryContext: QueryContext = {
            plantId: params.selectedPlant?.id,
            currentStage: params.selectedPlant?.stage,
            currentView: params.currentView,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            currentTab: params.currentTab as KnowledgeViewTab | undefined,
            keywords: extractKeywords(params.selectedPlant, params.activePlants),
            maxResults: 8,
        }

        const relatedKnowledge = knowledgeGraph.getRelatedLinks(queryContext)

        // Determine user level from settings
        const userLevel = params.settings.simulation?.simulationProfile ?? 'intermediate'

        const snapshot: ContextSnapshot = {
            currentView: params.currentView,
            currentTab: params.currentTab,
            selectedPlant,
            activePlants,
            recentJournal,
            relatedKnowledge,
            userLevel,
            language: params.settings.general?.language ?? 'en',
            activeProblems,
            timestamp: now,
        }

        this._lastSnapshot = snapshot
        this._lastSnapshotTime = now
        return snapshot
    }

    /**
     * Build an enriched system prompt for AI calls.
     * Combines static instructions with dynamic context from the snapshot.
     */
    buildAiSystemContext(snapshot: ContextSnapshot): string {
        const parts: string[] = []

        // 1. User context
        parts.push(`User Level: ${snapshot.userLevel}`)
        parts.push(`Language: ${snapshot.language}`)
        parts.push(
            `Current View: ${snapshot.currentView}${snapshot.currentTab ? ` > ${snapshot.currentTab}` : ''}`,
        )

        // 2. Plant context
        if (snapshot.selectedPlant) {
            const p = snapshot.selectedPlant
            parts.push(
                `\nSelected Plant: "${p.name}" (${p.strain}), Stage: ${p.stage}, Health: ${p.health}/100, Age: ${p.age} days${p.vpd !== undefined ? `, VPD: ${p.vpd.toFixed(2)} kPa` : ''}`,
            )
            if (p.problemCount > 0) {
                parts.push(`  Active Problems: ${p.problemCount}`)
            }
        }

        if (snapshot.activePlants.length > 0 && !snapshot.selectedPlant) {
            parts.push(`\nActive Plants: ${snapshot.activePlants.length}`)
            for (const p of snapshot.activePlants.slice(0, 3)) {
                parts.push(`  - "${p.name}" (${p.strain}): ${p.stage}, Health ${p.health}/100`)
            }
        }

        // 3. Recent activity
        if (snapshot.recentJournal.length > 0) {
            parts.push('\nRecent Journal:')
            for (const j of snapshot.recentJournal.slice(0, 5)) {
                const ago = formatTimeAgo(j.createdAt)
                parts.push(
                    `  - [${j.type}] ${j.plantName}: ${j.notes.slice(0, 80)}${j.notes.length > 80 ? '...' : ''} (${ago})`,
                )
            }
        }

        // 4. Active problems
        if (snapshot.activeProblems.length > 0) {
            parts.push('\nActive Problems:')
            for (const prob of snapshot.activeProblems.slice(0, 5)) {
                parts.push(`  - ${prob.plantName}: ${prob.type} (severity ${prob.severity}/10)`)
            }
        }

        // 5. Knowledge graph context
        if (snapshot.relatedKnowledge.length > 0) {
            parts.push('\nRelated Knowledge:')
            for (const link of snapshot.relatedKnowledge.slice(0, 5)) {
                parts.push(`  - [${link.nodeType}] ${link.label} (via ${link.relationPath})`)
            }
        }

        return parts.join('\n')
    }

    /**
     * Get contextual suggestions based on the current view.
     * Returns navigation hints for cross-module discovery.
     */
    getSuggestions(snapshot: ContextSnapshot): CrossModuleSuggestion[] {
        const suggestions: CrossModuleSuggestion[] = []

        // Plant has problems -> suggest Disease Atlas
        for (const prob of snapshot.activeProblems) {
            suggestions.push({
                type: 'navigate',
                label: `${prob.plantName}: ${prob.type}`,
                description: 'Open Disease Atlas for diagnosis help',
                targetView: View.Knowledge,
                targetTab: KnowledgeViewTab.Atlas,
                priority: prob.severity >= 7 ? 'high' : 'medium',
            })
        }

        // Suggest related knowledge
        for (const link of snapshot.relatedKnowledge.slice(0, 3)) {
            suggestions.push({
                type: 'related',
                label: link.label,
                description: `Related ${link.nodeType} via ${link.relationPath}`,
                targetView: link.targetView,
                targetTab: link.targetTab,
                priority: link.relevanceScore > 0.7 ? 'high' : 'low',
            })
        }

        return suggestions
            .sort((a, b) => priorityValue(b.priority) - priorityValue(a.priority))
            .slice(0, 6)
    }

    /** Clear the cached snapshot (e.g. on view change). */
    invalidate(): void {
        this._lastSnapshot = undefined
        this._lastSnapshotTime = 0
    }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrossModuleSuggestion {
    readonly type: 'navigate' | 'related' | 'action'
    readonly label: string
    readonly description: string
    readonly targetView: View
    readonly targetTab?: string | undefined
    readonly priority: 'high' | 'medium' | 'low'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function plantToContext(plant: Plant): PlantContext {
    return {
        id: plant.id,
        name: plant.name,
        stage: plant.stage,
        health: plant.health,
        strain: plant.strain?.name ?? 'Unknown',
        age: plant.age ?? 0,
        vpd: plant.environment?.vpd,
        problemCount: plant.problems?.length ?? 0,
    }
}

function gatherRecentJournal(plants: Plant[], limit: number): JournalSummary[] {
    const entries: JournalSummary[] = []
    for (const plant of plants) {
        if (!plant.journal) continue
        for (const entry of plant.journal.slice(-5)) {
            entries.push({
                plantName: plant.name,
                type: entry.type,
                notes: entry.notes ?? '',
                createdAt: entry.createdAt,
            })
        }
    }
    return entries.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit)
}

function gatherActiveProblems(plants: Plant[]): ProblemSummary[] {
    const problems: ProblemSummary[] = []
    for (const plant of plants) {
        if (!plant.problems) continue
        for (const prob of plant.problems) {
            problems.push({
                plantName: plant.name,
                type: prob.type,
                severity: prob.severity,
            })
        }
    }
    return problems.sort((a, b) => b.severity - a.severity)
}

function extractKeywords(selectedPlant: Plant | undefined, activePlants: Plant[]): string[] {
    const keywords: string[] = []

    if (selectedPlant) {
        if (selectedPlant.strain?.name) keywords.push(selectedPlant.strain.name)
        keywords.push(selectedPlant.stage)
        if (selectedPlant.problems) {
            for (const p of selectedPlant.problems.slice(0, 3)) {
                keywords.push(p.type)
            }
        }
    }

    // Add common keywords from active plants
    const stages = new Set<string>()
    for (const p of activePlants) {
        stages.add(p.stage)
    }
    for (const s of stages) {
        if (!keywords.includes(s)) keywords.push(s)
    }

    return keywords.slice(0, 8)
}

function formatTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

function priorityValue(p: 'high' | 'medium' | 'low'): number {
    if (p === 'high') return 3
    if (p === 'medium') return 2
    return 1
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const contextBridge = new ContextBridge()
