import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'

const execFile = promisify(execFileCb)

const BASE_REF = process.env.BASE_REF || 'origin/main'
const DATA_PATH = 'apps/web/data/strains'

// Match both JSON ("id": "value") and TS object literal (id: 'value' | "value") forms.
const idRegex = /\bid\s*:\s*['"]([^'"]+)['"]/g
const nameRegex = /\bname\s*:\s*['"]([^'"]+)['"]/g

const parseIds = (content) => {
    const ids = []
    for (const match of content.matchAll(idRegex)) {
        ids.push(match[1])
    }
    return ids
}

const parseNames = (content) => {
    const names = []
    for (const match of content.matchAll(nameRegex)) {
        names.push(match[1])
    }
    return names
}

/** Normalize a strain name for fuzzy comparison */
const normalizeName = (name) =>
    name
        .toLowerCase()
        .replace(
            /\s+(auto|autoflower|autoflowering|feminized|fem|reg|regular|fast|f1|s1|bx\d?|ibl)\s*$/i,
            '',
        )
        .replace(/[^a-z0-9]/g, '')
        .trim()

/**
 * Levenshtein distance with an early-exit threshold. Returns the distance
 * if it's <= `threshold`, or `Infinity` otherwise. Two-row dynamic
 * programming (O(min(m, n)) memory).
 */
const levenshtein = (a, b, threshold = 2) => {
    if (a === b) return 0
    if (Math.abs(a.length - b.length) > threshold) return Infinity

    let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
    let curr = new Array(b.length + 1).fill(0)
    for (let i = 1; i <= a.length; i++) {
        curr[0] = i
        let rowMin = curr[0]
        for (let j = 1; j <= b.length; j++) {
            const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
            curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
            if (curr[j] < rowMin) rowMin = curr[j]
        }
        if (rowMin > threshold) return Infinity
        ;[prev, curr] = [curr, prev]
    }
    return prev[b.length]
}

const getFilesAtRef = async (ref) => {
    const { stdout } = await execFile('git', ['ls-tree', '-r', '--name-only', ref, DATA_PATH])
    return stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.endsWith('.ts') && !line.endsWith('/index.ts'))
}

const getFileContentAtRef = async (ref, filePath) => {
    const { stdout } = await execFile('git', ['show', `${ref}:${filePath}`])
    return stdout
}

const buildDuplicateCountMap = async (ref) => {
    const files = await getFilesAtRef(ref)
    const counts = new Map()

    for (const filePath of files) {
        const content = await getFileContentAtRef(ref, filePath)
        const ids = parseIds(content)
        for (const id of ids) {
            counts.set(id, (counts.get(id) || 0) + 1)
        }
    }

    const duplicates = new Map()
    for (const [id, count] of counts.entries()) {
        if (count > 1) {
            duplicates.set(id, count)
        }
    }

    return duplicates
}

/** Build a map of normalizedName -> [originalName, ...] across all strain files at a git ref */
const buildNormalizedNameMap = async (ref) => {
    const files = await getFilesAtRef(ref)
    const nameMap = new Map()

    for (const filePath of files) {
        const content = await getFileContentAtRef(ref, filePath)
        const names = parseNames(content)
        for (const name of names) {
            const norm = normalizeName(name)
            if (norm.length < 3) continue
            const existing = nameMap.get(norm) ?? []
            existing.push(name)
            nameMap.set(norm, existing)
        }
    }

    return nameMap
}

const run = async () => {
    try {
        const baseDuplicates = await buildDuplicateCountMap(BASE_REF)
        const headDuplicates = await buildDuplicateCountMap('HEAD')

        const introduced = []
        const worsened = []

        for (const [id, headCount] of headDuplicates.entries()) {
            const baseCount = baseDuplicates.get(id) || 0
            if (baseCount === 0) {
                introduced.push({ id, baseCount, headCount })
            } else if (headCount > baseCount) {
                worsened.push({ id, baseCount, headCount })
            }
        }

        // Fuzzy name-based duplicate detection for newly introduced strains
        let headNameMap
        try {
            headNameMap = await buildNormalizedNameMap('HEAD')
        } catch {
            // Non-fatal: fuzzy check may fail if git context is unavailable
            headNameMap = new Map()
        }

        const fuzzyDuplicates = []
        for (const [norm, names] of headNameMap.entries()) {
            if (names.length > 1) {
                // Check if this was already present in base (to avoid flagging pre-existing issues)
                let baseNameMap
                try {
                    baseNameMap = await buildNormalizedNameMap(BASE_REF)
                    const baseNames = baseNameMap.get(norm)
                    if (baseNames && baseNames.length >= names.length) continue
                } catch {
                    // Continue without base comparison
                }
                fuzzyDuplicates.push({ normalized: norm, names, kind: 'normalized' })
            }
        }

        // Levenshtein-based detection: catch typo-level duplicates that survive
        // normalization (e.g. "Northern Lights" vs "Nothern Lights"). Limited
        // to pairs whose normalized form differs by <=2 edits to keep the
        // O(n^2) sweep tractable for the strain catalog (~ a few thousand keys).
        const normKeys = [...headNameMap.keys()]
        for (let i = 0; i < normKeys.length; i++) {
            const a = normKeys[i]
            for (let j = i + 1; j < normKeys.length; j++) {
                const b = normKeys[j]
                if (Math.abs(a.length - b.length) > 2) continue
                const d = levenshtein(a, b, 2)
                if (d <= 2 && d > 0) {
                    fuzzyDuplicates.push({
                        normalized: `${a} ~ ${b}`,
                        names: [...(headNameMap.get(a) ?? []), ...(headNameMap.get(b) ?? [])],
                        kind: 'levenshtein',
                        distance: d,
                    })
                }
            }
        }

        if (introduced.length === 0 && worsened.length === 0 && fuzzyDuplicates.length === 0) {
            console.log(
                `[check-new-strain-duplicates] OK: no new duplicate ids or fuzzy name duplicates compared to ${BASE_REF}.`,
            )
            return
        }

        if (introduced.length > 0 || worsened.length > 0) {
            console.error(
                `[check-new-strain-duplicates] Found duplicate regressions compared to ${BASE_REF}.`,
            )
            for (const item of introduced) {
                console.error(`  introduced duplicate id: ${item.id} (head=${item.headCount})`)
            }
            for (const item of worsened) {
                console.error(
                    `  worsened duplicate id: ${item.id} (base=${item.baseCount} -> head=${item.headCount})`,
                )
            }
            process.exit(1)
        }

        if (fuzzyDuplicates.length > 0) {
            console.warn(
                `[check-new-strain-duplicates] WARN: ${fuzzyDuplicates.length} fuzzy name duplicate group(s) detected (not blocking):`,
            )
            for (const item of fuzzyDuplicates) {
                const tag =
                    item.kind === 'levenshtein'
                        ? `[lev d=${item.distance}]`
                        : '[normalized]'
                console.warn(`  ${tag} "${item.normalized}": ${item.names.join(', ')}`)
            }
        }
    } catch (error) {
        console.error('[check-new-strain-duplicates] Failed:', error)
        process.exit(1)
    }
}

run()
