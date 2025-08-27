import { Strain } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// The module augmentation for 'jspdf' was causing a compilation error.
// It has been removed, and a type assertion is used below to allow the call
// to `autoTable`, which is added at runtime by `jspdf-autotable`.
/*
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}
*/

const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const link = document.createElement('a');
    const file = new Blob([content], { type: mimeType });
    link.href = URL.createObjectURL(file);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
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
        `"${strain.name.replace(/"/g, '""')}"`,
        strain.type,
        `"${(strain.typeDetails || '').replace(/"/g, '""')}"`,
        `"${(strain.genetics || '').replace(/"/g, '""')}"`,
        strain.thc,
        `"${strain.thcRange || ''}"`,
        strain.cbd,
        `"${strain.cbdRange || ''}"`,
        strain.floweringTime,
        `"${strain.floweringTimeRange || ''}"`,
        `"${(strain.description || '').replace(/"/g, '""').replace(/(\r\n|\n|\r|<br>)/gm, ' ')}"`,
        `"${(strain.aromas || []).join(', ')}"`,
        `"${(strain.dominantTerpenes || []).join(', ')}"`,
        strain.agronomic.difficulty,
        `"${strain.agronomic.yieldDetails?.indoor || ''}"`,
        `"${strain.agronomic.yieldDetails?.outdoor || ''}"`,
        `"${strain.agronomic.heightDetails?.indoor || ''}"`,
        `"${strain.agronomic.heightDetails?.outdoor || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8;');
};


const exportAsPDF = (data: Strain[], fileName: string) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 15;
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(18);
    doc.text('Strain Database Export', margin, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.text(`${data.length} strains | ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 12;

    const checkAndAddPage = (neededHeight: number) => {
        if (yPos + neededHeight > pageHeight - margin) {
            doc.addPage();
            yPos = 20;
        }
    };

    data.forEach((strain) => {
        // Estimate height and add page if needed before drawing
        const descriptionLines = strain.description ? doc.splitTextToSize(strain.description.replace(/(\r\n|\n|\r|<br>)/gm, ' '), pageWidth - margin * 2).length : 0;
        const requiredSpace = 60 + (descriptionLines * 4);
        checkAndAddPage(requiredSpace);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(strain.name, margin, yPos);
        yPos += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const addLine = (label: string, value?: string | number | null) => {
            if (value && value.toString().trim() !== '') {
                doc.setFont('helvetica', 'bold');
                doc.text(`${label}:`, margin, yPos);
                doc.setFont('helvetica', 'normal');
                const text = value.toString();
                const textWidth = doc.getTextWidth(`${label}: `);
                const splitText = doc.splitTextToSize(text, pageWidth - margin * 2 - textWidth);
                doc.text(splitText, margin + textWidth + 1, yPos);
                yPos += splitText.length * 4 + 1;
            }
        };

        let typeText = strain.type;
        if (strain.typeDetails) typeText += ` (${strain.typeDetails})`;
        addLine('Type', typeText);
        addLine('Genetics', strain.genetics);
        
        let thcText = `${strain.thc}%`;
        if (strain.thcRange) thcText += ` (${strain.thcRange})`;
        addLine('THC', thcText);
        
        let cbdText = `${strain.cbd}%`;
        if (strain.cbdRange) cbdText += ` (${strain.cbdRange})`;
        addLine('CBD', cbdText);

        let floweringText = `${strain.floweringTime} weeks`;
        if (strain.floweringTimeRange) floweringText += ` (${strain.floweringTimeRange})`;
        addLine('Flowering Time', floweringText);
        
        addLine('Difficulty', strain.agronomic.difficulty);

        if(strain.agronomic.yieldDetails) {
             addLine('Yield (Indoor)', strain.agronomic.yieldDetails.indoor);
             addLine('Yield (Outdoor)', strain.agronomic.yieldDetails.outdoor);
        }
       
        if(strain.agronomic.heightDetails) {
            addLine('Height (Indoor)', strain.agronomic.heightDetails.indoor);
            addLine('Height (Outdoor)', strain.agronomic.heightDetails.outdoor);
        }

        addLine('Aromas', (strain.aromas || []).join(', '));
        addLine('Dominant Terpenes', (strain.dominantTerpenes || []).join(', '));
        
        if (strain.description) {
            yPos += 2;
            doc.setFont('helvetica', 'italic');
            const descText = doc.splitTextToSize(strain.description.replace(/(\r\n|\n|\r|<br>)/gm, ' '), pageWidth - margin * 2);
            doc.text(descText, margin, yPos);
            doc.setFont('helvetica', 'normal');
            yPos += descText.length * 4;
        }

        // Separator line
        yPos += 5;
        if (yPos < pageHeight - margin) {
             doc.setDrawColor(200, 200, 200);
             doc.line(margin, yPos, pageWidth - margin, yPos);
        }
        yPos += 5;
    });
    
    doc.save(`${fileName}.pdf`);
};


export const exportService = {
    exportAsJSON,
    exportAsCSV,
    exportAsPDF,
};