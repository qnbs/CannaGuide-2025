import type { DiagnosisRecord, MetricsReading } from '@/types'
import { formatDate } from './pdfTypes'

export function renderMetricsCanvas(
    readings: MetricsReading[],
    width: number,
    height: number,
): string | undefined {
    if (readings.length < 2) return undefined

    const canvas = document.createElement('canvas')
    canvas.width = width * 2
    canvas.height = height * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    ctx.scale(2, 2)

    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, width, height)

    const chartLeft = 45
    const chartRight = width - 15
    const chartTop = 25
    const chartBottom = height - 30
    const chartW = chartRight - chartLeft
    const chartH = chartBottom - chartTop

    const heightValues = readings
        .map((r, i) => ({ x: i, y: r.height }))
        .filter((p): p is { x: number; y: number } => typeof p.y === 'number')

    const co2Values = readings
        .map((r, i) => ({ x: i, y: r.co2 }))
        .filter((p): p is { x: number; y: number } => typeof p.y === 'number')

    const drawLine = (
        values: Array<{ x: number; y: number }>,
        color: string,
        label: string,
    ): void => {
        if (values.length < 2) return

        const minVal = Math.min(...values.map((v) => v.y))
        const maxVal = Math.max(...values.map((v) => v.y))
        const range = maxVal - minVal || 1

        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()

        for (let i = 0; i < values.length; i++) {
            const v = values[i]
            if (!v) continue
            const px = chartLeft + (v.x / (readings.length - 1)) * chartW
            const py = chartBottom - ((v.y - minVal) / range) * chartH
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
        }
        ctx.stroke()

        const legendY = chartTop - 10
        const legendX = label === 'Height' ? chartLeft : chartLeft + 100
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(legendX, legendY, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '11px sans-serif'
        ctx.fillText(label, legendX + 8, legendY + 4)
    }

    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
        const gy = chartTop + (i / 4) * chartH
        ctx.beginPath()
        ctx.moveTo(chartLeft, gy)
        ctx.lineTo(chartRight, gy)
        ctx.stroke()
    }

    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    const first = readings[0]
    const last = readings[readings.length - 1]
    if (first) ctx.fillText(formatDate(first.timestamp), chartLeft, chartBottom + 15)
    if (last) ctx.fillText(formatDate(last.timestamp), chartRight - 60, chartBottom + 15)

    ctx.save()
    ctx.translate(12, chartTop + chartH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    ctx.fillText('Value', 0, 0)
    ctx.restore()

    drawLine(heightValues, '#4ade80', 'Height (cm)')
    drawLine(co2Values, '#38bdf8', 'CO2 (ppm)')

    return canvas.toDataURL('image/png')
}

const SEVERITY_VALUES: Record<string, number> = {
    none: 0,
    mild: 1,
    moderate: 2,
    severe: 3,
}

export function renderDiagnosisCanvas(
    records: DiagnosisRecord[],
    width: number,
    height: number,
): string | undefined {
    if (records.length === 0) return undefined

    const canvas = document.createElement('canvas')
    canvas.width = width * 2
    canvas.height = height * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    ctx.scale(2, 2)

    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, width, height)

    const chartLeft = 45
    const chartRight = width - 15
    const chartTop = 20
    const chartBottom = height - 30
    const chartW = chartRight - chartLeft
    const chartH = chartBottom - chartTop

    const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp)
    const barWidth = Math.max(6, Math.min(30, chartW / sorted.length - 2))

    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    const labels = ['None', 'Mild', 'Moderate', 'Severe']
    for (let i = 0; i < labels.length; i++) {
        const ly = chartBottom - (i / 3) * chartH
        ctx.fillText(labels[i] ?? '', 2, ly + 3)
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(chartLeft, ly)
        ctx.lineTo(chartRight, ly)
        ctx.stroke()
    }

    for (let i = 0; i < sorted.length; i++) {
        const rec = sorted[i]
        if (!rec) continue
        const sevVal = SEVERITY_VALUES[rec.severity] ?? 0
        const barH = (sevVal / 3) * chartH
        const x = chartLeft + (i / sorted.length) * chartW + 1
        const y = chartBottom - barH

        const colors: Record<string, string> = {
            none: '#4caf50',
            mild: '#ffc107',
            moderate: '#ff9800',
            severe: '#f44336',
        }
        ctx.fillStyle = colors[rec.severity] ?? '#94a3b8'
        ctx.fillRect(x, y, barWidth, barH)
    }

    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    if (sorted[0]) ctx.fillText(formatDate(sorted[0].timestamp), chartLeft, chartBottom + 15)
    const lastRec = sorted[sorted.length - 1]
    if (lastRec) ctx.fillText(formatDate(lastRec.timestamp), chartRight - 60, chartBottom + 15)

    return canvas.toDataURL('image/png')
}
