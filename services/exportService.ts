import { Strain } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

// Helper function to normalize German characters for PDF compatibility
const normalizeGermanChars = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss');
};


const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const link = document.createElement('a');
    const file = new Blob([content], { type: mimeType });
    link.href = URL.createObjectURL(file);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
};

const escapeCsvField = (field: any): string => {
    if (field === null || field === undefined) {
        return '';
    }
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};

const exportAsJSON = (data: Strain[], fileName: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    downloadFile('\uFEFF' + jsonString, `${fileName}.json`, 'application/json;charset=utf-8;');
};

const exportAsCSV = (data: Strain[], fileName: string) => {
    const headers = [
        'ID', 'Name', 'Type', 'Type Details', 'Genetics',
        'THC (%)', 'THC Range', 'CBD (%)', 'CBD Range',
        'Flowering Time (weeks)', 'Flowering Time Range',
        'Description', 'Aromas', 'Dominant Terpenes',
        'Difficulty', 'Yield', 'Yield (Indoor)', 'Yield (Outdoor)',
        'Height', 'Height (Indoor)', 'Height (Outdoor)'
    ];

    const rows = data.map(strain => [
        strain.id, strain.name, strain.type, strain.typeDetails || '', strain.genetics || '',
        strain.thc, strain.thcRange || '', strain.cbd, strain.cbdRange || '',
        strain.floweringTime, strain.floweringTimeRange || '',
        (strain.description || '').replace(/<br>/g, ' '),
        (strain.aromas || []).join('; '),
        (strain.dominantTerpenes || []).join('; '),
        strain.agronomic.difficulty,
        strain.agronomic.yield,
        strain.agronomic.yieldDetails?.indoor || '',
        strain.agronomic.yieldDetails?.outdoor || '',
        strain.agronomic.height,
        strain.agronomic.heightDetails?.indoor || '',
        strain.agronomic.heightDetails?.outdoor || ''
    ].map(escapeCsvField));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8;');
};

const exportAsTXT = (data: Strain[], fileName: string) => {
    const textWidth = 80;
    const hr = '─'.repeat(textWidth);
    const doubleHr = '═'.repeat(textWidth);

    let content = `${doubleHr}\n`;
    content += `| CANNABIS GROW GUIDE 2025 - STRAIN REPORT`.padEnd(textWidth - 1) + '|\n';
    content += `| Generated: ${new Date().toLocaleString()}`.padEnd(textWidth - 1) + '|\n';
    content += `| Total Strains: ${data.length}`.padEnd(textWidth - 1) + '|\n';
    content += `${doubleHr}\n\n`;

    const formatLine = (label: string, value: any) => {
        if (!value || String(value).trim() === '') return '';
        const paddedLabel = `${label}:`.padEnd(22, ' ');
        return `  ${paddedLabel}${String(value)}\n`;
    };

    const wrapText = (text: string, indent: number): string => {
        if (!text) return '';
        const maxLength = textWidth - indent - 2;
        const words = text.replace(/<br\s*\/?>/gi, ' ').split(' ');
        let currentLine = '';
        const lines: string[] = [];
        const indentation = ' '.repeat(indent);

        for (const word of words) {
            if ((currentLine + ' ' + word).length > maxLength) {
                lines.push(indentation + currentLine);
                currentLine = word;
            } else {
                currentLine += (currentLine ? ' ' : '') + word;
            }
        }
        if (currentLine) lines.push(indentation + currentLine);
        return lines.join('\n');
    };

    data.forEach(strain => {
        content += `${hr}\n`;
        content += `| ${strain.name.toUpperCase()} (${strain.type})`.padEnd(textWidth - 1) + '|\n';
        content += `${hr}\n\n`;

        content += `  --- GENERAL ---\n`;
        content += formatLine('Type Details', strain.typeDetails);
        content += formatLine('Genetics', strain.genetics);
        content += formatLine('Flowering Time', `${strain.floweringTimeRange || strain.floweringTime} weeks`);
        content += '\n';

        content += `  --- CANNABINOID PROFILE ---\n`;
        content += formatLine('THC', `${strain.thc}%${strain.thcRange ? ` (${strain.thcRange})` : ''}`);
        content += formatLine('CBD', `${strain.cbd}%${strain.cbdRange ? ` (${strain.cbdRange})` : ''}`);
        content += '\n';

        content += `  --- AROMA & TERPENES ---\n`;
        content += formatLine('Aromas', (strain.aromas || []).join(', '));
        content += formatLine('Dominant Terpenes', (strain.dominantTerpenes || []).join(', '));
        content += '\n';
        
        content += `  --- GROW CHARACTERISTICS ---\n`;
        content += formatLine('Difficulty', strain.agronomic.difficulty);
        content += formatLine('Yield', strain.agronomic.yield);
        content += formatLine('Yield (Indoor)', strain.agronomic.yieldDetails?.indoor);
        content += formatLine('Yield (Outdoor)', strain.agronomic.yieldDetails?.outdoor);
        content += formatLine('Height', strain.agronomic.height);
        content += formatLine('Height (Indoor)', strain.agronomic.heightDetails?.indoor);
        content += formatLine('Height (Outdoor)', strain.agronomic.heightDetails?.outdoor);
        content += '\n';

        if (strain.description) {
            content += `  --- DESCRIPTION ---\n`;
            content += wrapText(strain.description, 2) + '\n';
        }
        content += '\n\n';
    });
    
    downloadFile('\uFEFF' + content, `${fileName}.txt`, 'text/plain;charset=utf-8;');
};

