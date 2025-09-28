// FIX: Update import paths to use alias
import { Strain, SavedSetup, RecommendationCategory, ExportFormat, ArchivedMentorResponse, SavedStrainTip, ArchivedAdvisorResponse, RecommendationItem } from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getT } from '@/i18n';

// --- Private Helper Functions ---

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

const sanitizeForCSV = (value: any): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
    return `"${str}"`;
};

const escapeXml = (unsafe: string): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

const objectToXml = (obj: any, indent = '  '): string => {
    return Object.entries(obj).map(([key, value]) => {
        const xmlKey = escapeXml(key.replace(/[^a-zA-Z0-9_]/g, ''));
        if (value === null || value === undefined) {
            return `${indent}<${xmlKey}/>`;
        }
        if (Array.isArray(value)) {
            const itemName = xmlKey.endsWith('s') ? xmlKey.slice(0, -1) : 'item';
            return `${indent}<${xmlKey}>\n${value.map(item => `${indent}  <${itemName}>${escapeXml(String(item))}</${itemName}>`).join('\n')}\n${indent}</${xmlKey}>`;
        }
        if (typeof value === 'object') {
             return `${indent}<${xmlKey}>\n${objectToXml(value, indent + '  ')}\n${indent}</${xmlKey}>`;
        }
        return `${indent}<${xmlKey}>${escapeXml(String(value))}</${xmlKey}>`;
    }).join('\n');
};

const drawPdfLayout = (doc: jsPDF, title: string) => {
    const t = getT();
    const pageCount = (doc as any).internal.pages.length;
    const pageWidth = doc.internal.pageSize.width;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246); // primary-500
        doc.text('CannaGuide 2025', 15, 17);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(title, pageWidth - 15, 17, { align: 'right' });

        doc.setDrawColor(51, 65, 85); // slate-700
        doc.line(15, 22, pageWidth - 15, 22);
        
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        const footerStr = `${t('common.page')} ${i} / ${pageCount}`;
        doc.text(footerStr, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text(`${t('common.generated')}: ${new Date().toLocaleString()}`, 15, doc.internal.pageSize.height - 10);
    }
};

const cleanHtml = (html: string) => {
    if(!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
};

const exportData = <T extends { [key: string]: any }>(
  data: T[],
  format: ExportFormat,
  filename: string,
  config: {
    title: string;
    toSerializable: (item: T) => any;
    xmlRoot: string;
    xmlItem: string;
    txtFormatter: (item: T) => string;
    pdfHeaders: string[];
    pdfRows: (item: T) => string[];
  }
) => {
    const t = getT();
    const serializableData = data.map(item => config.toSerializable(item));

    switch (format) {
        case 'json':
            downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, 'application/json;charset=utf-8;');
            break;
        case 'csv':
            if (serializableData.length === 0) return;
            const headers = Object.keys(serializableData[0]);
            const rows = serializableData.map(obj => headers.map(header => sanitizeForCSV(obj[header])).join(','));
            downloadFile("\uFEFF" + [headers.join(','), ...rows].join('\n'), `${filename}.csv`, 'text/csv;charset=utf-8;');
            break;
        case 'xml':
            const items = serializableData.map(item => `  <${config.xmlItem}>\n${objectToXml(item, '    ')}\n  </${config.xmlItem}>`).join('\n');
            downloadFile(`<?xml version="1.0" encoding="UTF-8"?>\n<${config.xmlRoot}>\n${items}\n</${config.xmlRoot}>`, `${filename}.xml`, 'application/xml;charset=utf-8;');
            break;
        case 'txt':
            let txtString = `CannaGuide 2025 - ${config.title} - ${new Date().toLocaleString()}\n\n`;
            data.forEach(item => {
                txtString += `----------------------------------------\n`;
                txtString += config.txtFormatter(item);
                txtString += `\n`;
            });
            downloadFile(txtString, `${filename}.txt`, 'text/plain;charset=utf-8;');
            break;
        case 'pdf':
            const doc = new jsPDF();
            (doc as any).autoTable({
                head: [config.pdfHeaders],
                body: data.map(item => config.pdfRows(item)),
                startY: 30,
                didDrawPage: () => drawPdfLayout(doc, config.title),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [37, 99, 235] }, // primary-600
            });
            doc.save(`${filename}.pdf`);
            break;
    }
};

