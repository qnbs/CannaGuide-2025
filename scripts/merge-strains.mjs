import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const strainsDir = path.join(repoRoot, 'data', 'strains')
const reportDir = path.join(repoRoot, 'artifacts')
const reportPath = path.join(reportDir, 'strain-merge-report.json')

const isStrainFile = (fileName) => fileName.endsWith('.ts') && fileName !== 'index.ts'
const idRegex = /"id"\s*:\s*"([^"]+)"/g

const extractIds = (content) => {
    const ids = []
    for (const match of content.matchAll(idRegex)) {
        ids.push(match[1])
    }
    return ids
}

const run = async () => {
    const files = (await fs.readdir(strainsDir)).filter(isStrainFile).sort()
    const byFile = {}
    const allIds = []

    for (const fileName of files) {
        const filePath = path.join(strainsDir, fileName)
        const content = await fs.readFile(filePath, 'utf8')
        const ids = extractIds(content)
        byFile[fileName] = { count: ids.length, ids }
        allIds.push(...ids)
    }

    const idCounts = allIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1
        return acc
    }, {})

    const duplicateIds = Object.entries(idCounts)
        .filter(([, count]) => count > 1)
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => a.id.localeCompare(b.id))

    const mergedIds = [...new Set(allIds)].sort((a, b) => a.localeCompare(b))

    const report = {
        generatedAt: new Date().toISOString(),
        source: 'data/strains/*.ts',
        filesScanned: files.length,
        totalEntries: allIds.length,
        uniqueEntries: mergedIds.length,
        duplicates: duplicateIds,
        mergedCatalog: {
            ids: mergedIds,
        },
        byFile,
    }

    await fs.mkdir(reportDir, { recursive: true })
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

    if (duplicateIds.length > 0) {
        const message = `[merge-strains] Found ${duplicateIds.length} duplicate strain id(s). See ${path.relative(repoRoot, reportPath)}.`
        if (process.env.STRICT_STRAIN_MERGE === '1') {
            console.error(message)
            process.exit(1)
        }
        console.log(message)
    }

    console.log(
        `[merge-strains] Merged ${allIds.length} entries into ${mergedIds.length} unique ids.`,
    )
    console.log(`[merge-strains] Report written to ${path.relative(repoRoot, reportPath)}.`)
}

run().catch((error) => {
    console.error('[merge-strains] Failed:', error)
    process.exit(1)
})
