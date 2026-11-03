import { test, expect } from '@playwright/test'
import { bootFreshAppWithLegalGates, expectShellVisible } from './helpers'

// GH #669: two tabs must not both persist. The first tab owns the saved data;
// a second one pauses behind a notice and takes over once the first is closed.
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
        const notice = second.getByRole('alert').filter({ hasText: /another tab|anderen Tab/i })
        await expect(notice).toBeVisible({ timeout: 30_000 })
        await expect(first.getByRole('alert').filter({ hasText: /another tab/i })).toHaveCount(0)

        await first.close()

        await expect(notice).toBeHidden({ timeout: 30_000 })
        await expectShellVisible(second)
    })
})