const exportAsPDF = (data: Strain[], fileName: string, t: TFunction) => {
    const doc = new jsPDF() as any;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = 0;

    const addHeaderFooter = (data: any) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(normalizeGermanChars(`Seite ${data.pageNumber} von ${pageCount}`), pageWidth - margin, pageHeight - 10, { align: 'right' });
        doc.text(normalizeGermanChars('Cannabis Grow Guide 2025 - Sortenbericht'), margin, pageHeight - 10);
    };
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(normalizeGermanChars('Sortenbericht'), margin, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(normalizeGermanChars(`Generiert am: ${new Date().toLocaleString()}`), margin, 26);


    y = 40;

    data.forEach((strain, index) => {
        let neededHeight = 40; // Base height for tables
        if (strain.description) neededHeight += doc.splitTextToSize(strain.description.replace(/<br\s*\/?>/gi, ' '), pageWidth - margin * 2 - 45).length * 5;
        
        if (y + neededHeight > pageHeight - 20) {
            doc.addPage();
            y = 20;
        }
        
        if (index > 0) {
             doc.setDrawColor(226, 232, 240); // slate-200
             doc.line(margin, y - 5, pageWidth - margin, y - 5);
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246); // primary-500
        doc.text(normalizeGermanChars(strain.name), margin, y);
        y += 8;

        const tableProps = {
            startY: y,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.1 },
            headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
            didDrawPage: addHeaderFooter
        };

        const generalBody = [
            [
                { content: normalizeGermanChars(t('common.type')), styles:{fontStyle: 'bold'} },
                { content: normalizeGermanChars(`${strain.type} ${strain.typeDetails ? `(${strain.typeDetails})` : ''}`) },
                { content: normalizeGermanChars(t('common.genetics')), styles:{fontStyle: 'bold'} },
                { content: normalizeGermanChars(strain.genetics) || 'N/A' },
            ],
            [
                { content: normalizeGermanChars(t('strainsView.strainModal.floweringTime')), styles:{fontStyle: 'bold'} },
                { content: normalizeGermanChars(`${strain.floweringTimeRange || `${strain.floweringTime} ${t('strainsView.weeks')}`}`) },
                { content: normalizeGermanChars(t('strainsView.strainModal.difficulty')), styles:{fontStyle: 'bold'} },
                { content: normalizeGermanChars(t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)) },
            ],
        ];

        const cannaBody = [
             [
                { content: normalizeGermanChars(t('strainsView.strainModal.thc')), styles:{fontStyle: 'bold'} },
                { content: normalizeGermanChars(`${strain.thc}%${strain.thcRange ? ` (${strain.thcRange})` : ''}`) },
                { content: normalizeGermanChars(t('strainsView.strainModal.cbd')), styles:{fontStyle: 'bold'} },
                { content: normalizeGermanChars(`${strain.cbd}%${strain.cbdRange ? ` (${strain.cbdRange})` : ''}`) },
            ],
        ];

        doc.autoTable({ ...tableProps, body: generalBody });
        y = doc.lastAutoTable.finalY + 2;
        doc.autoTable({ ...tableProps, startY: y, body: cannaBody });
        y = doc.lastAutoTable.finalY + 8;
        
        doc.autoTable({
            startY: y,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 1.5 },
            columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold', textColor: [51, 65, 85] } },
            body: [
                 ...(strain.aromas?.length ? [[normalizeGermanChars(t('strainsView.strainModal.aromas')), normalizeGermanChars(strain.aromas.join(', '))]] : []),
                 ...(strain.dominantTerpenes?.length ? [[normalizeGermanChars(t('strainsView.strainModal.dominantTerpenes')), normalizeGermanChars(strain.dominantTerpenes.join(', '))]] : []),
                 [{ content: '---'}], // separator
                 [normalizeGermanChars(t('strainsView.addStrainModal.yield')), normalizeGermanChars(strain.agronomic.yield)],
                 [normalizeGermanChars(t('strainsView.strainModal.yieldIndoor')), normalizeGermanChars(strain.agronomic.yieldDetails?.indoor) || 'N/A'],
                 [normalizeGermanChars(t('strainsView.strainModal.yieldOutdoor')), normalizeGermanChars(strain.agronomic.yieldDetails?.outdoor) || 'N/A'],
                 [{ content: '---'}],
                 [normalizeGermanChars(t('strainsView.detailedView.height')), normalizeGermanChars(strain.agronomic.height)],
                 [normalizeGermanChars(t('strainsView.strainModal.heightIndoor')), normalizeGermanChars(strain.agronomic.heightDetails?.indoor) || 'N/A'],
                 [normalizeGermanChars(t('strainsView.strainModal.heightOutdoor')), normalizeGermanChars(strain.agronomic.heightDetails?.outdoor) || 'N/A'],
            ],
            didDrawPage: addHeaderFooter
        });
        y = doc.lastAutoTable.finalY + 8;

        if (strain.description) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text(normalizeGermanChars(t('common.description')), margin, y);
            y += 5;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            const splitDescription = doc.splitTextToSize(normalizeGermanChars(strain.description.replace(/<br\s*\/?>/gi, ' ')), pageWidth - margin * 2);
            doc.text(splitDescription, margin, y);
            y += (splitDescription.length * 4) + 10;
        }
    });
    
    addHeaderFooter({ pageNumber: doc.internal.getNumberOfPages() });
    doc.save(`${fileName}.pdf`);
};

export const exportService = {
  exportAsJSON,
  exportAsCSV,
  exportAsPDF,
  exportAsTXT,
};
