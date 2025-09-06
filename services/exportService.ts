import { Strain } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

type TFunction = (key: string, replacements?: Record<string, string | number>) => string;

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
    downloadFile(jsonString, `${fileName}.json`, 'application/json');
};

const exportAsCSV = (data: Strain[], fileName: string) => {
    const headers = [
        'ID', 'Name', 'Type', 'Type Details', 'Genetics',
        'THC (%)', 'THC Range', 'CBD (%)', 'CBD Range',
        'Flowering Time (weeks)', 'Flowering Time Range',
        'Description', 'Aromas', 'Dominant Terpenes',
        'Difficulty', 'Yield (Indoor)', 'Yield (Outdoor)',
        'Height (Indoor)', 'Height (Outdoor)'
    ];

    const rows = data.map(strain => [
        strain.id,
        strain.name,
        strain.type,
        strain.typeDetails || '',
        strain.genetics || '',
        strain.thc,
        strain.thcRange || '',
        strain.cbd,
        strain.cbdRange || '',
        strain.floweringTime,
        strain.floweringTimeRange || '',
        (strain.description || '').replace(/<br>/g, ' '),
        (strain.aromas || []).join('; '),
        (strain.dominantTerpenes || []).join('; '),
        strain.agronomic.difficulty,
        strain.agronomic.yieldDetails?.indoor || '',
        strain.agronomic.yieldDetails?.outdoor || '',
        strain.agronomic.heightDetails?.indoor || '',
        strain.agronomic.heightDetails?.outdoor || ''
    ].map(escapeCsvField));

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8;');
};

