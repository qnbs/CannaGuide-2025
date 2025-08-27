import { Strain } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
        strain.description || '',
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

const exportAsPDF = (data: Strain[], fileName: string) => {
    const doc = new jsPDF() as any;

    const addHeaderFooter = (totalPages: number) => {
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text('Cannabis Strain Report', 14, 10);
            doc.text(`Seite ${i} von ${totalPages}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        }
    };
    
    let finalY = 15;

    data.forEach((strain, index) => {
        // Check if there is enough space for the next entry, add a page if not
        if (finalY > 220) {
            doc.addPage();
            finalY = 15;
        }

        // Add a separator line if not the first entry on the page
        if (index > 0 && finalY > 15) {
             doc.setDrawColor(220);
             doc.line(14, finalY, 200, finalY);
             finalY += 8;
        }

        doc.setFontSize(16);
        doc.setTextColor(37, 99, 235);
        doc.text(strain.name, 14, finalY);
        finalY += 8;

        const tableData = [
            ['Typ', `${strain.type} ${strain.typeDetails ? `(${strain.typeDetails})` : ''}`],
            ['Genetik', strain.genetics || 'N/A'],
            ['THC / CBD', `${strain.thcRange || strain.thc + '%'} / ${strain.cbdRange || strain.cbd + '%'}`],
            ['Blütezeit', strain.floweringTimeRange || `${strain.floweringTime} Wochen`],
            ['Schwierigkeit', strain.agronomic.difficulty],
            ['Aromen', (strain.aromas || []).join(', ') || 'N/A']
        ];
        
        doc.autoTable({
            startY: finalY,
            body: tableData,
            theme: 'plain',
            styles: {
                fontSize: 10,
                cellPadding: 2,
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40 }
            }
        });

        finalY = doc.lastAutoTable.finalY;

        if (strain.description) {
            finalY += 5;
            if (finalY > 260) {
                 doc.addPage();
                 finalY = 15;
            }
            doc.setFontSize(11);
            doc.setTextColor(40);
            doc.text('Beschreibung:', 14, finalY);
            finalY += 6;

            doc.setFontSize(10);
            doc.setTextColor(100);
            const splitDescription = doc.splitTextToSize(strain.description.replace(/<br\s*\/?>/gi, ' '), 180);
            doc.text(splitDescription, 14, finalY);
            finalY += (splitDescription.length * 4);
        }
        
        finalY += 10;
    });

    addHeaderFooter(doc.internal.getNumberOfPages());
    doc.save(`${fileName}.pdf`);
};

export const exportService = {
  exportAsJSON,
  exportAsCSV,
  exportAsPDF,
};