import React, { useId } from 'react'
import { ResponsiveContainer } from 'recharts'

/**
 * Shared margin for every Recharts chart. Previously re-declared per view.
 */
export const CHART_MARGIN = { top: 12, right: 8, left: 0, bottom: 6 } as const

export interface ChartSeries<T> {
    dataKey: Extract<keyof T, string>
    /** Column heading in the screen-reader table. Pass a translated string. */
    label: string
    /** Renders the raw cell value, e.g. `(v) => `${v} kPa``. */
    format?: (value: unknown) => string
}

export interface AccessibleChartProps<T> {
    /** The chart's accessible name. Pass a translated string. */
    label: string
    /** Optional longer explanation, announced after the name. */
    description?: string
    data: readonly T[]
    /** Key labelling each table row -- normally whatever the x axis plots. */
    categoryKey: Extract<keyof T, string>
    categoryLabel: string
    series: readonly ChartSeries<T>[]
    /** Height of the plot area. Recharts needs a bounded parent. */
    height?: number | string
    className?: string
    /** Classes for the box wrapping the plot (background, padding, radius). */
    plotClassName?: string
    /**
     * Drop the hidden table. Only for charts that already render the same numbers
     * in a visible table -- a second copy is noise, not access.
     */
    omitDataTable?: boolean
    children: React.ReactElement
}

const formatCell = (value: unknown): string => {
    if (value === null || value === undefined) return '--'
    if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2)
    if (typeof value === 'string' || typeof value === 'boolean') return String(value)
    return '--'
}

/**
 * Wraps a Recharts chart so it is reachable by keyboard and legible to a screen
 * reader.
 *
 * Three things carry the accessibility, and they only work together:
 *  - `<figcaption>` names the figure (not `role="img"`, which would mark the
 *    chart's own descendants as presentational and defeat `accessibilityLayer`).
 *  - the chart passed as `children` must set `accessibilityLayer` -- that is what
 *    makes Recharts focusable and arrow-key navigable.
 *  - the visually hidden table is the actual data, for readers that cannot
 *    interpret the plot at all.
 */
export function AccessibleChart<T>({
    label,
    description,
    data,
    categoryKey,
    categoryLabel,
    series,
    height = '100%',
    className,
    plotClassName,
    omitDataTable = false,
    children,
}: AccessibleChartProps<T>) {
    const id = useId()
    const labelId = `${id}-label`
    const descId = `${id}-desc`

    return (
        <figure
            className={className ? `m-0 ${className}` : 'm-0'}
            aria-labelledby={labelId}
            aria-describedby={description ? descId : undefined}
        >
            <figcaption id={labelId} className="sr-only">
                {label}
            </figcaption>
            {description ? (
                <p id={descId} className="sr-only">
                    {description}
                </p>
            ) : null}

            <div className={plotClassName} style={{ height }}>
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={0}
                    debounce={50}
                >
                    {children}
                </ResponsiveContainer>
            </div>

            {omitDataTable ? null : (
            <table className="sr-only">
                <caption>{label}</caption>
                <thead>
                    <tr>
                        <th scope="col">{categoryLabel}</th>
                        {series.map((s) => (
                            <th key={s.dataKey} scope="col">
                                {s.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={`${formatCell(row[categoryKey])}-${index}`}>
                            <th scope="row">{formatCell(row[categoryKey])}</th>
                            {series.map((s) => {
                                const value = row[s.dataKey]
                                return (
                                    <td key={s.dataKey}>
                                        {s.format ? s.format(value) : formatCell(value)}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            )}
        </figure>
    )
}

AccessibleChart.displayName = 'AccessibleChart'
