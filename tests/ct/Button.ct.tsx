import { test, expect } from '@playwright/experimental-ct-react'
import { Button } from '../../components/ui/button'

test.describe('Button Component', () => {
  test('renders with default variant', async ({ mount }) => {
    const component = await mount(<Button>Click me</Button>)
    await expect(component).toContainText('Click me')
    await expect(component).toBeVisible()
  })

  test('renders with secondary variant', async ({ mount }) => {
    const component = await mount(<Button variant="secondary">Secondary</Button>)
    await expect(component).toContainText('Secondary')
  })

  test('renders with destructive variant', async ({ mount }) => {
    const component = await mount(<Button variant="destructive">Delete</Button>)
    await expect(component).toContainText('Delete')
  })

  test('handles disabled state', async ({ mount }) => {
    const component = await mount(<Button disabled>Disabled</Button>)
    await expect(component).toBeDisabled()
  })

  test('fires click event', async ({ mount }) => {
    let clicked = false
    const component = await mount(
      <Button onClick={() => { clicked = true }}>Click</Button>
    )
    await component.click()
    expect(clicked).toBe(true)
  })

  test('renders with different sizes', async ({ mount }) => {
    const smButton = await mount(<Button size="sm">Small</Button>)
    await expect(smButton).toBeVisible()

    const lgButton = await mount(<Button size="lg">Large</Button>)
    await expect(lgButton).toBeVisible()
  })
})
