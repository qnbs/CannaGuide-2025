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
    document.body.appendChild(link); // Append link to the body to ensure it works in all browsers
    link.click();
    document.body.removeChild(link); // Clean up by removing the link
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
    content += `| Cannabis Grow Guide with Gemini - Strain Report`.padEnd(textWidth - 1) + '|\n';
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
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = margin;
    let pageNumber = 1;

    const addHeaderFooter = () => {
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(normalizeGermanChars(t('strainsView.pdfReport.page', { pageNumber })), pageWidth - margin, pageHeight - 10, { align: 'right' });
        doc.text(normalizeGermanChars(t('strainsView.pdfReport.title')), margin, pageHeight - 10);
    };

    const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 20) {
            addHeaderFooter();
            doc.addPage();
            y = margin;
            pageNumber++;
        }
    };

    const drawSectionTitle = (title: string) => {
        checkPageBreak(12);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text(normalizeGermanChars(title), margin, y);
        y += 7;
    };
    
    const drawKeyValuePair = (key: string, value: string | null | undefined) => {
        if (!value) return;
        const valueLines = doc.splitTextToSize(normalizeGermanChars(value), pageWidth - margin * 2 - 45);
        checkPageBreak(valueLines.length * 5 + 2);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text(normalizeGermanChars(key) + ':', margin, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(valueLines, margin + 45, y);
        y += valueLines.length * 5 + 2;
    };

    data.forEach((strain, index) => {
        if (index > 0) {
            addHeaderFooter();
            doc.addPage();
            y = margin;
            pageNumber++;
        }
        
        // Strain Title
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text(normalizeGermanChars(strain.name), margin, y);
        y += 10;
        
        // General Info
        drawSectionTitle(normalizeGermanChars(t('strainsView.addStrainModal.generalInfo')));
        drawKeyValuePair(normalizeGermanChars(t('common.type')), `${strain.type} ${strain.typeDetails ? `(${strain.typeDetails})` : ''}`);
        drawKeyValuePair(normalizeGermanChars(t('common.genetics')), strain.genetics);
        drawKeyValuePair(normalizeGermanChars(t('strainsView.strainModal.floweringTime')), `${strain.floweringTimeRange || `${strain.floweringTime} ${t('strainsView.weeks')}`}`);
        y += 5;
        
        // Cannabinoids
        drawSectionTitle(normalizeGermanChars(t('strainsView.addStrainModal.cannabinoids')));
        drawKeyValuePair(normalizeGermanChars(t('strainsView.strainModal.thc')), `${strain.thc}%${strain.thcRange ? ` (${strain.thcRange})` : ''}`);
        drawKeyValuePair(normalizeGermanChars(t('strainsView.strainModal.cbd')), `${strain.cbd}%${strain.cbdRange ? ` (${strain.cbdRange})` : ''}`);
        y += 5;
        
        // Profile
        drawSectionTitle(normalizeGermanChars(t('strainsView.addStrainModal.profile')));
        drawKeyValuePair(normalizeGermanChars(t('strainsView.strainModal.aromas')), (strain.aromas || []).join(', '));
        drawKeyValuePair(normalizeGermanChars(t('strainsView.strainModal.dominantTerpenes')), (strain.dominantTerpenes || []).join(', '));
        
        if (strain.description) {
            const descriptionLines = doc.splitTextToSize(normalizeGermanChars(strain.description.replace(/<br\s*\/?>/gi, ' ')), pageWidth - margin * 2 - 45);
            checkPageBreak(descriptionLines.length * 5 + 9);
            drawKeyValuePair(normalizeGermanChars(t('common.description')), strain.description.replace(/<br\s*\/?>/gi, ' '));
        }
        y += 5;
        
        // Agronomics
        drawSectionTitle(normalizeGermanChars(t('strainsView.strainModal.agronomicData')));
        drawKeyValuePair(normalizeGermanChars(t('strainsView.strainModal.difficulty')), t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`));
        drawKeyValuePair(normalizeGermanChars(t('strainsView.addStrainModal.yield')), t(`strainsView.addStrainModal.yields.${strain.agronomic.yield.toLowerCase()}`));
        drawKeyValuePair(normalizeGermanChars(t('strainsView.strainModal.yieldIndoor')), strain.agronomic.yieldDetails?.indoor);
        drawKeyValuePair(normalizeGermanChars(t('strainsView.strainModal.yieldOutdoor')), strain.agronomic.yieldDetails?.outdoor);
        drawKeyValuePair(normalizeGermanChars(t('strainsView.strainModal.height')), t(`strainsView.heights.${strain.agronomic.height.toLowerCase()}`));
        drawKeyValuePair(normalizeGermanChars(t('strainsView.strainModal.heightIndoor')), strain.agronomic.heightDetails?.indoor);
        drawKeyValuePair(normalizeGermanChars(t('strainsView.strainModal.heightOutdoor')), strain.agronomic.heightDetails?.outdoor);
        
        addHeaderFooter();
    });
    
    doc.save(`${fileName}.pdf`);
};


export const exportService = {
  exportAsJSON,
  exportAsCSV,
  exportAsPDF,
  exportAsTXT,
};