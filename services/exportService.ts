import { Strain, SavedSetup, RecommendationCategory } from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type TFunction = (key: string, params?: Record<string, any>) => any;

const strainToCSVRow = (strain: Strain, t: TFunction): Record<string, any> => ({
    [t('strainsView.csvHeaders.name')]: strain.name,
    [t('strainsView.csvHeaders.type')]: strain.type,
    [t('strainsView.csvHeaders.thc')]: strain.thc,
    [t('strainsView.csvHeaders.cbd')]: strain.cbd,
    [t('strainsView.csvHeaders.floweringTime')]: strain.floweringTime,
    [t('strainsView.csvHeaders.difficulty')]: t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`),
    [t('strainsView.csvHeaders.yield')]: t(`strainsView.addStrainModal.yields.${strain.agronomic.yield.toLowerCase()}`),
    [t('strainsView.csvHeaders.height')]: t(`strainsView.addStrainModal.heights.${strain.agronomic.height.toLowerCase()}`),
    [t('strainsView.csvHeaders.genetics')]: strain.genetics || '',
    [t('strainsView.csvHeaders.aromas')]: (strain.aromas || []).join('; '),
    [t('strainsView.csvHeaders.terpenes')]: (strain.dominantTerpenes || []).join('; '),
    [t('strainsView.csvHeaders.yieldIndoor')]: strain.agronomic.yieldDetails?.indoor || '',
    [t('strainsView.csvHeaders.yieldOutdoor')]: strain.agronomic.yieldDetails?.outdoor || '',
    [t('strainsView.csvHeaders.description')]: (strain.description || '').replace(/"/g, '""').replace(/\n/g, ' '),
});

const arrayToCSV = (data: Record<string, any>[]): string => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => headers.map(header => `"${obj[header]}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
};

const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportAsJSON = (strains: Strain[], filename: string) => {
  const jsonString = JSON.stringify(strains, null, 2);
  downloadFile(jsonString, `${filename}.json`, 'application/json;charset=utf-8;');
};

const exportAsCSV = (strains: Strain[], filename: string, t: TFunction) => {
  const csvData = strains.map(strain => strainToCSVRow(strain, t));
  const csvString = arrayToCSV(csvData);
  const bomCsvString = "\uFEFF" + csvString;
  downloadFile(bomCsvString, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

const exportAsTXT = (strains: Strain[], filename: string, t: TFunction) => {
    let txtString = `CannaGuide 2025 - ${t('strainsView.exportModal.title')} - ${new Date().toLocaleString()}\n\n`;
    strains.forEach(s => {
        txtString += `========================================\n`;
        txtString += `** ${s.name} **\n`;
        txtString += `----------------------------------------\n`;
        txtString += `${t('common.type')}: ${s.type} ${s.typeDetails ? `(${s.typeDetails})` : ''}\n`;
        txtString += `THC: ${s.thcRange || s.thc + '%'} | CBD: ${s.cbdRange || s.cbd + '%'}\n`;
        txtString += `${t('strainsView.table.flowering')}: ${s.floweringTimeRange || s.floweringTime + ` ${t('common.units.weeks')}`}\n`;
        txtString += `${t('common.genetics')}: ${s.genetics || 'N/A'}\n\n`;
        txtString += `** ${t('strainsView.strainModal.agronomicData')} **\n`;
        txtString += `${t('strainsView.table.level')}: ${t(`strainsView.difficulty.${s.agronomic.difficulty.toLowerCase()}`)}\n`;
        txtString += `${t('strainsView.yield')}: ${t(`strainsView.addStrainModal.yields.${s.agronomic.yield.toLowerCase()}`)} (${s.agronomic.yieldDetails?.indoor || 'N/A'})\n`;
        txtString += `${t('strainsView.height')}: ${t(`strainsView.addStrainModal.heights.${s.agronomic.height.toLowerCase()}`)} (${s.agronomic.heightDetails?.indoor || 'N/A'})\n\n`;
        if (s.aromas && s.aromas.length > 0) txtString += `${t('strainsView.strainModal.aromas')}:\n- ${s.aromas.join('\n- ')}\n\n`;
        if (s.dominantTerpenes && s.dominantTerpenes.length > 0) txtString += `${t('strainsView.strainModal.dominantTerpenes')}:\n- ${s.dominantTerpenes.join('\n- ')}\n\n`;
        if (s.description) txtString += `${t('common.description')}:\n${s.description}\n`;
        txtString += `========================================\n\n`;
    });
    downloadFile(txtString, `${filename}.txt`, 'text/plain;charset=utf-8;');
};

const exportAsPDF = (strains: Strain[], filename: string, t: TFunction) => {
    const doc = new jsPDF();
    const totalPagesExp = '{total_pages_count_string}';
    const leafIconDataUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjMzMzJyBzdHJva2Utd2lkdGg9JzEuNSc+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSdnJyB4MT0nMCUnIHkxPScwJScgeDI9JzAlJyB5Mj0nMTAwJSc+PHN0b3Agb2Zmc2V0PScwJScgc3R5bGU9J3N0b3AtY29sb3I6cmdiKDc0LCAyMjIsIDEyOCknLz48c3RvcCBvZmZzZXQ9JzEwMCUnIHN0eWxlPSdzdG9wLWNvbG9yOnJnYigxNiwgMTg1LCAxMjgpJy8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJyBzdHJva2UtbGluZWpvaW49J3JvdW5kJyBkPSdtMjEgMjEtNS4xOTctNS4xOTdtMCAwQTcuNSA3LjUgMCAxIDAgNS4xOTYgNS4xOTZhNy41IDcuNSAwIDAgMCAxMC42MDcgMTAuNjA3WicvPjxnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDUuMiwgNS4yKSBzY2FsZSgwLjYpJz48cGF0aCBmaWxsPSd1cmwoI2cpJyBzdHJva2U9J25vbmUnIGQ9J00yMC4yMSwxMi43OWEuNzguNzgsMCwwLDAsMC0xLjExLDUuMjcsNS4yNywwLDAsMS0zLjc5LTMuNzkuNzguNzgsMCwwLDAtMS4xMSwwTDEyLDExLjE2LDguNjksNy44OWEuNzguNzgsMCwwLDAtMS4xMSwwQTUuMjcsNS4yNywwLDAsMSwzLjc5LDExLjY4YS43OC43OCwwLDAsMCwwLDEuMTFM ny4wNiwxNmEuNzkuNzksMCwwLDAsMS4xMSwwLDMuMTUsMy4xNSwwLDAsMCw0LjQ2LDAsLjc5Ljc5LDAsMCwwLDEuMTEsMFonLz48cGF0aCBmaWxsPSd1cmwoI2cpJyBzdHJva2U9J25vbmUnIGQ9J00xNi45NCwxNmEuNzkuNzksMCwwLDAsMS4xMSwwTDIxLjQyLDEyYS43OS43OSwwLDAsMCwwLTEuMTIuNzguNzgsMCwwLDAtMS4xMSwwTDE4LjA1LDEzLjJBN S4yOCw1LjI4LDAsMCwxLDE2Ljk0LDE2WicvPjxwYXRoIGZpbGw9J3VybCgjZyknIHN0cm9rZT0nbm9uZScgZD0nTT EyLDIxLjlhLjc5Ljc5LDAsMCwwLC41NS0uMjJsMy4yNy0zLjI3YS43OC43OCwwLDAsMC0xLjExLTEuMTFM MTIwLDkuMjksMTcuMzFhLjc4Ljc4LDAsMCwwLTEuMTEsMS4xMUwxMS40NSwyMS42OEEuNzkuNzksMCwwLDAsMTIsMjEuOVonLz48cGF0aCBmaWxsPSd1cmwoI2cpJyBzdHJva2U9J25vbmUnIGQ9J00yLjU4LDEyYS43OS43OSwwLDAsMCwwLTEuMTIuNzguNzgsMCwwLDAtMS4xMSwwTC4xLDEyLjIxYS43OC43OCwwLDAsMCwwLDEuMTEuNzcuNzcsMCwwLDAsLjU1Ljc5Ljc5LDAsMCwwLC41Ni0uMjJsMS4zNy0xLjM3QTUuMjgsNS4yOCwwLDAsMSwyLjU4LDEyWicvPjwvZz48L3N2Zz4=';

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 25;

    const addPageIfNeeded = (neededHeight: number) => {
        if (y + neededHeight > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            y = 25;
            return true;
        }
        return false;
    };

    const drawHeader = () => {
        doc.addImage(leafIconDataUrl, 'PNG', margin, 8, 12, 12);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text('CannaGuide 2025', margin + 15, 17);
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text('Cannabis Grow Guide with Gemini', margin + 15, 22);
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(margin, 28, pageWidth - margin, 28);
        y = 38;
    };

    const drawFooter = () => {
        const pageCount = doc.internal.pages.length;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); // slate-400
            let str = `${t('common.page')} ${i} / ${pageCount}`;
            if (typeof (doc as any).putTotalPages === 'function') {
                str = `${t('common.page')} ${i} / ${totalPagesExp}`;
            }
            doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
    };
    
    strains.forEach((strain, index) => {
        if (index > 0) {
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.line(margin, y, contentWidth + margin, y);
            y += 10;
        }
        
        addPageIfNeeded(80); // Estimate for a new strain block
        
        // Strain Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246); // primary-500
        doc.text(strain.name, margin, y);
        y += 6;
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`${strain.type} | ${strain.genetics || t('common.genetics')}`, margin, y);
        y += 8;

        // Stats Table
        (doc as any).autoTable({
            startY: y,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 1.5 },
            body: [
                [
                    { content: `${t('strainsView.strainModal.difficulty')}:\n${t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)}`, styles: { halign: 'center' } },
                    { content: `${t('strainsView.strainModal.floweringTime')}:\n${strain.floweringTimeRange || strain.floweringTime} ${t('common.units.weeks')}`, styles: { halign: 'center' } },
                    { content: `${t('strainsView.strainModal.yieldIndoor')}:\n${strain.agronomic.yieldDetails?.indoor || 'N/A'}`, styles: { halign: 'center' } },
                    { content: `${t('strainsView.strainModal.heightIndoor')}:\n${strain.agronomic.heightDetails?.indoor || 'N/A'}`, styles: { halign: 'center' } },
                ]
            ],
            didDrawCell: (data: any) => {
                if (data.section === 'body' && data.column.index < 3) {
                     doc.setDrawColor(226, 232, 240); // slate-200
                     doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                }
            }
        });
        y = (doc as any).autoTable.previous.finalY + 8;

        // Cannabinoid Bars
        const drawBar = (label: string, value: number, max: number, color: [number, number, number]) => {
            if (addPageIfNeeded(12)) drawHeader();
            const barWidth = 60;
            const barHeight = 4;
            const valueWidth = (value / max) * barWidth;
            doc.setFontSize(9);
            doc.setTextColor(51, 65, 85);
            doc.text(label, margin, y);
            doc.setFillColor(226, 232, 240); // slate-200
            doc.rect(margin + 20, y - 3, barWidth, barHeight, 'F');
            doc.setFillColor(color[0], color[1], color[2]);
            doc.rect(margin + 20, y - 3, valueWidth, barHeight, 'F');
            doc.text(`${value.toFixed(1)}%`, margin + 25 + barWidth, y);
            y += 8;
        };

        drawBar('THC', strain.thc, 35, [59, 130, 246]);
        drawBar('CBD', strain.cbd, 20, [16, 185, 129]);
        y += 4;

        // Description
        if (strain.description) {
            const descLines = doc.splitTextToSize(strain.description, contentWidth);
            if (addPageIfNeeded(descLines.length * 5 + 8)) drawHeader();
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text(t('common.description'), margin, y);
            y += 6;
            doc.setFontSize(10);
            doc.setTextColor(71, 85, 105); // slate-600
            doc.text(descLines, margin, y);
            y += descLines.length * 5 + 4;
        }

        // Tags
        const drawTags = (title: string, tags: string[] | undefined) => {
            if (tags && tags.length > 0) {
                if (addPageIfNeeded(20)) drawHeader();
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42);
                doc.text(title, margin, y);
                y += 7;
                
                let currentX = margin;
                tags.forEach(tag => {
                    const tagWidth = doc.getTextWidth(tag) + 6;
                    if (currentX + tagWidth > pageWidth - margin) {
                        y += 8;
                        currentX = margin;
                    }
                    doc.setFontSize(8);
                    doc.setFillColor(241, 245, 249); // slate-100
                    doc.roundedRect(currentX, y - 4, tagWidth, 6, 3, 3, 'F');
                    doc.setTextColor(71, 85, 105); // slate-600
                    doc.text(tag, currentX + 3, y);
                    currentX += tagWidth + 3;
                });
                y += 10;
            }
        };
        
        drawTags(t('strainsView.strainModal.aromas'), strain.aromas);
        drawTags(t('strainsView.strainModal.dominantTerpenes'), strain.dominantTerpenes);
    });

    drawHeader(); // Draw header on the first page
    if (typeof (doc as any).putTotalPages === 'function') {
        (doc as any).putTotalPages(totalPagesExp);
    }
    drawFooter(); // Draw footer on all pages

    doc.save(`${filename}.pdf`);
};


