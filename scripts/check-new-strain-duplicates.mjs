import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'

const execFile = promisify(execFileCb)

const BASE_REF = process.env.BASE_REF || 'origin/main'
const DATA_PATH = 'data/strains'

const idRegex = /"id"\s*:\s*"([^"]+)"/g

const parseIds = (content) => {
  const ids = []
  for (const match of content.matchAll(idRegex)) {
    ids.push(match[1])
  }
  return ids
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
      console.log(`[check-new-strain-duplicates] OK: no new duplicate ids compared to ${BASE_REF}.`)
      return
    }

    console.error(`[check-new-strain-duplicates] Found duplicate regressions compared to ${BASE_REF}.`)
    for (const item of introduced) {
      console.error(`  introduced duplicate id: ${item.id} (head=${item.headCount})`)
    }
    for (const item of worsened) {
      console.error(`  worsened duplicate id: ${item.id} (base=${item.baseCount} -> head=${item.headCount})`)
    }

    process.exit(1)
  } catch (error) {
    console.error('[check-new-strain-duplicates] Failed:', error)
    process.exit(1)
  }
}

run()
