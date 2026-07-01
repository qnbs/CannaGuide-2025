import { LM, PAGE_W, RM, type JsPDFWithAutoTable } from './pdfTypes'

export function ensureSpace(doc: JsPDFWithAutoTable, yPos: number, needed: number): number {
    if (yPos + needed > 270) {
        doc.addPage()
        return 20
    }
    return yPos
}

export function addSectionHeader(doc: JsPDFWithAutoTable, title: string, yPos: number): number {
    const y = ensureSpace(doc, yPos, 20)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 60, 40)
    doc.text(title, LM, y)
    doc.setDrawColor(120)
    doc.line(LM, y + 2, PAGE_W - RM, y + 2)
    return y + 8
}
