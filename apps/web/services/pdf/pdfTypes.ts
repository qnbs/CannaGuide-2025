import type { Plant } from '@/types'

export type JsPDFWithAutoTable = {
    addPage: () => void
    setFontSize: (size: number) => void
    setFont: (family: string, style?: string) => void
    setTextColor: (r: number, g?: number, b?: number) => void
    setDrawColor: (r: number) => void
    setFillColor: (r: number, g: number, b: number) => void
    text: (text: string, x: number, y: number, opts?: Record<string, unknown>) => void
    line: (x1: number, y1: number, x2: number, y2: number) => void
    rect: (x: number, y: number, w: number, h: number, style?: string) => void
    addImage: (data: string, format: string, x: number, y: number, w: number, h: number) => void
    save: (filename: string) => void
    output: (type: string) => ArrayBuffer
    autoTable: (options: Record<string, unknown>) => void
    lastAutoTable: { finalY: number }
    internal: { getNumberOfPages: () => number; pageSize: { getHeight: () => number } }
    splitTextToSize: (text: string, maxWidth: number) => string[]
    getTextWidth: (text: string) => number
}

export const PAGE_W = 210
export const LM = 15
export const RM = 15
export const CONTENT_W = PAGE_W - LM - RM

export const SEVERITY_COLORS: Record<string, [number, number, number]> = {
    none: [76, 175, 80],
    mild: [255, 193, 7],
    moderate: [255, 152, 0],
    severe: [244, 67, 54],
}

export function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-CA')
}

export function truncate(text: string, max: number): string {
    if (text.length <= max) return text
    return `${text.slice(0, max - 3)}...`
}

export function buildFilename(plant: Plant): string {
    const slug = plant.name.toLowerCase().replace(/\s+/g, '-')
    const date = formatDate(Date.now())
    return `cannaguide-${slug}-${date}.pdf`
}

export async function createPdfDoc(): Promise<JsPDFWithAutoTable> {
    const { default: JsPDFBase } = await import('jspdf')
    await import('jspdf-autotable')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return new JsPDFBase() as unknown as JsPDFWithAutoTable
}
