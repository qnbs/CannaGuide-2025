// ---------------------------------------------------------------------------
// AI Rate Limiter & Cost Tracker
// ---------------------------------------------------------------------------
// Sliding-window rate limiter + per-day token cost estimator.
// All state is in-memory (rate limiter) or localStorage (cost tracker).
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10

const COST_TRACKER_STORAGE_KEY = 'cg.ai.costTracker'
const AUDIT_LOG_STORAGE_KEY = 'cg.ai.auditLog'
const AUDIT_LOG_LIMIT = 50

// Rough token estimates per endpoint (prompt + completion combined)
const TOKEN_ESTIMATES: Record<string, number> = {
    getEquipmentRecommendation: 2800,
    diagnosePlant: 3200,
    getPlantAdvice: 1800,
    getProactiveDiagnosis: 1800,
    getMentorResponse: 2400,
    getStrainTips: 1600,
    generateStrainImage: 1000,
    generateDeepDive: 3500,
    getGardenStatusSummary: 1600,
    getGrowLogRagAnswer: 2000,
    getDynamicLoadingMessages: 400,
}

// ---------------------------------------------------------------------------
// Rate Limiter (in-memory sliding window)
// ---------------------------------------------------------------------------

const requestTimestamps: number[] = []

function pruneWindow(): void {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS
    while (requestTimestamps.length > 0 && (requestTimestamps[0] ?? 0) < cutoff) {
        requestTimestamps.shift()
    }
}

/** Throws if rate limit exceeded. Call before every AI request. */
function checkRateLimit(): void {
    pruneWindow()
    if (requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
        const oldestTs = requestTimestamps[0] ?? 0
        const retryAfterMs = RATE_LIMIT_WINDOW_MS - (Date.now() - oldestTs)
        const retryAfterSec = Math.ceil(retryAfterMs / 1000)
        throw new Error(`ai.error.rateLimited:${retryAfterSec}`)
    }
}

/** Record a successful request. Call after checkRateLimit passes. */
function recordRequest(): void {
    requestTimestamps.push(Date.now())
}

/** Number of remaining requests in the current window. */
function getRemainingRequests(): number {
    pruneWindow()
    return Math.max(0, RATE_LIMIT_MAX_REQUESTS - requestTimestamps.length)
}

// ---------------------------------------------------------------------------
// Cost Tracker (localStorage, per-day buckets)
// ---------------------------------------------------------------------------

interface DayCost {
    date: string // ISO date string (YYYY-MM-DD)
    totalTokens: number
    requestCount: number
    estimatedCostUsd: number
}

interface CostTrackerState {
    days: DayCost[]
}

interface AuditLogEntry {
    timestamp: number
    endpoint: string
}

function todayKey(): string {
    return new Date().toISOString().slice(0, 10)
}

function loadCostState(): CostTrackerState {
    try {
        const raw = localStorage.getItem(COST_TRACKER_STORAGE_KEY)
        if (!raw) return { days: [] }
        const parsed = JSON.parse(raw) as CostTrackerState
        if (!Array.isArray(parsed.days)) return { days: [] }
        // Keep only last 30 days
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)
        const cutoffStr = cutoff.toISOString().slice(0, 10)
        parsed.days = parsed.days.filter((d) => d.date >= cutoffStr)
        return parsed
    } catch {
        return { days: [] }
    }
}

function saveCostState(state: CostTrackerState): void {
    try {
        localStorage.setItem(COST_TRACKER_STORAGE_KEY, JSON.stringify(state))
    } catch {
        /* quota exceeded — non-critical */
    }
}

/** Record estimated token usage for an endpoint. */
function trackTokenUsage(endpoint: string): void {
    const tokens = TOKEN_ESTIMATES[endpoint] ?? 1500
    const state = loadCostState()
    const today = todayKey()
    const existing = state.days.find((d) => d.date === today)
    if (existing) {
        existing.totalTokens += tokens
        existing.requestCount += 1
    } else {
        state.days.push({ date: today, totalTokens: tokens, requestCount: 1, estimatedCostUsd: 0 })
    }
    saveCostState(state)
}

/** Report actual token usage from API response metadata + compute cost. */
function reportActualUsage(
    endpoint: string,
    metadata: { promptTokens: number; completionTokens: number; totalTokens: number },
    pricing?: { inputPer1MTokens: number; outputPer1MTokens: number } | undefined,
): void {
    const estimated = TOKEN_ESTIMATES[endpoint] ?? 1500
    const actualTotal = metadata.totalTokens
    const delta = actualTotal - estimated

    const state = loadCostState()
    const today = todayKey()
    const existing = state.days.find((d) => d.date === today)
    if (existing) {
        // Correct the estimated tokens with actual values
        existing.totalTokens += delta
    }

    // Compute cost if pricing is available
    if (pricing && existing) {
        const cost =
            (metadata.promptTokens * pricing.inputPer1MTokens +
                metadata.completionTokens * pricing.outputPer1MTokens) /
            1_000_000
        existing.estimatedCostUsd += cost
    }

    saveCostState(state)

    // Also correct the monthly budget with the delta
    if (delta !== 0) {
        const budget = loadBudget()
        budget.spent += delta
        saveBudget(budget)
    }
}