// Setup export functions
const exportSetupAsJSON = (setup: SavedSetup) => {
    downloadFile(JSON.stringify(setup, null, 2), `${setup.name.replace(/\s/g, '_')}.json`, 'application/json;charset=utf-8;');
};

const exportSetupAsCSV = (setup: SavedSetup, t: TFunction) => {
    const data = (Object.keys(setup.recommendation) as RecommendationCategory[]).map(key => ({
        [t('equipmentView.savedSetups.pdfReport.item')]: t(`equipmentView.configurator.categories.${key}`),
        [t('equipmentView.savedSetups.pdfReport.product')]: setup.recommendation[key].name,
        [t('equipmentView.savedSetups.pdfReport.price')]: setup.recommendation[key].price,
        [t('equipmentView.savedSetups.pdfReport.rationale')]: `"${(setup.recommendation[key].rationale || '').replace(/"/g, '""')}"`
    }));
    const csvString = arrayToCSV(data);
    downloadFile("\uFEFF" + csvString, `${setup.name.replace(/\s/g, '_')}.csv`, 'text/csv;charset=utf-8;');
};

const exportSetupAsTXT = (setup: SavedSetup, t: TFunction) => {
    let content = `${t('equipmentView.savedSetups.pdfReport.setup')}: ${setup.name}\n`;
    content += `---------------------------------\n`;
    (Object.keys(setup.recommendation) as RecommendationCategory[]).forEach(key => {
        const item = setup.recommendation[key];
        content += `${t(`equipmentView.configurator.categories.${key}`)}: ${item.name} (${item.price} ${t('common.units.currency_eur')})\n`;
    });
    content += `---------------------------------\n`;
    content += `${t('equipmentView.configurator.total')}: ${setup.totalCost.toFixed(2)} ${t('common.units.currency_eur')}\n`;
    downloadFile(content, `${setup.name.replace(/\s/g, '_')}.txt`, 'text/plain;charset=utf-8;');
};

