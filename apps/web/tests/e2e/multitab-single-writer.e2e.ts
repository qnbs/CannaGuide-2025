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
const REDUX_STATE_KEY = 'cannaguide-redux-storage'
const UNSAVED_STALE_EDITS_NOTICE =
    /not saved and are lost when you reload|nicht gespeichert und gehen beim Neuladen verloren|no se han guardado y se perder\u00E1n al recargar|n'ont pas \u00E9t\u00E9 enregistr\u00E9es et seront perdues au rechargement|niet opgeslagen en gaan verloren bij het opnieuw laden/iu

type StoredSnapshot = {
    simulation?: {
        plants?: { ids?: string[]; entities?: Record<string, unknown> }
        plantSlots?: (string | null)[]
    }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const isStoredSnapshot = (value: unknown): value is StoredSnapshot => {
    if (!isRecord(value)) return false
    if (value.simulation === undefined) return true
    if (!isRecord(value.simulation)) return false

    const { plants, plantSlots } = value.simulation
    if (plants !== undefined) {
        if (!isRecord(plants)) return false
        if (
            plants.ids !== undefined &&
            (!Array.isArray(plants.ids) || !plants.ids.every((id) => typeof id === 'string'))
        ) {
            return false
        }
        if (plants.entities !== undefined && !isRecord(plants.entities)) return false
    }
    return (
        plantSlots === undefined ||
        (Array.isArray(plantSlots) &&
            plantSlots.every((slot) => slot === null || typeof slot === 'string'))
    )
}

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

const readStoredSnapshot = async (page: Page): Promise<StoredSnapshot | null> => {
    const serialized = await page.evaluate(
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
        REDUX_STATE_KEY,
    )

    if (serialized === null) return null

    const parsed: unknown = JSON.parse(serialized)
    if (!isStoredSnapshot(parsed)) throw new Error('Stored Redux snapshot has an invalid shape.')
    return parsed
}

const plantCardCount = (page: Page) => page.locator('main [data-testid="plant-card"]').count()

const addPlantThroughTheUi = async (page: Page, expectedPlantCount: number, strainIndex = 0) => {
    await page.locator('[data-view-id="plants"]').first().click()
    await page.getByTestId('empty-plant-slot').first().locator('button').click()

    const firstStrain = page.getByTestId('strain-option').nth(strainIndex)
    await expect(firstStrain).toBeVisible()
    await firstStrain.click()

    const setupDialog = page.getByRole('dialog')
    const floweringMode = setupDialog.getByTestId('flowering-mode-section')
    if (await floweringMode.count()) await floweringMode.getByRole('button').first().click()
    await setupDialog.getByTestId('grow-setup-confirm').click()

    const confirmationDialog = page.getByRole('dialog')
    await confirmationDialog.getByTestId('grow-confirmation-confirm').click()
    await expect.poll(() => plantCardCount(page)).toBe(expectedPlantCount)
}

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

    test('refuses a stale background snapshot that would delete a foreground plant', async ({
        context,
        baseURL,
    }) => {
        // Without Web Locks both tabs can edit, so the snapshot revision must reject
        // the background tab's full snapshot after the foreground tab has saved.
        await context.addInitScript(() => {
            Object.defineProperty(Navigator.prototype, 'locks', {
                configurable: true,
                get: () => undefined,
            })
        })

        const background = await context.newPage()
        await bootFreshAppWithLegalGates(background, baseURL)
        await expectShellVisible(background)
        await addPlantThroughTheUi(background, 1)
        await expect
            .poll(
                async () => (await readStoredSnapshot(background))?.simulation?.plants?.ids?.length,
            )
            .toBe(1)
        const baseline = await readStoredSnapshot(background)
        expect(baseline?.simulation?.plants?.ids).toHaveLength(1)

        const foreground = await context.newPage()
        await bootFreshAppWithLegalGates(foreground, baseURL)
        await expectShellVisible(foreground)
        await expect
            .poll(async () => {
                const snapshot = await readStoredSnapshot(foreground)
                return {
                    plants: snapshot?.simulation?.plants,
                    plantSlots: snapshot?.simulation?.plantSlots,
                }
            })
            .toEqual({
                plants: baseline?.simulation?.plants,
                plantSlots: baseline?.simulation?.plantSlots,
            })

        await addPlantThroughTheUi(foreground, 2)
        await expect
            .poll(
                async () => (await readStoredSnapshot(foreground))?.simulation?.plants?.ids?.length,
            )
            .toBe(2)
        const accepted = await readStoredSnapshot(foreground)
        const acceptedIds = accepted?.simulation?.plants?.ids ?? []
        expect(acceptedIds).toHaveLength(2)
        const acceptedSecondPlantId = acceptedIds[1]
        expect(acceptedSecondPlantId).toBeDefined()
        expect(accepted?.simulation?.plants?.entities?.[acceptedSecondPlantId ?? '']).toBeDefined()
        expect(accepted?.simulation?.plantSlots).toContain(acceptedSecondPlantId)

        // The stale background snapshot still contains only the baseline plant;
        // persisting it would delete the foreground tab's distinct new plant.
        // The stale-page warning pauses the UI, so the test exercises its pending
        // full-snapshot save rather than trying to edit after the pause.
        const staleNotice = background.getByRole('alert').filter({ hasText: STALE_TAB_NOTICE })
        await expect
            .poll(async () => {
                await background.evaluate(() => window.dispatchEvent(new Event('pagehide')))
                return staleNoticeCount(background)
            })
            .toBe(1)
        await expect(staleNotice).toContainText(UNSAVED_STALE_EDITS_NOTICE)
        await expect(staleNotice.locator('button')).toBeVisible()
        await expect.poll(() => readStoredSnapshot(background)).toEqual(accepted)
    })
})
