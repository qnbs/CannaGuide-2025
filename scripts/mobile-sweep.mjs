import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.DEPLOY_BASE_URL || 'https://qnbs.github.io/CannaGuide-2025/'
const outDir = path.resolve('artifacts/mobile-sweep')

const screens = [
  { id: 'plants', run: async (p) => { await clickBottomNavByView(p, 'plants') } },
  { id: 'strains-all', run: async (p) => { await clickBottomNavByView(p, 'strains'); await clickSubNavIndex(p, 0) } },
  { id: 'strains-my', run: async (p) => { await clickBottomNavByView(p, 'strains'); await clickSubNavIndex(p, 1) } },
  { id: 'strains-favorites', run: async (p) => { await clickBottomNavByView(p, 'strains'); await clickSubNavIndex(p, 2) } },
  { id: 'strains-genealogy', run: async (p) => { await clickBottomNavByView(p, 'strains'); await clickSubNavIndex(p, 3) } },
  { id: 'strains-exports', run: async (p) => { await clickBottomNavByView(p, 'strains'); await clickSubNavIndex(p, 4) } },
  { id: 'strains-tips', run: async (p) => { await clickBottomNavByView(p, 'strains'); await clickSubNavIndex(p, 5) } },
  { id: 'equipment-config', run: async (p) => { await clickBottomNavByView(p, 'equipment'); await clickSubNavIndex(p, 0) } },
  { id: 'equipment-setups', run: async (p) => { await clickBottomNavByView(p, 'equipment'); await clickSubNavIndex(p, 1) } },
  { id: 'equipment-shops', run: async (p) => { await clickBottomNavByView(p, 'equipment'); await clickSubNavIndex(p, 3) } },
  { id: 'knowledge-mentor', run: async (p) => { await clickBottomNavByView(p, 'knowledge'); await clickSubNavIndex(p, 0) } },
  { id: 'knowledge-guide', run: async (p) => { await clickBottomNavByView(p, 'knowledge'); await clickSubNavIndex(p, 1) } },
  { id: 'knowledge-archive', run: async (p) => { await clickBottomNavByView(p, 'knowledge'); await clickSubNavIndex(p, 2) } },
  { id: 'knowledge-breeding', run: async (p) => { await clickBottomNavByView(p, 'knowledge'); await clickSubNavIndex(p, 3) } },
  { id: 'knowledge-sandbox', run: async (p) => { await clickBottomNavByView(p, 'knowledge'); await clickSubNavIndex(p, 4) } },
]

async function ensureOnboardingClosed(page) {
  const dialog = page.getByRole('dialog')
  if (!(await dialog.isVisible().catch(() => false))) return
  for (let i = 0; i < 6; i += 1) {
    if (!(await dialog.isVisible().catch(() => false))) break
    await dialog.locator('button').last().click()
    await page.waitForTimeout(180)
  }
}

async function clickBottomNavByView(page, viewId) {
  const btn = page.locator(`[data-view-id="${viewId}"]:visible`).first()
  await btn.click()
  await page.waitForTimeout(250)
}

async function clickSubNavIndex(page, index) {
  const subNavButtons = page.locator('main nav button:visible')
  const count = await subNavButtons.count()
  if (count <= index) return
  await subNavButtons.nth(index).click()
  await page.waitForTimeout(250)
}

async function detectOcclusion(page) {
  return page.evaluate(() => {
    const navCandidates = Array.from(document.querySelectorAll('nav'))
    const nav = navCandidates.find((candidate) => candidate.querySelector('[data-view-id]')) || null
    const main = document.querySelector('main')
    if (!nav || !main) return { issues: [], navFound: false }

    const navRect = nav.getBoundingClientRect()
    const mainRect = main.getBoundingClientRect()
    const navOverlapsMain = navRect.top < mainRect.bottom
    if (!navOverlapsMain) {
      return { issues: [], navFound: true }
    }

    const selector = 'button, a, input, select, textarea, [role="button"]'
    const nodes = Array.from(main.querySelectorAll(selector)).filter((el) => {
      const rect = el.getBoundingClientRect()
      return rect.width > 10 && rect.height > 10
    })

    const issues = []
    for (const el of nodes) {
      const rect = el.getBoundingClientRect()
      const intersects = rect.bottom > navRect.top && rect.top < navRect.bottom
      if (!intersects) continue

      const centerX = Math.max(1, Math.min(window.innerWidth - 1, rect.left + rect.width / 2))
      const centerY = Math.max(1, Math.min(window.innerHeight - 1, rect.top + rect.height / 2))
      const centerVisibleInMain = centerY >= mainRect.top && centerY <= mainRect.bottom
      const centerVisibleInViewport = centerY >= 0 && centerY <= window.innerHeight
      if (!centerVisibleInMain || !centerVisibleInViewport) {
        continue
      }

      const hit = document.elementFromPoint(centerX, centerY)
      const covered = hit && !el.contains(hit) && !hit.contains(el)
      if (covered) {
        issues.push({
          tag: el.tagName,
          text: (el.textContent || '').trim().slice(0, 80),
          className: (el.className || '').toString().slice(0, 120),
          rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
        })
      }
    }

    return { issues, navFound: true }
  })
}

async function run() {
  await fs.mkdir(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await ensureOnboardingClosed(page)

  const report = []

  for (const screen of screens) {
    await screen.run(page)

    const main = page.locator('main')
    await main.evaluate((node) => {
      node.scrollTop = 0
    })
    await page.waitForTimeout(150)
    const top = await detectOcclusion(page)

    await main.evaluate((node) => {
      node.scrollTop = node.scrollHeight
    })
    await page.waitForTimeout(200)
    const bottom = await detectOcclusion(page)

    const fileName = `${screen.id}.png`
    await page.screenshot({ path: path.join(outDir, fileName), fullPage: false })

    report.push({
      screen: screen.id,
      topIssues: top.issues,
      bottomIssues: bottom.issues,
      screenshot: fileName,
    })
  }

  await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify({ baseUrl: BASE_URL, report }, null, 2))
  await browser.close()

  const total = report.reduce((sum, r) => sum + r.topIssues.length + r.bottomIssues.length, 0)
  console.log(`screens=${report.length} potentialOcclusionIssues=${total}`)
  console.log(path.join(outDir, 'report.json'))
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
