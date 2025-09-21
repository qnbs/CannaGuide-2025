import { Strain, SavedSetup, RecommendationCategory } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type TFunction = (key: string, params?: Record<string, any>) => any;

const strainToCSVRow = (strain: Strain): Record<string, any> => ({
  Name: strain.name,
  Type: strain.type,
  THC: strain.thc,
  CBD: strain.cbd,
  FloweringTime: strain.floweringTime,
  Difficulty: strain.agronomic.difficulty,
  Yield: strain.agronomic.yield,
  Height: strain.agronomic.height,
  Genetics: strain.genetics || '',
  Description: (strain.description || '').replace(/"/g, '""'),
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
  downloadFile(jsonString, `${filename}.json`, 'application/json');
};

const exportAsCSV = (strains: Strain[], filename: string) => {
  const csvData = strains.map(strainToCSVRow);
  const csvString = arrayToCSV(csvData);
  downloadFile(csvString, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

const exportAsTXT = (strains: Strain[], filename: string, t: TFunction) => {
    let txtString = `Strain Export - ${new Date().toLocaleString()}\n\n`;
    strains.forEach(s => {
        txtString += `----------------------------------------\n`;
        txtString += `Name: ${s.name}\n`;
        txtString += `Type: ${s.type}\n`;
        txtString += `THC: ${s.thc}% | CBD: ${s.cbd}%\n`;
        txtString += `Flowering Time: ${s.floweringTime} weeks\n`;
        txtString += `Difficulty: ${s.agronomic.difficulty}\n`;
        txtString += `Yield: ${s.agronomic.yield} | Height: ${s.agronomic.height}\n`;
        if (s.description) txtString += `\nDescription:\n${s.description}\n`;
        txtString += `----------------------------------------\n\n`;
    });
    downloadFile(txtString, `${filename}.txt`, 'text/plain;charset=utf-8;');
};

const exportAsPDF = (strains: Strain[], filename: string, t: TFunction) => {
    // FIX: Removed problematic custom interface for jspdf-autotable.
    const doc = new jsPDF();
    doc.text('Cannabis Strain Report', 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const tableColumn = ["Name", "Type", "THC %", "CBD %", "Flowering (w)", "Difficulty"];
    const tableRows = strains.map(s => [
        s.name,
        s.type,
        s.thc.toFixed(1),
        s.cbd.toFixed(1),
        s.floweringTime,
        s.agronomic.difficulty
    ]);

    // FIX: Use type assertion to call autoTable, resolving TS errors.
    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
    });
    
    doc.save(`${filename}.pdf`);
};

// Setup export functions
const exportSetupAsJSON = (setup: SavedSetup) => {
    downloadFile(JSON.stringify(setup, null, 2), `${setup.name}.json`, 'application/json');
};

const exportSetupAsCSV = (setup: SavedSetup, t: TFunction) => {
    const data = (Object.keys(setup.recommendation) as RecommendationCategory[]).map(key => ({
        Component: t(`equipmentView.configurator.categories.${key}`),
        Product: setup.recommendation[key].name,
        Price: setup.recommendation[key].price,
        Rationale: `"${setup.recommendation[key].rationale.replace(/"/g, '""')}"`
    }));
    downloadFile(arrayToCSV(data), `${setup.name}.csv`, 'text/csv;charset=utf-8;');
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
    downloadFile(content, `${setup.name}.txt`, 'text/plain;charset=utf-8;');
};

const exportSetupAsPDF = (setup: SavedSetup, t: TFunction) => {
    // FIX: Removed problematic custom interface for jspdf-autotable.
    const doc = new jsPDF();
    doc.text(`${t('equipmentView.savedSetups.pdfReport.setup')}: ${setup.name}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`${t('equipmentView.savedSetups.pdfReport.createdAt')}: ${new Date(setup.createdAt).toLocaleString()}`, 14, 22);
    
    const tableColumn = [t('equipmentView.savedSetups.pdfReport.item'), t('equipmentView.savedSetups.pdfReport.product'), t('equipmentView.savedSetups.pdfReport.rationale'), t('equipmentView.savedSetups.pdfReport.price')];
    const tableRows = (Object.keys(setup.recommendation) as RecommendationCategory[]).map(key => {
        const item = setup.recommendation[key];
        return [
            t(`equipmentView.configurator.categories.${key}`),
            item.name,
            item.rationale,
            `${item.price.toFixed(2)} €`
        ];
    });

    tableRows.push(['', '', t('equipmentView.configurator.total'), `${setup.totalCost.toFixed(2)} €`]);

    // FIX: Use type assertion to call autoTable, resolving TS errors.
    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        didDrawCell: (data: any) => {
            if (data.row.index === tableRows.length - 1) {
                doc.setFont('helvetica', 'bold');
            }
        },
        styles: {
            halign: 'left'
        },
        headStyles: {
            fillColor: [38, 50, 56], // slate-800
            textColor: 240
        },
        columnStyles: {
            3: { halign: 'right' }
        }
    });
    doc.save(`${setup.name}.pdf`);
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