// --- Strain Export ---

const exportStrains = (strains: Strain[], format: ExportFormat, filename: string) => {
    const t = getT();
    const strainToSerializableObject = (strain: Strain) => ({
        [t('strainsView.csvHeaders.name')]: strain.name, [t('strainsView.csvHeaders.type')]: strain.type, [t('strainsView.csvHeaders.thc')]: strain.thc,
        [t('strainsView.csvHeaders.cbd')]: strain.cbd, [t('strainsView.csvHeaders.floweringTime')]: strain.floweringTime, [t('strainsView.csvHeaders.difficulty')]: t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`),
        [t('strainsView.csvHeaders.yield')]: t(`strainsView.addStrainModal.yields.${strain.agronomic.yield.toLowerCase()}`), [t('strainsView.csvHeaders.height')]: t(`strainsView.addStrainModal.heights.${strain.agronomic.height.toLowerCase()}`),
        [t('strainsView.csvHeaders.genetics')]: strain.genetics || '', [t('strainsView.csvHeaders.aromas')]: (strain.aromas || []).join('; '), [t('strainsView.csvHeaders.terpenes')]: (strain.dominantTerpenes || []).join('; '),
        [t('strainsView.csvHeaders.yieldIndoor')]: strain.agronomic.yieldDetails?.indoor || '', [t('strainsView.csvHeaders.yieldOutdoor')]: strain.agronomic.yieldDetails?.outdoor || '',
        [t('strainsView.csvHeaders.heightIndoor')]: strain.agronomic.heightDetails?.indoor || '', [t('strainsView.csvHeaders.heightOutdoor')]: strain.agronomic.heightDetails?.outdoor || '',
        [t('strainsView.csvHeaders.description')]: strain.description || '',
    });

    exportData(strains, format, filename, {
        title: t('strainsView.exportModal.title'),
        toSerializable: strainToSerializableObject,
        xmlRoot: 'strains', xmlItem: 'strain',
        txtFormatter: (s) => {
            const data = strainToSerializableObject(s);
            let str = `[ ${data[t('strainsView.csvHeaders.name')]} ]\n`;
            for (const [key, value] of Object.entries(data)) {
                if (value && key !== t('strainsView.csvHeaders.name')) {
                    str += `${key}: ${value}\n`;
                }
            }
            return str;
        },
        pdfHeaders: [t('strainsView.table.strain'), t('strainsView.table.type'), 'THC', 'CBD', t('strainsView.table.flowering'), t('strainsView.table.level'), t('strainsView.csvHeaders.yieldIndoor'), t('strainsView.csvHeaders.heightIndoor')],
        pdfRows: (s) => [s.name, s.type, `${s.thc}%`, `${s.cbd}%`, `${s.floweringTimeRange || s.floweringTime} ${t('common.units.weeks')}`, t(`strainsView.difficulty.${s.agronomic.difficulty.toLowerCase()}`), s.agronomic.yieldDetails?.indoor || 'N/A', s.agronomic.heightDetails?.indoor || 'N/A'],
    });
};

// --- Setup Export ---

const exportSetup = (setup: SavedSetup, format: ExportFormat) => {
    const t = getT();
    const filename = setup.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const setupToSerializableObject = (s: SavedSetup) => ({
        name: s.name, createdAt: new Date(s.createdAt).toISOString(), totalCost: s.totalCost, sourceDetails: s.sourceDetails,
        components: (Object.keys(s.recommendation) as RecommendationCategory[]).map(key => ({
            category: t(`equipmentView.configurator.categories.${key}`), product: s.recommendation[key].name, price: s.recommendation[key].price,
            rationale: s.recommendation[key].rationale, watts: s.recommendation[key].watts
        }))
    });
    const serializableSetup = setupToSerializableObject(setup);

    switch (format) {
        case 'json':
            downloadFile(JSON.stringify(serializableSetup, null, 2), `${filename}.json`, 'application/json;charset=utf-8;');
            break;
        case 'xml':
            const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<savedSetup>\n${objectToXml(serializableSetup, '  ')}\n</savedSetup>`;
            downloadFile(xmlContent, `${filename}.xml`, 'application/xml;charset=utf-8;');
            break;
        case 'csv':
            const headers = [t('equipmentView.savedSetups.pdfReport.category'), t('equipmentView.savedSetups.pdfReport.product'), t('equipmentView.savedSetups.pdfReport.price'), t('equipmentView.savedSetups.pdfReport.rationale'), t('common.units.watt')];
            const rows = serializableSetup.components.map(c => [sanitizeForCSV(c.category), sanitizeForCSV(c.product), sanitizeForCSV(c.price), sanitizeForCSV(c.rationale), sanitizeForCSV(c.watts || '')].join(','));
            downloadFile("\uFEFF" + [headers.join(','), ...rows].join('\n'), `${filename}_components.csv`, 'text/csv;charset=utf-8;');
            break;
        case 'txt':
            let txtString = `CannaGuide 2025 - ${t('equipmentView.savedSetups.pdfReport.setup')}: ${setup.name}\n`;
            txtString += `========================================\n\n`;
            txtString += `${t('equipmentView.savedSetups.pdfReport.createdAt')}: ${new Date(setup.createdAt).toLocaleString()}\n`;
            txtString += `${t('equipmentView.configurator.total')}: ${setup.totalCost.toFixed(2)} ${t('common.units.currency_eur')}\n\n`;
            txtString += `--- ${t('equipmentView.configurator.costBreakdown')} ---\n\n`;
            (Object.keys(setup.recommendation) as RecommendationCategory[]).forEach(key => {
                const item = setup.recommendation[key];
                txtString += `${t(`equipmentView.configurator.categories.${key}`)}:\n`;
                txtString += `  - ${t('equipmentView.savedSetups.pdfReport.product')}: ${item.name} ${item.watts ? `(${item.watts}W)` : ''}\n`;
                txtString += `  - ${t('equipmentView.savedSetups.pdfReport.price')}: ${item.price.toFixed(2)} ${t('common.units.currency_eur')}\n`;
                txtString += `  - ${t('equipmentView.savedSetups.pdfReport.rationale')}: ${item.rationale}\n\n`;
            });
            downloadFile(txtString, `${filename}.txt`, 'text/plain;charset=utf-8;');
            break;
        case 'pdf':
            const doc = new jsPDF();
            const reportTitle = t('equipmentView.savedSetups.pdfReport.setup');
            drawPdfLayout(doc, reportTitle);

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(setup.name, 15, 35);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`${t('equipmentView.savedSetups.pdfReport.createdAt')}: ${new Date(setup.createdAt).toLocaleString()}`, 15, 42);
            doc.text(`${t('equipmentView.configurator.total')}: ${setup.totalCost.toFixed(2)} ${t('common.units.currency_eur')}`, doc.internal.pageSize.width - 15, 42, { align: 'right' });
            
            (doc as any).autoTable({
                head: [[t('equipmentView.savedSetups.pdfReport.item'), t('equipmentView.savedSetups.pdfReport.product'), t('equipmentView.savedSetups.pdfReport.rationale'), t('equipmentView.savedSetups.pdfReport.price')]],
                body: (Object.keys(setup.recommendation) as RecommendationCategory[]).map(key => {
                    const item = setup.recommendation[key];
                    return [ t(`equipmentView.configurator.categories.${key}`), `${item.name} ${item.watts ? `(${item.watts}W)` : ''}`, item.rationale, item.price.toFixed(2) ];
                }),
                startY: 50,
                headStyles: { fillColor: [37, 99, 235] }, // primary-600
                didDrawPage: () => drawPdfLayout(doc, reportTitle),
            });
            doc.save(`${filename}.pdf`);
            break;
    }
};

