import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'

const execFile = promisify(execFileCb)

const BASE_REF = process.env.BASE_REF || 'origin/main'
const DATA_PATH = 'data/strains'

const idRegex = /"id"\s*:\s*"([^"]+)"/g
const nameRegex = /"name"\s*:\s*"([^"]+)"/g

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
                fuzzyDuplicates.push({ normalized: norm, names })
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
                console.warn(`  "${item.normalized}": ${item.names.join(', ')}`)
            }
        }
    } catch (error) {
        console.error('[check-new-strain-duplicates] Failed:', error)
        process.exit(1)
    }
}

run()

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

        if (introduced.length === 0 && worsened.length === 0) {
            console.log(
                `[check-new-strain-duplicates] OK: no new duplicate ids compared to ${BASE_REF}.`,
            )
            return
        }

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
    } catch (error) {
        console.error('[check-new-strain-duplicates] Failed:', error)
        process.exit(1)
    }
}

run()