const exportAsTXT = (data: Strain[], fileName: string) => {
    const textWidth = 80;
    const hr = '─'.repeat(textWidth);

    const formatLine = (label: string, value: string | undefined | null) => {
        if (!value || value.trim() === '') return '';
        const paddedLabel = `${label}:`.padEnd(22, ' ');
        return `  ${paddedLabel}${value}\n`;
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
        if (currentLine) {
            lines.push(indentation + currentLine);
        }
        return lines.join('\n');
    };

    let content = `CANNABIS GROW GUIDE 2025 - STRAIN REPORT\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    content += `Total Strains: ${data.length}\n\n`;

    data.forEach(strain => {
        content += `${hr}\n`;
        content += `| ${strain.name.toUpperCase().padEnd(textWidth - 4)} |\n`;
        content += `${hr}\n\n`;

        content += `  --- GENERAL ---\n`;
        content += formatLine('Type', `${strain.type}${strain.typeDetails ? ` (${strain.typeDetails})` : ''}`);
        content += formatLine('Genetics', strain.genetics);
        content += formatLine('Flowering Time', `${strain.floweringTimeRange || strain.floweringTime} weeks`);
        content += formatLine('Difficulty', strain.agronomic.difficulty);
        content += '\n';

        content += `  --- CANNABINOIDS ---\n`;
        content += formatLine('THC', `${strain.thc}%${strain.thcRange ? ` (${strain.thcRange})` : ''}`);
        content += formatLine('CBD', `${strain.cbd}%${strain.cbdRange ? ` (${strain.cbdRange})` : ''}`);
        content += '\n';

        content += `  --- PROFILE ---\n`;
        content += formatLine('Aromas', (strain.aromas || []).join(', '));
        content += formatLine('Dominant Terpenes', (strain.dominantTerpenes || []).join(', '));
        content += '\n';
        
        content += `  --- GROW INFO ---\n`;
        content += formatLine('Yield (Indoor)', strain.agronomic.yieldDetails?.indoor);
        content += formatLine('Yield (Outdoor)', strain.agronomic.yieldDetails?.outdoor);
        content += formatLine('Height (Indoor)', strain.agronomic.heightDetails?.indoor);
        content += formatLine('Height (Outdoor)', strain.agronomic.heightDetails?.outdoor);
        content += '\n';

        if (strain.description) {
            content += `  --- DESCRIPTION ---\n`;
            content += wrapText(strain.description, 2) + '\n';
        }
        content += '\n\n';
    });
    
    downloadFile(content, `${fileName}.txt`, 'text/plain;charset=utf-8;');
};

const exportAsPDF = (data: Strain[], fileName: string, t: TFunction) => {
    const doc = new jsPDF() as any;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = 0;

    const strainTypeColors: Record<Strain['type'], [number, number, number]> = {
        Sativa: [245, 158, 11], // amber-500
        Indica: [79, 70, 229],  // indigo-600
        Hybrid: [59, 130, 246], // blue-500
    };

    const addHeaderFooter = (data: any) => {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85); // slate-700
        doc.text('Cannabis Grow Guide - Strain Report', margin, 20);

        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    };

    y = 30;

    data.forEach((strain) => {
        let neededHeight = 25; // Header + initial spacing
        if (strain.description) neededHeight += doc.splitTextToSize(strain.description.replace(/<br\s*\/?>/gi, ' '), pageWidth - margin * 2).length * 4.5;
        if (strain.aromas?.length) neededHeight += 12;
        if (strain.dominantTerpenes?.length) neededHeight += 12;

        if (y + neededHeight > pageHeight - 20) {
            doc.addPage();
            y = 30;
        }
        
        if (y > 30) {
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.line(margin, y - 5, pageWidth - margin, y - 5);
        }

        doc.setFillColor(...strainTypeColors[strain.type]);
        doc.rect(margin, y, pageWidth - (margin * 2), 10, 'F');
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(strain.name, margin + 3, y + 7);
        y += 15;

        doc.autoTable({
            startY: y,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.1 },
            headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold', cellPadding: {top: 2, right: 2, bottom: 2, left: 2} },
            body: [
                [
                    { content: t('common.type'), styles:{fontStyle: 'bold'} },
                    { content: `${strain.type} ${strain.typeDetails ? `(${strain.typeDetails})` : ''}` },
                    { content: t('common.genetics'), styles:{fontStyle: 'bold'} },
                    { content: strain.genetics || 'N/A' },
                ],
                [
                    { content: 'THC / CBD', styles:{fontStyle: 'bold'} },
                    { content: `${strain.thcRange || strain.thc + '%'} / ${strain.cbdRange || strain.cbd + '%'}` },
                    { content: t('strainsView.strainModal.floweringTime'), styles:{fontStyle: 'bold'} },
                    { content: `${strain.floweringTimeRange || `${strain.floweringTime} ${t('strainsView.weeks')}`}` },
                ],
                 [
                    { content: t('strainsView.strainModal.difficulty'), styles:{fontStyle: 'bold'} },
                    { content: t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`) },
                    { content: t('strainsView.strainModal.yieldIndoor'), styles:{fontStyle: 'bold'} },
                    { content: strain.agronomic.yieldDetails?.indoor || 'N/A' },
                ],
            ],
            didDrawPage: addHeaderFooter
        });
        y = doc.lastAutoTable.finalY + 8;
        
        if ((strain.aromas?.length || strain.dominantTerpenes?.length) && y < pageHeight - 20) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text(t('strainsView.addStrainModal.profile').toUpperCase(), margin, y);
            y += 6;
            
            doc.autoTable({
                startY: y,
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 1 },
                columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } },
                body: [
                    ...(strain.aromas?.length ? [[t('strainsView.strainModal.aromas'), strain.aromas.join(', ')]] : []),
                    ...(strain.dominantTerpenes?.length ? [[t('strainsView.strainModal.dominantTerpenes'), strain.dominantTerpenes.join(', ')]] : []),
                ],
                didDrawPage: addHeaderFooter
            });
            y = doc.lastAutoTable.finalY + 8;
        }

        if (strain.description && y < pageHeight - 20) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text(t('common.description').toUpperCase(), margin, y);
            y += 6;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            const splitDescription = doc.splitTextToSize(strain.description.replace(/<br\s*\/?>/gi, ' '), pageWidth - margin * 2);
            doc.text(splitDescription, margin, y);
            y += (splitDescription.length * 4) + 10;
        }
    });
    
    // Call header/footer one last time to ensure the final page gets numbered.
    const finalPageData = { pageNumber: doc.internal.getNumberOfPages() };
    addHeaderFooter(finalPageData);

    doc.save(`${fileName}.pdf`);
};


export const exportService = {
  exportAsJSON,
  exportAsCSV,
  exportAsPDF,
  exportAsTXT,
};