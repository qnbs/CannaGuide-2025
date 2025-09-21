// FIX: Correct import path for types.
import { Strain, SavedSetup, RecommendationCategory } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// Import a font that supports UTF-8 characters, like Roboto.
// jsPDF has issues with special characters in its built-in fonts.
// Note: In a real-world scenario, you would bundle this font file.
// For this environment, we rely on modern jsPDF's improved handling.

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
  // Prepend UTF-8 BOM for Excel compatibility with special characters
  const bomCsvString = "\uFEFF" + csvString;
  downloadFile(bomCsvString, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

const exportAsTXT = (strains: Strain[], filename: string, t: TFunction) => {
    let txtString = `${t('strainsView.exportModal.title')} - ${new Date().toLocaleString()}\n\n`;
    strains.forEach(s => {
        txtString += `========================================\n`;
        txtString += `** ${s.name} **\n`;
        txtString += `----------------------------------------\n`;
        txtString += `${t('common.type')}: ${s.type} ${s.typeDetails ? `(${s.typeDetails})` : ''}\n`;
        txtString += `THC: ${s.thcRange || s.thc + '%'} | CBD: ${s.cbdRange || s.cbd + '%'}\n`;
        txtString += `${t('strainsView.table.flowering')}: ${s.floweringTimeRange || s.floweringTime + ` ${t('strainsView.weeks')}`}\n`;
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
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    doc.setFont('Helvetica');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const footerHeight = 20;
    const headerHeight = 25;
    let y = headerHeight;

    const addHeader = (title: string) => {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#3b82f6');
        doc.text(title, margin, 18);
        doc.setDrawColor(51, 65, 85);
        doc.line(margin, 22, pageWidth - margin, 22);
    };

    const addFooter = (pageNumber: number, totalPages: number) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120); // Dark grey for footer
        doc.text(`${t('common.page')} ${pageNumber} / ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        doc.text(`${t('common.generated')}: ${new Date().toLocaleString()}`, margin, pageHeight - 10);
    };

    addHeader(t('strainsView.exportModal.title'));

    strains.forEach((strain, index) => {
        const estimateHeight = () => {
            let height = 45; // Table height + spacing
            if (strain.description) {
                height += (doc.splitTextToSize(strain.description, pageWidth - margin * 2).length * 5) + 10;
            }
            if (strain.aromas && strain.aromas.length > 0) height += 15;
            if (strain.dominantTerpenes && strain.dominantTerpenes.length > 0) height += 15;
            return height;
        };

        if (index > 0 && y + estimateHeight() > pageHeight - footerHeight) {
            doc.addPage();
            addHeader(t('strainsView.exportModal.title'));
            y = headerHeight;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Black for strain name
        doc.text(strain.name, margin, y);
        y += 8;

        (doc as any).autoTable({
            startY: y,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: 226, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 2, textColor: [40, 40, 40], font: 'Helvetica' }, // Dark grey for body text
            body: [
                { label: t('common.type'), value: `${strain.type} ${strain.typeDetails ? `(${strain.typeDetails})` : ''}` },
                { label: t('common.genetics'), value: strain.genetics || 'N/A' },
                { label: `THC / CBD`, value: `${strain.thcRange || strain.thc + '%'} / ${strain.cbdRange || strain.cbd + '%'}` },
                { label: t('strainsView.table.flowering'), value: `${strain.floweringTimeRange || strain.floweringTime} ${t('strainsView.weeks')}`},
                { label: t('strainsView.table.level'), value: t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`) },
                { label: t('strainsView.strainModal.yieldIndoor'), value: strain.agronomic.yieldDetails?.indoor || 'N/A' },
            ].map(row => [ { content: row.label, styles: { fontStyle: 'bold' } }, row.value ])
        });

        y = (doc as any).autoTable.previous.finalY + 10;

        if (strain.description) {
             if (y + 15 > pageHeight - footerHeight) { doc.addPage(); addHeader(t('strainsView.exportModal.title')); y = headerHeight; }
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0); // Black for section title
            doc.text(t('common.description'), margin, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(40, 40, 40); // Dark grey for description text
            const splitText = doc.splitTextToSize(strain.description, pageWidth - (margin * 2));
            doc.text(splitText, margin, y);
            y += splitText.length * 5 + 4;
        }

        const renderTags = (title: string, tags: string[] | undefined) => {
            if (tags && tags.length > 0) {
                if (y + 15 > pageHeight - footerHeight) { doc.addPage(); addHeader(t('strainsView.exportModal.title')); y = headerHeight; }
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0); // Black for section title
                doc.text(title, margin, y);
                y += 6;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(226, 232, 240); // White text for tags
                
                let currentX = margin;
                tags.forEach(tag => {
                    const tagWidth = doc.getTextWidth(tag) + 8;
                    if (currentX + tagWidth > pageWidth - margin) {
                        y += 8;
                        currentX = margin;
                    }
                    doc.setFillColor(51, 65, 85); // slate-700
                    doc.roundedRect(currentX, y - 5, tagWidth, 7, 3, 3, 'F');
                    doc.text(tag, currentX + 4, y);
                    currentX += tagWidth + 4;
                });
                y += 12;
            }
        };

        renderTags(`${t('strainsView.strainModal.aromas')}:`, strain.aromas);
        renderTags(`${t('strainsView.strainModal.dominantTerpenes')}:`, strain.dominantTerpenes);
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addFooter(i, pageCount);
    }

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
        content += `${t(`equipmentView.configurator.categories.${key}`)}: ${item.name} (${item.price} €)\n`;
    });
    content += `---------------------------------\n`;
    content += `${t('equipmentView.configurator.total')}: ${setup.totalCost.toFixed(2)} €\n`;
    downloadFile(content, `${setup.name.replace(/\s/g, '_')}.txt`, 'text/plain;charset=utf-8;');
};

const exportSetupAsPDF = (setup: SavedSetup, t: TFunction) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFont('Helvetica');

    const totalPagesExp = '{total_pages_count_string}';
    
    const tableColumn = [t('equipmentView.savedSetups.pdfReport.item'), t('equipmentView.savedSetups.pdfReport.product'), t('equipmentView.savedSetups.pdfReport.rationale'), t('equipmentView.savedSetups.pdfReport.price')];
    const tableRows = (Object.keys(setup.recommendation) as RecommendationCategory[]).map(key => {
        const item = setup.recommendation[key];
        return [
            t(`equipmentView.configurator.categories.${key}`),
            `${item.name}${item.watts ? ` (${item.watts}W)` : ''}`,
            item.rationale,
            `${item.price.toFixed(2)} €`
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
    doc.text(`${setup.totalCost.toFixed(2)} €`, doc.internal.pageSize.width - 20, finalY + 10, { align: 'right' });

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