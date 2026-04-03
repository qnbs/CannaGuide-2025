import { test, expect } from '@playwright/experimental-ct-react'
import SparklineChart from '../../components/common/SparklineChart'

// ---------------------------------------------------------------------------
// SparklineChart Component Tests
//
// Verifies SVG rendering, accessibility attributes, empty-state fallback,
// and prop-driven behaviour (showDots, highlightLast, showArea).
// ---------------------------------------------------------------------------

const sevenDayVpd = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    value: parseFloat((0.8 + i * 0.05).toFixed(2)),
}))

test.describe('SparklineChart', () => {
    test('renders SVG with correct role and label', async ({ mount }) => {
        const component = await mount(
            <SparklineChart points={sevenDayVpd} label="VPD Trend" unit="kPa" />,
        )
        await expect(component).toBeVisible()
        const svg = component.locator('svg')
        await expect(svg).toHaveAttribute('role', 'img')
        await expect(svg).toHaveAttribute('aria-label', 'VPD Trend')
    })

    test('renders baseline polyline with 7 data points', async ({ mount }) => {
        const component = await mount(<SparklineChart points={sevenDayVpd} label="VPD" />)
        const polyline = component.locator('polyline')
        await expect(polyline).toBeVisible()
        const pts = await polyline.getAttribute('points')
        // 7 x,y pairs -- 6 spaces separate them
        expect(pts?.split(' ')).toHaveLength(7)
    })

    test('shows empty-state placeholder when points=[]', async ({ mount }) => {
        const component = await mount(<SparklineChart points={[]} label="Empty" />)
        // Empty state renders a div with '--' text, no SVG
        await expect(component.locator('svg')).toHaveCount(0)
        await expect(component).toContainText('--')
    })

    test('renders area polygon when showArea=true (default)', async ({ mount }) => {
        const component = await mount(
            <SparklineChart points={sevenDayVpd} label="Area Test" showArea={true} />,
        )
        const area = component.locator('polygon')
        await expect(area).toBeVisible()
    })

    test('omits area polygon when showArea=false', async ({ mount }) => {
        const component = await mount(
            <SparklineChart points={sevenDayVpd} label="No Area" showArea={false} />,
        )
        await expect(component.locator('polygon')).toHaveCount(0)
    })

    test('renders dots when showDots=true (default)', async ({ mount }) => {
        const component = await mount(
            <SparklineChart points={sevenDayVpd} label="Dots Test" showDots={true} />,
        )
        const dots = component.locator('circle')
        const count = await dots.count()
        // One dot per data point = 7
        expect(count).toBeGreaterThanOrEqual(7)
    })

    test('omits regular dots when showDots=false', async ({ mount }) => {
        const component = await mount(
            <SparklineChart points={sevenDayVpd} label="No Dots" showDots={false} />,
        )
        // highlightLast=true (default) still renders one circle for last point
        const dots = component.locator('circle')
        const count = await dots.count()
        expect(count).toBeLessThan(7)
    })

    test('renders no circles at all when showDots=false and highlightLast=false', async ({
        mount,
    }) => {
        const component = await mount(
            <SparklineChart
                points={sevenDayVpd}
                label="No Dots No Highlight"
                showDots={false}
                highlightLast={false}
            />,
        )
        await expect(component.locator('circle')).toHaveCount(0)
    })

    test('applies custom color to polyline stroke', async ({ mount }) => {
        const component = await mount(
            <SparklineChart points={sevenDayVpd} label="Custom Color" color="#ef4444" />,
        )
        const polyline = component.locator('polyline')
        const stroke = await polyline.getAttribute('stroke')
        expect(stroke).toBe('#ef4444')
    })

    test('respects custom height prop', async ({ mount }) => {
        const component = await mount(
            <SparklineChart points={sevenDayVpd} label="Custom Height" height={120} />,
        )
        const svg = component.locator('svg')
        await expect(svg).toHaveAttribute('height', '120')
    })

    test('handles single data point gracefully', async ({ mount }) => {
        const singlePoint = [{ day: 0, value: 1.2 }]
        const component = await mount(<SparklineChart points={singlePoint} label="Single Point" />)
        await expect(component.locator('svg')).toBeVisible()
    })

    test('renders day labels on x-axis for first, mid and last point', async ({ mount }) => {
        const component = await mount(<SparklineChart points={sevenDayVpd} label="X Labels" />)
        const labels = component.locator('text')
        const allText = await labels.allTextContents()
        // Expect day labels like 'D1', 'D4', 'D7'
        const dayLabels = allText.filter((t) => /^D\d+$/.test(t))
        expect(dayLabels.length).toBeGreaterThanOrEqual(2)
    })
})