const exportSetupAsPDF = (setup: SavedSetup, t: TFunction) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFont('Helvetica');

    const totalPagesExp = '{total_pages_count_string}';
    
    const tableColumn = [t('equipmentView.savedSetups.pdfReport.item'), t('equipmentView.savedSetups.pdfReport.product'), t('equipmentView.savedSetups.pdfReport.rationale'), `${t('equipmentView.savedSetups.pdfReport.price')} (${t('common.units.currency_eur')})`];
    const tableRows = (Object.keys(setup.recommendation) as RecommendationCategory[]).map(key => {
        const item = setup.recommendation[key];
        return [
            t(`equipmentView.configurator.categories.${key}`),
            `${item.name}${item.watts ? ` (${item.watts}W)` : ''}`,
            item.rationale,
            `${item.price.toFixed(2)}`
        ];
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: 226, fontStyle: 'bold' },
        styles: { halign: 'left', font: 'Helvetica', textColor: [40, 40, 40] }, // Dark grey for body text
        columnStyles: { 3: { halign: 'right' } },
        didDrawPage: (data: any) => {
            // Header
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#3b82f6');
            doc.text(t('equipmentView.savedSetups.pdfReport.setup'), 14, 15);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40); // Dark grey text
            doc.text(setup.name, 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(40, 40, 40); // Dark grey text
            doc.text(`${t('equipmentView.savedSetups.pdfReport.createdAt')}: ${new Date(setup.createdAt).toLocaleString()}`, 14, 30);
            const sourceInfo = `${t('common.style')}: ${setup.sourceDetails.growStyle} | ${t('equipmentView.savedSetups.pdfReport.budget')}: ${setup.sourceDetails.budget}`;
            doc.text(sourceInfo, 14, 36);

            // Footer
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(120, 120, 120); // Grey text for footer
            let footerStr = `${t('common.page')} ${data.pageNumber}`;
            if (typeof (doc as any).putTotalPages === 'function') {
                footerStr = footerStr + " / " + totalPagesExp;
            }
            doc.text(footerStr, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
            doc.text(`${t('common.generated')}: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
        },
    });

    let finalY = (doc as any).autoTable.previous.finalY;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Black for total
    doc.text(t('equipmentView.configurator.total'), 145, finalY + 10, { align: 'right' });
    doc.text(`${setup.totalCost.toFixed(2)} ${t('common.units.currency_eur')}`, doc.internal.pageSize.width - 20, finalY + 10, { align: 'right' });

    if (typeof (doc as any).putTotalPages === 'function') {
        (doc as any).putTotalPages(totalPagesExp);
    }
    
    doc.save(`${setup.name.replace(/\s/g, '_')}.pdf`);
};

export const exportService = {
    exportAsJSON,
    exportAsCSV,
    exportAsPDF,
    exportAsTXT,
    exportSetupAsJSON,
    exportSetupAsCSV,
    exportSetupAsTXT,
    exportSetupAsPDF
};