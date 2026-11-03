import { test, expect, type Page } from '@playwright/test'
import { bootFreshAppWithLegalGates, expectShellVisible } from './helpers'

// GH #669: two tabs must not both persist. The first tab owns the saved data;
// a second one pauses behind a notice and takes over once the first is closed.
// The notice text follows the app language, so match every shipped translation
// of common.otherTab.title.
const OTHER_TAB_NOTICE = /another tab|anderen Tab|otra pesta\u00f1a|autre onglet|ander tabblad/iu

// Same for common.staleTab.title.
const STALE_TAB_NOTICE =
    /changed in another tab|in einem anderen tab ge\u00e4ndert|cambiado en otra pesta\u00f1a|modifi\u00e9 dans un autre onglet|gewijzigd in een ander tabblad/iu

const REVISION_KEY = 'cannaguide-redux-storage-revision'

const readStoredRevision = (page: Page): Promise<string | null> =>
    page.evaluate(
        (key) =>
            new Promise<string | null>((resolve, reject) => {
                const open = indexedDB.open('CannaGuideStateDB')
                open.onerror = () => reject(open.error)
                open.onsuccess = () => {
                    const db = open.result
                    const read = db
                        .transaction('zustand_state')
                        .objectStore('zustand_state')
                        .get(key)
                    read.onerror = () => reject(read.error)
                    read.onsuccess = () => {
                        db.close()
                        resolve(typeof read.result === 'string' ? read.result : null)
                    }
                }
            }),
        REVISION_KEY,
    )

const staleNoticeCount = (page: Page) =>
    page.getByRole('alert').filter({ hasText: STALE_TAB_NOTICE }).count()

test.describe('Single writer tab (GH #669)', () => {
    test('a second tab pauses instead of overwriting, then takes over', async ({
        context,
        baseURL,
    }) => {
        const first = await context.newPage()
        await bootFreshAppWithLegalGates(first, baseURL)
        await expectShellVisible(first)

        const second = await context.newPage()
        await bootFreshAppWithLegalGates(second, baseURL)
        const notice = second.getByRole('alert').filter({ hasText: OTHER_TAB_NOTICE })
        await expect(notice).toBeVisible({ timeout: 30_000 })
        await expect(first.getByRole('alert').filter({ hasText: OTHER_TAB_NOTICE })).toHaveCount(0)

        await first.close()

        await expect(notice).toBeHidden({ timeout: 30_000 })
        await expectShellVisible(second)
    })

    test('without Web Locks a tab with outdated data is refused, not saved over the newer data', async ({
        context,
        baseURL,
    }) => {
        // A browser without Web Locks cannot tell which tab owns the data, so both
        // start as writers; the stored revision is what stops the older copy.
        await context.addInitScript(() => {
            Object.defineProperty(Navigator.prototype, 'locks', {
                configurable: true,
                get: () => undefined,
            })
        })
        const first = await context.newPage()
        await bootFreshAppWithLegalGates(first, baseURL)
        await expectShellVisible(first)
        const second = await context.newPage()
        await bootFreshAppWithLegalGates(second, baseURL)

        // Both tabs save when they are hidden or closed; the one that loaded the
        // older revision has to be told to reload. The event is sent again on every
        // poll, because a tab only listens once its start has finished.
        await expect
            .poll(
                async () => {
                    await first.evaluate(() => window.dispatchEvent(new Event('pagehide')))
                    await second.evaluate(() => window.dispatchEvent(new Event('pagehide')))
                    return (await staleNoticeCount(first)) + (await staleNoticeCount(second))
                },
                { timeout: 60_000 },
            )
            .toBeGreaterThan(0)

        // The refused tab must have written nothing. With the other tab closed, any
        // change of the stored revision after this point would be its doing.
        const refused = (await staleNoticeCount(first)) > 0 ? first : second
        const writer = refused === first ? second : first
        await writer.close()
        await refused.waitForTimeout(1_500)
        const before = await readStoredRevision(refused)
        expect(before).not.toBeNull()
        for (let attempt = 0; attempt < 3; attempt += 1) {
            await refused.evaluate(() => window.dispatchEvent(new Event('pagehide')))
        }
        await refused.waitForTimeout(1_500)
        expect(await readStoredRevision(refused)).toBe(before)
    })
})
