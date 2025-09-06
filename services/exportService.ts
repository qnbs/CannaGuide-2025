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
    const wrapText = (text: string, maxLength: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        for (const word of words) {
            if ((currentLine + word).length + 1 > maxLength) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine += ` ${word}`;
            }
        }
        lines.push(currentLine);
        return lines.map(line => line.trim());
    };

    let content = `Cannabis Grow Guide - Strain Report\nGenerated on: ${new Date().toLocaleString()}\n\n`;

    data.forEach(strain => {
        content += '========================================================================\n';
        content += `=== ${strain.name.toUpperCase()} ===\n`;
        content += '========================================================================\n\n';

        content += `Type: ${strain.type}${strain.typeDetails ? ` (${strain.typeDetails})` : ''}\n`;
        if (strain.genetics) content += `Genetics: ${strain.genetics}\n`;
        content += `THC: ${strain.thc}%${strain.thcRange ? ` (${strain.thcRange})` : ''}\n`;
        content += `CBD: ${strain.cbd}%${strain.cbdRange ? ` (${strain.cbdRange})` : ''}\n`;
        content += `Flowering Time: ${strain.floweringTime} weeks${strain.floweringTimeRange ? ` (${strain.floweringTimeRange})` : ''}\n\n`;

        content += 'PROFILE\n------------------------------------------------------------------------\n';
        if (strain.aromas?.length) content += `Aromas: ${(strain.aromas || []).join(', ')}\n`;
        if (strain.dominantTerpenes?.length) content += `Dominant Terpenes: ${(strain.dominantTerpenes || []).join(', ')}\n\n`;
        
        content += 'GROW INFO\n------------------------------------------------------------------------\n';
        content += `Difficulty: ${strain.agronomic.difficulty}\n`;
        if (strain.agronomic.yieldDetails?.indoor) content += `Yield (Indoor): ${strain.agronomic.yieldDetails.indoor}\n`;
        if (strain.agronomic.yieldDetails?.outdoor) content += `Yield (Outdoor): ${strain.agronomic.yieldDetails.outdoor}\n`;
        if (strain.agronomic.heightDetails?.indoor) content += `Height (Indoor): ${strain.agronomic.heightDetails.indoor}\n`;
        if (strain.agronomic.heightDetails?.outdoor) content += `Height (Outdoor): ${strain.agronomic.heightDetails.outdoor}\n\n`;

        if (strain.description) {
            content += 'DESCRIPTION\n------------------------------------------------------------------------\n';
            const cleanedDesc = strain.description.replace(/<br\s*\/?>/gi, ' ');
            content += wrapText(cleanedDesc, 72).join('\n') + '\n\n';
        }
        content += '\n';
    });
    
    downloadFile(content, `${fileName}.txt`, 'text/plain;charset=utf-8;');
};

const exportAsPDF = (data: Strain[], fileName: string, t: TFunction) => {
    const doc = new jsPDF() as any;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let y = margin;

    const strainTypeColors: Record<Strain['type'], string> = {
        Sativa: '#f59e0b',
        Indica: '#4f46e5',
        Hybrid: '#2563eb',
    };

    const addHeaderFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor('#888888');
            doc.text('Cannabis Grow Guide - Strain Report', margin, 10);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - margin, pageHeight - 10, { align: 'right' });
        }
    };

    const estimateStrainHeight = (strain: Strain): number => {
        let height = 20; // Title
        height += 35; // Stats table
        height += 15; // Profile header + content
        if (strain.description) {
            const lines = doc.splitTextToSize(strain.description.replace(/<br\s*\/?>/gi, ' '), 180);
            height += (lines.length * 5) + 12;
        }
        return height;
    };

    data.forEach(strain => {
        const neededHeight = estimateStrainHeight(strain);
        if (y + neededHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }

        // --- Strain Header ---
        doc.setFillColor(strainTypeColors[strain.type]);
        doc.rect(margin, y, doc.internal.pageSize.width - (margin * 2), 10, 'F');
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#FFFFFF');
        doc.text(strain.name, margin + 2, y + 7);
        y += 15;

        // --- Stats Table ---
        doc.autoTable({
            startY: y,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 1.5 },
            body: [
                [
                    { content: `${t('common.type')}:`, styles: { fontStyle: 'bold' } },
                    { content: `${strain.type} ${strain.typeDetails ? `(${strain.typeDetails})` : ''}` },
                    { content: `${t('strainsView.strainModal.floweringTime')}:`, styles: { fontStyle: 'bold' } },
                    { content: `${strain.floweringTimeRange || `${strain.floweringTime} ${t('strainsView.weeks')}`}` },
                ],
                [
                    { content: `${t('common.genetics')}:`, styles: { fontStyle: 'bold' } },
                    { content: strain.genetics || 'N/A' },
                    { content: `${t('strainsView.strainModal.difficulty')}:`, styles: { fontStyle: 'bold' } },
                    { content: t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`) },
                ],
                [
                    { content: 'THC / CBD:', styles: { fontStyle: 'bold' } },
                    { content: `${strain.thcRange || strain.thc + '%'} / ${strain.cbdRange || strain.cbd + '%'}` },
                    { content: `${t('strainsView.strainModal.yieldIndoor')}:`, styles: { fontStyle: 'bold' } },
                    { content: strain.agronomic.yieldDetails?.indoor || 'N/A' },
                ],
            ],
        });
        y = doc.lastAutoTable.finalY + 5;

        // --- Profile Section ---
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#334155');
        doc.text(t('strainsView.addStrainModal.profile').toUpperCase(), margin, y);
        y += 6;

        const profileData = [];
        if (strain.aromas?.length) profileData.push([{ content: `${t('strainsView.strainModal.aromas')}:`, styles: { fontStyle: 'bold' } }, { content: strain.aromas.join(', ') }]);
        if (strain.dominantTerpenes?.length) profileData.push([{ content: `${t('strainsView.strainModal.dominantTerpenes')}:`, styles: { fontStyle: 'bold' } }, { content: strain.dominantTerpenes.join(', ') }]);

        if (profileData.length > 0) {
            doc.autoTable({
                startY: y,
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 1 },
                columnStyles: { 0: { cellWidth: 40 } },
                body: profileData,
            });
            y = doc.lastAutoTable.finalY + 5;
        } else {
            y -= 6; // Revert if no profile data
        }

        // --- Description ---
        if (strain.description) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#334155');
            doc.text(t('common.description').toUpperCase(), margin, y);
            y += 6;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor('#475569');
            const splitDescription = doc.splitTextToSize(strain.description.replace(/<br\s*\/?>/gi, ' '), doc.internal.pageSize.width - margin * 2);
            doc.text(splitDescription, margin, y);
            y += (splitDescription.length * 4) + 5;
        }

        y += 5; // Space between entries
    });

    addHeaderFooter();
    doc.save(`${fileName}.pdf`);
};


export const exportService = {
  exportAsJSON,
  exportAsCSV,
  exportAsPDF,
  exportAsTXT,
};