import { test, expect } from '@playwright/experimental-ct-react'
import AxeBuilder from '@axe-core/playwright'
import { Input } from '../../components/ui/input'

test.describe('Input Component', () => {
    test('renders with default type text', async ({ mount }) => {
        const component = await mount(<Input placeholder="Enter text" />)
        await expect(component).toBeVisible()
        await expect(component).toHaveAttribute('type', 'text')
    })

    test('renders with specific type', async ({ mount }) => {
        const component = await mount(<Input type="email" placeholder="Email" />)
        await expect(component).toHaveAttribute('type', 'email')
    })

    test('handles disabled state', async ({ mount }) => {
        const component = await mount(<Input disabled placeholder="Disabled" />)
        await expect(component).toBeDisabled()
    })

    test('accepts user input', async ({ mount }) => {
        const component = await mount(<Input placeholder="Type here" />)
        await component.fill('Hello world')
        await expect(component).toHaveValue('Hello world')
    })

    test('meets axe accessibility standards', async ({ mount, page }) => {
        await mount(
            <div>
                <label htmlFor="test-input">Test Label</label>
                <Input id="test-input" placeholder="Accessible input" />
            </div>,
        )
        const results = await new AxeBuilder({ page }).analyze()
        expect(results.violations).toEqual([])
    })
})
