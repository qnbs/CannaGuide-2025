import jsPDF from 'jspdf'

export type AutoTableOptions = {
    startY?: number
    head?: (string | number)[][]
    body?: (string | number | undefined)[][]
    theme?: string
    headStyles?: Record<string, unknown>
    styles?: Record<string, unknown>
    columnStyles?: Record<string, unknown>
    margin?: Record<string, number>
    didDrawPage?: (data: { cursor: { y: number } }) => void
}

export type JsPDFWithAutoTable = jsPDF & {
    autoTable: (options: AutoTableOptions) => void
    lastAutoTable: { finalY: number }
    internal: jsPDF['internal'] & { getNumberOfPages: () => number }
}
