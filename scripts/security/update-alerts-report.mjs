import { writeFile } from 'node:fs/promises'

const token = process.env.GITHUB_TOKEN
const repositoryFromEnv = process.env.GITHUB_REPOSITORY ?? ''
const [ownerFromRepo, nameFromRepo] = repositoryFromEnv.split('/')
const owner = process.env.REPO_OWNER ?? ownerFromRepo ?? 'qnbs'
const repo = process.env.REPO_NAME ?? nameFromRepo ?? 'CannaGuide-2025'
const branch = process.env.REPO_BRANCH ?? 'main'

if (!token) {
    throw new Error('GITHUB_TOKEN is required to query alert APIs.')
}

const apiBase = 'https://api.github.com'
const commonHeaders = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'cannaguide-security-alert-bot',
    'X-GitHub-Api-Version': '2022-11-28',
}

const fetchJson = async (url) => {
    const response = await fetch(url, { headers: commonHeaders })
    if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`GitHub API ${response.status}: ${errorBody}`)
    }
    return response.json()
}

const fetchPaginated = async (path) => {
    const items = []
    for (let page = 1; page <= 10; page += 1) {
        const data = await fetchJson(
            `${apiBase}${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`,
        )
        if (!Array.isArray(data) || data.length === 0) {
            break
        }
        items.push(...data)
        if (data.length < 100) {
            break
        }
    }
    return items
}

const fetchSinglePage = async (path) => {
    const separator = path.includes('?') ? '&' : '?'
    const data = await fetchJson(`${apiBase}${path}${separator}per_page=100`)
    return Array.isArray(data) ? data : []
}

const safeFetch = async (fn) => {
    try {
        return { ok: true, value: await fn() }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return { ok: false, error: message }
    }
}

const countBy = (items, selector) => {
    const map = new Map()
    for (const item of items) {
        const key = selector(item)
        map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
}

const renderCountTable = (title, entries) => {
    const normalized = [...entries]
    normalized.sort((a, b) => a[0].localeCompare(b[0]))

    const rows = normalized.length
        ? normalized.map(([severity, count]) => `| ${severity} | ${count} |`).join('\n')
        : '| n/a | 0 |'

    return [`### ${title}`, '', '| Severity | Count |', '| --- | ---: |', rows, ''].join('\n')
}

const now = new Date().toISOString()

const [dependabotResult, codeScanningResult, codeqlRunsResult] = await Promise.all([
    safeFetch(() => fetchSinglePage(`/repos/${owner}/${repo}/dependabot/alerts?state=open`)),
    safeFetch(() => fetchPaginated(`/repos/${owner}/${repo}/code-scanning/alerts?state=open`)),
    safeFetch(() =>
        fetchJson(
            `${apiBase}/repos/${owner}/${repo}/actions/workflows/codeql.yml/runs?branch=${branch}&per_page=3`,
        ),
    ),
])

const dependabotAlerts = dependabotResult.ok ? dependabotResult.value : []
const codeScanningAlerts = codeScanningResult.ok ? codeScanningResult.value : []
const codeqlRuns = codeqlRunsResult.ok ? (codeqlRunsResult.value.workflow_runs ?? []) : []

const dependabotBySeverity = countBy(
    dependabotAlerts,
    (alert) => alert.security_vulnerability?.severity?.toLowerCase?.() ?? 'unknown',
)
const codeScanningBySeverity = countBy(codeScanningAlerts, (alert) => {
    const level = alert.rule?.security_severity_level ?? alert.rule?.severity ?? 'unknown'
    return String(level).toLowerCase()
})

const latestDependabot = [...dependabotAlerts]
    .sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? ''))
    .slice(0, 8)

const latestCodeScanning = [...codeScanningAlerts]
    .sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? ''))
    .slice(0, 8)

const codeqlRows = codeqlRuns.length
    ? codeqlRuns
          .slice(0, 3)
          .map(
              (run) =>
                  `| ${run.display_title ?? 'CodeQL'} | ${run.status ?? 'unknown'} | ${run.conclusion ?? 'n/a'} | ${run.html_url ?? ''} |`,
          )
          .join('\n')
    : '| n/a | n/a | n/a | n/a |'

const dependabotRows = latestDependabot.length
    ? latestDependabot
          .map((alert) => {
              const severity = alert.security_vulnerability?.severity ?? 'unknown'
              const pkg = alert.dependency?.package?.name ?? 'unknown-package'
              const url = alert.html_url ?? ''
              return `| ${severity} | ${pkg} | ${url} |`
          })
          .join('\n')
    : '| none | - | - |'

const codeScanningRows = latestCodeScanning.length
    ? latestCodeScanning
          .map((alert) => {
              const severity =
                  alert.rule?.security_severity_level ?? alert.rule?.severity ?? 'unknown'
              const ruleId = alert.rule?.id ?? 'unknown-rule'
              const url = alert.html_url ?? ''
              return `| ${severity} | ${ruleId} | ${url} |`
          })
          .join('\n')
    : '| none | - | - |'

const executionNotes = []
if (!dependabotResult.ok) {
    executionNotes.push(`- Dependabot API error: ${dependabotResult.error}`)
}
if (!codeScanningResult.ok) {
    executionNotes.push(`- Code scanning API error: ${codeScanningResult.error}`)
}
if (!codeqlRunsResult.ok) {
    executionNotes.push(`- CodeQL runs API error: ${codeqlRunsResult.error}`)
}

const markdown = [
    '# Security Alerts Status',
    '',
    '> Auto-generated by `.github/workflows/security-alerts-handoff.yml` via `scripts/security/update-alerts-report.mjs`.',
    '',
    `- Generated (UTC): ${now}`,
    `- Repository: ${owner}/${repo}`,
    `- Branch baseline: ${branch}`,
    `- Open Dependabot alerts: ${dependabotAlerts.length}`,
    `- Open Code Scanning alerts: ${codeScanningAlerts.length}`,
    '',
    renderCountTable('Dependabot Severity Distribution', dependabotBySeverity.entries()),
    renderCountTable('Code Scanning Severity Distribution', codeScanningBySeverity.entries()),
    '### Latest CodeQL Runs',
    '',
    '| Title | Status | Conclusion | URL |',
    '| --- | --- | --- | --- |',
    codeqlRows,
    '',
    '### Recent Open Dependabot Alerts',
    '',
    '| Severity | Package | URL |',
    '| --- | --- | --- |',
    dependabotRows,
    '',
    '### Recent Open Code Scanning Alerts',
    '',
    '| Severity | Rule | URL |',
    '| --- | --- | --- |',
    codeScanningRows,
    '',
    '### Notes',
    '',
    ...(executionNotes.length > 0
        ? executionNotes
        : [
              '- API queries completed successfully.',
              '- Use this report as handoff baseline for next remediation wave.',
          ]),
    '',
].join('\n')

await writeFile('docs/security-alerts-status.md', markdown, 'utf8')
console.log('Updated docs/security-alerts-status.md')
