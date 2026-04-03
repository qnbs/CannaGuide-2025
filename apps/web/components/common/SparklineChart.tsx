/**
 * SparklineChart -- Lightweight inline SVG chart, no external deps.
 *
 * Renders a polyline from a series of {day, value} points.
 * Suitable for 7-day simulation curves in the Knowledge CalculatorHub.
 *
 * Props:
 *   points        -- Array of {day, value} to plot
 *   label         -- Accessible label for the chart
 *   color         -- Stroke color (Tailwind-compatible hex/rgb/named)
 *   unit          -- Unit suffix for tooltip / y-axis labels (optional)
 *   height        -- SVG height in px (default 80)
 *   showDots      -- Show circle markers at each data point (default true)
 *   showArea      -- Fill area under line (default true, 15% opacity)
 *   highlightLast -- Emphasize the last point (default true)
 *   className     -- Additional CSS classes on the <svg> wrapper
 */

import React, { useMemo } from 'react'

export interface ChartPoint {
    day: number
    value: number
}

interface SparklineChartProps {
    points: ChartPoint[]
    label: string
    color?: string
    unit?: string
    height?: number
    showDots?: boolean
    showArea?: boolean
    highlightLast?: boolean
    className?: string
}

const PAD_LEFT = 40
const PAD_RIGHT = 8
const PAD_TOP = 8
const PAD_BOTTOM = 20

const SparklineChart: React.FC<SparklineChartProps> = ({
    points,
    label,
    color = '#22c55e',
    unit = '',
    height = 80,
    showDots = true,
    showArea = true,
    highlightLast = true,
    className = '',
}) => {
    const width = 260

    const { polyPoints, areaPoints, minVal, maxVal, xScale, yScale } = useMemo(() => {
        if (points.length === 0) {
            return {
                polyPoints: '',
                areaPoints: '',
                minVal: 0,
                maxVal: 1,
                xScale: () => 0,
                yScale: () => 0,
            }
        }

        const values = points.map((p) => p.value)
        const minV = Math.min(...values)
        const maxV = Math.max(...values)
        const range = maxV - minV || 1
        const days = points.map((p) => p.day)
        const minD = Math.min(...days)
        const maxD = Math.max(...days)
        const dayRange = maxD - minD || 1

        const chartW = width - PAD_LEFT - PAD_RIGHT
        const chartH = height - PAD_TOP - PAD_BOTTOM

        const xs = (d: number) => PAD_LEFT + ((d - minD) / dayRange) * chartW
        const ys = (v: number) => PAD_TOP + ((maxV - v) / range) * chartH

        const poly = points
            .map((p) => `${xs(p.day).toFixed(1)},${ys(p.value).toFixed(1)}`)
            .join(' ')

        const firstX = xs(points[0]?.day ?? 0).toFixed(1)
        const lastX = xs(points[points.length - 1]?.day ?? 0).toFixed(1)
        const bottomY = (PAD_TOP + chartH).toFixed(1)
        const area = `${firstX},${bottomY} ${poly} ${lastX},${bottomY}`

        return {
            polyPoints: poly,
            areaPoints: area,
            minVal: minV,
            maxVal: maxV,
            xScale: xs,
            yScale: ys,
        }
    }, [points, height])

    if (points.length === 0) {
        return (
            <div
                className={`flex items-center justify-center text-xs text-slate-500 ${className}`}
                style={{ height }}
            >
                --
            </div>
        )
    }

    const lastPoint = points[points.length - 1]
    const chartH = height - PAD_TOP - PAD_BOTTOM

    // Y-axis labels (min, mid, max)
    const midVal = (minVal + maxVal) / 2
    const yLabels = [
        { v: maxVal, y: PAD_TOP },
        { v: midVal, y: PAD_TOP + chartH / 2 },
        { v: minVal, y: PAD_TOP + chartH },
    ]

    // X-axis day labels
    const xLabels = points.filter(
        (_, i) => i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2),
    )

    const uniqueId = `spark-${label.replace(/\s+/g, '-').toLowerCase()}`

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={label}
            className={`w-full overflow-visible ${className}`}
        >
            <defs>
                <linearGradient id={`${uniqueId}-grad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                </linearGradient>
            </defs>

            {/* Grid lines */}
            {yLabels.map(({ y }, i) => (
                <line
                    key={i}
                    x1={PAD_LEFT}
                    y1={y}
                    x2={width - PAD_RIGHT}
                    y2={y}
                    stroke="#334155"
                    strokeWidth="0.5"
                    strokeDasharray="3 3"
                />
            ))}

            {/* Y-axis labels */}
            {yLabels.map(({ v, y }, i) => (
                <text
                    key={i}
                    x={PAD_LEFT - 4}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="8"
                    fill="#64748b"
                >
                    {v.toFixed(v < 10 ? 2 : 0)}
                </text>
            ))}

            {/* X-axis day labels */}
            {xLabels.map((p, i) => (
                <text
                    key={i}
                    x={xScale(p.day)}
                    y={height - 4}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#64748b"
                >
                    D{p.day + 1}
                </text>
            ))}

            {/* Area fill */}
            {showArea && <polygon points={areaPoints} fill={`url(#${uniqueId}-grad)`} />}

            {/* Line */}
            <polyline
                points={polyPoints}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />

            {/* Dots */}
            {showDots &&
                points.map((p, i) => {
                    const isLast = i === points.length - 1
                    return (
                        <circle
                            key={i}
                            cx={xScale(p.day)}
                            cy={yScale(p.value)}
                            r={highlightLast && isLast ? 3.5 : 2}
                            fill={highlightLast && isLast ? color : '#0f172a'}
                            stroke={color}
                            strokeWidth="1.5"
                        >
                            <title>{`Day ${p.day + 1}: ${p.value.toFixed(2)}${unit}`}</title>
                        </circle>
                    )
                })}

            {/* Last value label */}
            {highlightLast && lastPoint && (
                <text
                    x={xScale(lastPoint.day) + 5}
                    y={yScale(lastPoint.value) + 3}
                    fontSize="9"
                    fill={color}
                    fontWeight="bold"
                >
                    {lastPoint.value.toFixed(2)}
                    {unit}
                </text>
            )}
        </svg>
    )
}

SparklineChart.displayName = 'SparklineChart'

export default SparklineChart