/** Get today's estimated usage. */
function getTodayUsage(): DayCost {
    const state = loadCostState()
    const today = todayKey()
    return (
        state.days.find((d) => d.date === today) ?? {
            date: today,
            totalTokens: 0,
            requestCount: 0,
            estimatedCostUsd: 0,
        }
    )
}

/** Get usage for the last N days. */
function getUsageHistory(days = 7): DayCost[] {
    const state = loadCostState()
    return state.days.slice(-days)
}

/** Clear all cost tracking data. */
function clearCostHistory(): void {
    localStorage.removeItem(COST_TRACKER_STORAGE_KEY)
}

function loadAuditLog(): AuditLogEntry[] {
    try {
        const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw) as AuditLogEntry[]
        if (!Array.isArray(parsed)) return []
        return parsed
            .filter(
                (entry) =>
                    typeof entry.timestamp === 'number' && typeof entry.endpoint === 'string',
            )
            .slice(0, AUDIT_LOG_LIMIT)
    } catch {
        return []
    }
}

function saveAuditLog(entries: AuditLogEntry[]): void {
    try {
        localStorage.setItem(
            AUDIT_LOG_STORAGE_KEY,
            JSON.stringify(entries.slice(0, AUDIT_LOG_LIMIT)),
        )
    } catch {
        // Ignore quota failures for best-effort audit logging.
    }
}

function recordAuditEntry(endpoint: string): void {
    const entries = loadAuditLog()
    entries.unshift({ timestamp: Date.now(), endpoint })
    saveAuditLog(entries)
}

function getAuditLog(): AuditLogEntry[] {
    return loadAuditLog()
}

function clearAuditLog(): void {
    localStorage.removeItem(AUDIT_LOG_STORAGE_KEY)
}

function resetForTests(): void {
    requestTimestamps.length = 0
}

// ---------------------------------------------------------------------------
// Monthly Token Budget
// ---------------------------------------------------------------------------

const BUDGET_STORAGE_KEY = 'cg.ai.monthlyBudget'

interface MonthlyBudget {
    /** Max tokens per month (0 = unlimited). */
    limit: number
    /** Current month key (YYYY-MM). */
    month: string
    /** Tokens spent this month. */
    spent: number
}

function currentMonthKey(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function loadBudget(): MonthlyBudget {
    try {
        const raw = localStorage.getItem(BUDGET_STORAGE_KEY)
        if (!raw) return { limit: 0, month: currentMonthKey(), spent: 0 }
        const parsed = JSON.parse(raw) as MonthlyBudget
        // Reset if month rolled over
        if (parsed.month !== currentMonthKey()) {
            return { limit: parsed.limit, month: currentMonthKey(), spent: 0 }
        }
        return parsed
    } catch {
        return { limit: 0, month: currentMonthKey(), spent: 0 }
    }
}

function saveBudget(budget: MonthlyBudget): void {
    try {
        localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budget))
    } catch {
        /* best-effort */
    }
}

/** Set the monthly token budget limit (0 = unlimited). */
function setMonthlyBudgetLimit(limit: number): void {
    const budget = loadBudget()
    budget.limit = limit
    saveBudget(budget)
}

/** Get current budget state. */
function getMonthlyBudget(): MonthlyBudget {
    return loadBudget()
}

/** Check if budget is exceeded. Returns null if unlimited, otherwise usage percentage. */
function getBudgetUsagePercent(): number | null {
    const budget = loadBudget()
    if (budget.limit <= 0) return null
    return Math.min(100, Math.round((budget.spent / budget.limit) * 100))
}

/** Track tokens against monthly budget. */
function trackBudgetUsage(tokens: number): void {
    const budget = loadBudget()
    budget.spent += tokens
    saveBudget(budget)
}

/** Get estimated cost for an endpoint (in estimated tokens). */
function getEstimatedTokens(endpoint: string): number {
    return TOKEN_ESTIMATES[endpoint] ?? 1500
}

// ---------------------------------------------------------------------------
// Combined guard: check rate limit, record request, track cost
// ---------------------------------------------------------------------------

/** Call before every AI API request. Throws on rate limit or budget exceeded. */
function acquireSlot(endpoint: string): void {
    checkRateLimit()

    // Check monthly budget before allowing request
    const budget = loadBudget()
    if (budget.limit > 0 && budget.spent >= budget.limit) {
        throw new Error('ai.error.budgetExceeded')
    }

    recordRequest()
    const tokens = TOKEN_ESTIMATES[endpoint] ?? 1500
    trackTokenUsage(endpoint)
    trackBudgetUsage(tokens)
    recordAuditEntry(endpoint)
}

export const aiRateLimiter = {
    acquireSlot,
    checkRateLimit,
    recordRequest,
    getRemainingRequests,
    trackTokenUsage,
    reportActualUsage,
    getTodayUsage,
    getUsageHistory,
    clearCostHistory,
    getAuditLog,
    clearAuditLog,
    resetForTests,
    // Monthly budget
    setMonthlyBudgetLimit,
    getMonthlyBudget,
    getBudgetUsagePercent,
    getEstimatedTokens,
}
