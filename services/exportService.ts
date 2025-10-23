import { Strain, SavedStrainTip, SavedSetup, RecommendationCategory, RecommendationItem } from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { TFunction } from 'i18next';

class ExportService {
  private generateTxt(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    this.triggerDownload(url, fileName);
  }

  private triggerDownload(url: string, fileName: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
  }

  public exportStrainsAsPdf(strains: Strain[], fileName: string, t: TFunction) {
    const doc = new jsPDF();
    const leftMargin = 15;
    const rightMargin = 15;
    const topMargin = 20;
    const contentWidth = 210 - leftMargin - rightMargin;
    const valueOffset = 50;

    strains.forEach((strain, index) => {
        if (index > 0) {
            doc.addPage();
        }
        
        let y = topMargin;

        // --- Header ---
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text('CannaGuide 2025', leftMargin, topMargin - 10);
        doc.text(t('strainsView.exportModal.title'), 210 - rightMargin, topMargin - 10, { align: 'right' });
        doc.setDrawColor(50);
        doc.line(leftMargin, topMargin - 7, 210 - rightMargin, topMargin - 7);
        doc.setTextColor(0);

        // --- Strain Name ---
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 50, 70);
        doc.text(strain.name, leftMargin, y);
        y += 12;

        // --- Helper Functions ---
        const printKeyValuePair = (key: string, value: string | undefined | null, keyBold = true, valBold = false) => {
            if (!value) return;
            doc.setFontSize(11);
            doc.setFont('helvetica', keyBold ? 'bold' : 'normal');
            doc.setTextColor(50);
            doc.text(key + ':', leftMargin, y);
            doc.setFont('helvetica', valBold ? 'bold' : 'normal');
            doc.setTextColor(20);
            doc.text(value, leftMargin + valueOffset, y);
            y += 7;
        };

        const printSectionTitle = (title: string) => {
            y += 8;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 50, 70);
            doc.text(title, leftMargin, y);
            y += 8;
        };
        
        const printTextBlock = (title: string, text: string | undefined | null) => {
            if (!text) return;
            printSectionTitle(title);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(20);
            const splitText = doc.splitTextToSize(text, contentWidth);
            doc.text(splitText, leftMargin, y);
            y += splitText.length * 5 + 5;
        };

        // --- Content Sections ---
        printKeyValuePair(t('common.type'), t(`strainsData.${strain.id}.typeDetails`, { defaultValue: strain.typeDetails || strain.type }));
        printKeyValuePair(t('common.genetics'), t(`strainsData.${strain.id}.genetics`, { defaultValue: strain.genetics || 'N/A' }));

        printSectionTitle(t('strainsView.strainDetail.cannabinoidProfile'));
        printKeyValuePair(t('strainsView.table.thc'), strain.thcRange || `${strain.thc}%`);
        printKeyValuePair(t('strainsView.table.cbd'), strain.cbdRange || `${strain.cbd}%`);

        printSectionTitle(t('strainsView.strainModal.agronomicData'));
        printKeyValuePair(t('strainsView.table.difficulty'), t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`));
        printKeyValuePair(t('strainsView.table.flowering'), strain.floweringTimeRange ? `${strain.floweringTimeRange} ${t('common.units.weeks')}` : `${strain.floweringTime} ${t('common.units.weeks')}`);
        printKeyValuePair(t('strainsView.strainModal.yieldIndoor'), t(`strainsData.${strain.id}.yieldDetails.indoor`, { defaultValue: strain.agronomic.yieldDetails?.indoor }));
        printKeyValuePair(t('strainsView.strainModal.yieldOutdoor'), t(`strainsData.${strain.id}.yieldDetails.outdoor`, { defaultValue: strain.agronomic.yieldDetails?.outdoor }));
        printKeyValuePair(t('strainsView.strainModal.heightIndoor'), t(`strainsData.${strain.id}.heightDetails.indoor`, { defaultValue: strain.agronomic.heightDetails?.indoor }));
        printKeyValuePair(t('strainsView.strainModal.heightOutdoor'), t(`strainsData.${strain.id}.heightDetails.outdoor`, { defaultValue: strain.agronomic.heightDetails?.outdoor }));
        
        printSectionTitle(t('strainsView.strainDetail.aromaProfile'));
        printKeyValuePair(t('strainsView.strainModal.aromas'), (strain.aromas || []).map(a => t(`common.aromas.${a}`, { defaultValue: a })).join(', '));
        printKeyValuePair(t('strainsView.strainModal.dominantTerpenes'), (strain.dominantTerpenes || []).map(terp => t(`common.terpenes.${terp}`, { defaultValue: terp })).join(', '));

        const description = t(`strainsData.${strain.id}.description`, { defaultValue: strain.description });
        printTextBlock(t('common.description'), description);
    });

    // --- Add Footers to all pages ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`${t('common.generated')}: ${new Date().toLocaleString()}`, leftMargin, 297 - 10);
        doc.text(`${t('common.page')} ${i} / ${pageCount}`, 210 - rightMargin, 297 - 10, { align: 'right' });
    }

    doc.save(`${fileName}.pdf`);
  }

  public exportStrainsAsTxt(strains: Strain[], fileName: string, t: TFunction) {
    let content = `CannaGuide 2025 - ${t('strainsView.exportModal.title')}\n`;
    content += `${t('common.generated')}: ${new Date().toLocaleString()}\n\n`;
    
    strains.forEach(s => {
        content += `========================================\n`;
        content += `${s.name.toUpperCase()}\n`;
        content += `========================================\n\n`;
        
        content += `${t('common.type')}: ${t(`strainsData.${s.id}.typeDetails`, { defaultValue: s.typeDetails || s.type })}\n`;
        content += `${t('common.genetics')}: ${t(`strainsData.${s.id}.genetics`, { defaultValue: s.genetics || 'N/A' })}\n\n`;
        
        content += `--- ${t('strainsView.strainDetail.cannabinoidProfile')} ---\n`;
        content += `${t('strainsView.table.thc')}: ${s.thcRange || `${s.thc}%`}\n`;
        content += `${t('strainsView.table.cbd')}: ${s.cbdRange || `${s.cbd}%`}\n\n`;
        
        content += `--- ${t('strainsView.strainModal.agronomicData')} ---\n`;
        content += `${t('strainsView.table.difficulty')}: ${t(`strainsView.difficulty.${s.agronomic.difficulty.toLowerCase()}`)}\n`;
        content += `${t('strainsView.table.flowering')}: ${s.floweringTimeRange || s.floweringTime} ${t('common.units.weeks')}\n`;
        content += `${t('strainsView.strainModal.yieldIndoor')}: ${t(`strainsData.${s.id}.yieldDetails.indoor`, { defaultValue: s.agronomic.yieldDetails?.indoor || 'N/A' })}\n`;
        content += `${t('strainsView.strainModal.yieldOutdoor')}: ${t(`strainsData.${s.id}.yieldDetails.outdoor`, { defaultValue: s.agronomic.yieldDetails?.outdoor || 'N/A' })}\n`;
        content += `${t('strainsView.strainModal.heightIndoor')}: ${t(`strainsData.${s.id}.heightDetails.indoor`, { defaultValue: s.agronomic.heightDetails?.indoor || 'N/A' })}\n`;
        content += `${t('strainsView.strainModal.heightOutdoor')}: ${t(`strainsData.${s.id}.heightDetails.outdoor`, { defaultValue: s.agronomic.heightDetails?.outdoor || 'N/A' })}\n\n`;

        content += `--- ${t('strainsView.strainDetail.aromaProfile')} ---\n`;
        content += `${t('strainsView.strainModal.aromas')}: ${(s.aromas || []).map(a => t(`common.aromas.${a}`, { defaultValue: a })).join(', ')}\n`;
        content += `${t('strainsView.strainModal.dominantTerpenes')}: ${(s.dominantTerpenes || []).map(terp => t(`common.terpenes.${terp}`, { defaultValue: terp })).join(', ')}\n\n`;

        content += `--- ${t('common.description')} ---\n`;
        content += `${t(`strainsData.${s.id}.description`, { defaultValue: s.description || 'N/A' })}\n\n\n`;
    });
    this.generateTxt(content, `${fileName}.txt`);
  }

  public exportStrainTips(tips: SavedStrainTip[], format: 'pdf' | 'txt', fileName: string, t: TFunction) {
     if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text(`${t('strainsView.tips.title')}`, 14, 15);
        let y = 25;
        tips.forEach(tip => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', 'bold');
            doc.text(tip.title, 14, y);
            y += 7;
            doc.setFont('helvetica', 'normal');
            const content = `${t('strainsView.tips.form.categories.nutrientTip')}: ${tip.nutrientTip}\n${t('strainsView.tips.form.categories.trainingTip')}: ${tip.trainingTip}\n${t('strainsView.tips.form.categories.environmentalTip')}: ${tip.environmentalTip}\n${t('strainsView.tips.form.categories.proTip')}: ${tip.proTip}`;
            const splitContent = doc.splitTextToSize(content, 180);
            doc.text(splitContent, 14, y);
            y += splitContent.length * 5 + 10;
        });
        doc.save(`${fileName}.pdf`);
     } else {
         let content = `${t('strainsView.tips.title')}\n========================\n\n`;
         tips.forEach(tip => {
             content += `${tip.title}\n------------------------\n`;
             content += `${t('strainsView.tips.form.categories.nutrientTip')}: ${tip.nutrientTip}\n`;
             content += `${t('strainsView.tips.form.categories.trainingTip')}: ${tip.trainingTip}\n`;
             content += `${t('strainsView.tips.form.categories.environmentalTip')}: ${tip.environmentalTip}\n`;
             content += `${t('strainsView.tips.form.categories.proTip')}: ${tip.proTip}\n\n`;
         });
         this.generateTxt(content, `${fileName}.txt`);
     }
  }

  public exportSetupsAsPdf(setups: SavedSetup[], fileName: string, t: TFunction) {
    const doc = new jsPDF();
    const leftMargin = 15;
    const rightMargin = 15;
    const topMargin = 20;
    const contentWidth = 210 - leftMargin - rightMargin;

    setups.forEach((setup, index) => {
        if (index > 0) doc.addPage();
        let y = topMargin;

        // Header
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text('CannaGuide 2025', leftMargin, topMargin - 10);
        doc.text(t('equipmentView.savedSetups.pdfReport.title'), 210 - rightMargin, topMargin - 10, { align: 'right' });
        doc.setDrawColor(50);
        doc.line(leftMargin, topMargin - 7, 210 - rightMargin, topMargin - 7);
        
        // Title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 50, 70);
        doc.text(setup.name, leftMargin, y);
        y += 8;
        
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`${t('common.generated')}: ${new Date(setup.createdAt).toLocaleString()}`, leftMargin, y);
        y += 10;
        
        // Source details
        if (setup.sourceDetails) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 50, 70);
            doc.text(t('equipmentView.savedSetups.pdfReport.sourceDetails'), leftMargin, y);
            y += 7;
            
            const sourceDetails = [
                [t('equipmentView.savedSetups.pdfReport.plantCount'), setup.sourceDetails.plantCount],
                [t('equipmentView.savedSetups.pdfReport.experience'), t(`strainsView.tips.form.experienceOptions.${setup.sourceDetails.experience}`)],
                [t('equipmentView.savedSetups.pdfReport.budget'), `${setup.sourceDetails.budget} ${t('common.units.currency_eur')}`],
                [t('equipmentView.savedSetups.pdfReport.priorities'), setup.sourceDetails.priorities.map(p => t(`equipmentView.configurator.priorities.${p}`)).join(', ') || t('common.none')],
                [t('equipmentView.savedSetups.pdfReport.customNotes'), setup.sourceDetails.customNotes || t('common.none')],
            ];
            (doc as any).autoTable({
                startY: y,
                body: sourceDetails,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 1.5, halign: 'left' },
                columnStyles: { 0: { fontStyle: 'bold', textColor: 50, cellWidth: 40 }, 1: { textColor: 20 } },
                didDrawPage: (data: any) => { y = data.cursor.y; }
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        }

        // Equipment Table
        if (setup.recommendation) {
            const body: any[] = [];
            const categoryOrder: RecommendationCategory[] = ['tent', 'light', 'ventilation', 'circulationFan', 'pots', 'soil', 'nutrients', 'extra'];
            for (const key of categoryOrder) {
                const item = setup.recommendation[key as keyof typeof setup.recommendation] as RecommendationItem | string;
                if (typeof item === 'object' && item.name) {
                    body.push([t(`equipmentView.configurator.categories.${key}`), item.name, `${item.price.toFixed(2)} ${t('common.units.currency_eur')}`, item.rationale]);
                }
            }
            
            (doc as any).autoTable({
                startY: y,
                head: [[t('common.type'), t('equipmentView.savedSetups.pdfReport.product'), t('equipmentView.savedSetups.pdfReport.price'), t('equipmentView.savedSetups.pdfReport.rationale')]],
                body: body,
                theme: 'striped',
                headStyles: { fillColor: [40, 50, 70] },
                didDrawPage: (data: any) => { y = data.cursor.y; }
            });
            y = (doc as any).lastAutoTable.finalY + 10;

            // Pro Tip
            if (setup.recommendation.proTip) {
                if (y > 250) { doc.addPage(); y = topMargin; }
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(t('strainsView.tips.form.categories.proTip'), leftMargin, y);
                y += 6;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const splitText = doc.splitTextToSize(setup.recommendation.proTip, contentWidth);
                doc.text(splitText, leftMargin, y);
                y += splitText.length * 5 + 5;
            }
        }

         // Total Cost
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${t('equipmentView.savedSetups.pdfReport.totalCost')}: ${setup.totalCost.toFixed(2)} ${t('common.units.currency_eur')}`, 210 - rightMargin, y, { align: 'right' });
    });
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`${t('common.page')} ${i} / ${pageCount}`, 210 - rightMargin, 297 - 10, { align: 'right' });
    }

    doc.save(`${fileName}.pdf`);
  }

  public exportSetupsAsTxt(setups: SavedSetup[], fileName: string, t: TFunction) {
    let content = `CannaGuide 2025 - ${t('equipmentView.savedSetups.pdfReport.title')}\n`;
    content += `${t('common.generated')}: ${new Date().toLocaleString()}\n\n`;

    setups.forEach(setup => {
        content += `==============================\n`;
        content += `${setup.name.toUpperCase()}\n`;
        content += `==============================\n`;
        content += `(${t('common.generated')}: ${new Date(setup.createdAt).toLocaleString()})\n\n`;

        if (setup.sourceDetails) {
            content += `--- ${t('equipmentView.savedSetups.pdfReport.sourceDetails')} ---\n`;
            content += `${t('equipmentView.savedSetups.pdfReport.plantCount')}: ${setup.sourceDetails.plantCount}\n`;
            content += `${t('equipmentView.savedSetups.pdfReport.experience')}: ${t(`strainsView.tips.form.experienceOptions.${setup.sourceDetails.experience}`)}\n`;
            content += `${t('equipmentView.savedSetups.pdfReport.budget')}: ${setup.sourceDetails.budget} ${t('common.units.currency_eur')}\n`;
            content += `${t('equipmentView.savedSetups.pdfReport.priorities')}: ${setup.sourceDetails.priorities.map(p => t(`equipmentView.configurator.priorities.${p}`)).join(', ') || t('common.none')}\n`;
            content += `${t('equipmentView.savedSetups.pdfReport.customNotes')}: ${setup.sourceDetails.customNotes || t('common.none')}\n\n`;
        }
        
        if (setup.recommendation) {
            content += `--- EQUIPMENT ---\n`;
            const categoryOrder: RecommendationCategory[] = ['tent', 'light', 'ventilation', 'circulationFan', 'pots', 'soil', 'nutrients', 'extra'];
            categoryOrder.forEach(key => {
                const item = setup.recommendation[key as keyof typeof setup.recommendation] as RecommendationItem | string;
                 if (typeof item === 'object' && item.name) {
                    content += `${t(`equipmentView.configurator.categories.${key}`)}: ${item.name} (${item.price.toFixed(2)} ${t('common.units.currency_eur')})\n`;
                    content += `  - Rationale: ${item.rationale}\n`;
                 }
            });
            content += `\n--- ${t('strainsView.tips.form.categories.proTip')} ---\n`;
            content += `${setup.recommendation.proTip}\n\n`;
        }

        content += `TOTAL: ${setup.totalCost.toFixed(2)} ${t('common.units.currency_eur')}\n\n\n`;
    });
    
    this.generateTxt(content, `${fileName}.txt`);
  }
}

export const exportService = new ExportService();