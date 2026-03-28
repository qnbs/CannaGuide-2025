import { test, expect } from '@playwright/experimental-ct-react'
import AxeBuilder from '@axe-core/playwright'
import { Card } from '../../components/common/Card'

test.describe('Card Component', () => {
    test('renders children content', async ({ mount }) => {
        const component = await mount(
            <Card>
                <p>Card content</p>
            </Card>,
        )
        await expect(component).toContainText('Card content')
        await expect(component).toBeVisible()
    })

    test('applies custom className', async ({ mount }) => {
        const component = await mount(<Card className="my-custom-class">Styled</Card>)
        await expect(component).toBeVisible()
    })

    test('handles interactive click', async ({ mount }) => {
        let clicked = false
        const component = await mount(
            <Card
                onClick={() => {
                    clicked = true
                }}
            >
                Clickable Card
            </Card>,
        )
        await component.click()
        expect(clicked).toBe(true)
    })

    test('meets axe accessibility standards', async ({ mount, page }) => {
        await mount(<Card>Accessible Card Content</Card>)
        const results = await new AxeBuilder({ page }).analyze()
        expect(results.violations).toEqual([])
    })
})