const exportSetups = (setups: SavedSetup[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportData(setups, format, filename, {
        title: t('equipmentView.savedSetups.exportTitle'),
        toSerializable: (item) => ({
            name: item.name,
            createdAt: new Date(item.createdAt).toLocaleDateString(),
            totalCost: item.totalCost,
            area: item.sourceDetails.area,
            budget: item.sourceDetails.budget,
            growStyle: item.sourceDetails.growStyle,
        }),
        xmlRoot: 'savedSetups', xmlItem: 'setup',
        txtFormatter: (s) => {
            let str = `[ ${s.name} ]\n`;
            str += `Created: ${new Date(s.createdAt).toLocaleString()}\n`;
            str += `Total Cost: ${s.totalCost.toFixed(2)} ${t('common.units.currency_eur')}\n`;
            str += `Source Details: Area ${s.sourceDetails.area}, Budget ${s.sourceDetails.budget}, Style ${s.sourceDetails.growStyle}\n\n`;
            str += `--- Components ---\n`;
            (Object.keys(s.recommendation) as RecommendationCategory[]).forEach(key => {
                const item = s.recommendation[key];
                str += `- ${t(`equipmentView.configurator.categories.${key}`)}: ${item.name} (${item.price.toFixed(2)} ${t('common.units.currency_eur')})\n`;
            });
            return str;
        },
        pdfHeaders: [t('common.name'), t('equipmentView.savedSetups.pdfReport.createdAt'), `${t('equipmentView.configurator.total')} (${t('common.units.currency_eur')})`, 'Area', 'Style', 'Budget'],
        pdfRows: (s) => [s.name, new Date(s.createdAt).toLocaleDateString(), s.totalCost.toFixed(2), s.sourceDetails.area, s.sourceDetails.growStyle, s.sourceDetails.budget],
    });
};

// --- AI Response Exports ---

const exportStrainTips = (tips: SavedStrainTip[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportData(tips, format, filename, {
        title: t('strainsView.tips.title'),
        toSerializable: (item) => ({ Strain: item.strainName, Created: new Date(item.createdAt).toLocaleString(), Title: item.title, Content: cleanHtml(item.content) }),
        xmlRoot: 'strain_tips', xmlItem: 'tip',
        txtFormatter: (item) => `Strain: ${item.strainName}\nDate: ${new Date(item.createdAt).toLocaleString()}\nTitle: ${item.title}\n---\n${cleanHtml(item.content)}\n`,
        pdfHeaders: [t('strainsView.table.strain'), 'Title', 'Date', 'Content'],
        pdfRows: (item) => [item.strainName, item.title, new Date(item.createdAt).toLocaleDateString(), cleanHtml(item.content)],
    });
};

const exportMentorArchive = (responses: ArchivedMentorResponse[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportData(responses, format, filename, {
        title: t('knowledgeView.archive.title'),
        toSerializable: (item) => ({ Query: item.query, Created: new Date(item.createdAt).toLocaleString(), Title: item.title, Content: cleanHtml(item.content) }),
        xmlRoot: 'mentor_responses', xmlItem: 'response',
        txtFormatter: (item) => `Query: ${item.query}\nDate: ${new Date(item.createdAt).toLocaleString()}\nTitle: ${item.title}\n---\n${cleanHtml(item.content)}\n`,
        pdfHeaders: ['Query', 'Title', 'Date', 'Content'],
        pdfRows: (item) => [item.query, item.title, new Date(item.createdAt).toLocaleDateString(), cleanHtml(item.content)],
    });
};

const exportAdvisorArchive = (responses: (ArchivedAdvisorResponse & {plantName: string})[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportData(responses, format, filename, {
        title: t('plantsView.aiAdvisor.archiveTitle'),
        toSerializable: (item) => ({ Plant: item.plantName, Stage: t(`plantStages.${item.plantStage}`), Created: new Date(item.createdAt).toLocaleString(), Title: item.title, Content: cleanHtml(item.content) }),
        xmlRoot: 'advisor_responses', xmlItem: 'response',
        txtFormatter: (item) => `Plant: ${item.plantName}\nStage: ${t(`plantStages.${item.plantStage}`)}\nDate: ${new Date(item.createdAt).toLocaleString()}\nTitle: ${item.title}\n---\n${cleanHtml(item.content)}\n`,
        pdfHeaders: ['Plant', 'Stage', 'Title', 'Date', 'Content'],
        pdfRows: (item) => [item.plantName, t(`plantStages.${item.plantStage}`), item.title, new Date(item.createdAt).toLocaleDateString(), cleanHtml(item.content)],
    });
};


export const exportService = {
    exportStrains,
    exportSetup,
    exportSetups,
    exportStrainTips,
    exportMentorArchive,
    exportAdvisorArchive
};
