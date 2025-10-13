// services/exportLogic.ts
import {
    Strain,
    SavedSetup,
    RecommendationCategory,
    ExportFormat,
    ArchivedMentorResponse,
    SavedStrainTip,
    ArchivedAdvisorResponse,
    Recommendation,
    RecommendationItem,
    StructuredGrowTips,
} from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

const sanitizeForCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
    return `"${str}"`;
};

const escapeXml = (unsafe: string | null | undefined): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

const objectToXml = (obj: Record<string, unknown>, indent = '  '): string => {
    return Object.entries(obj)
        .map(([key, value]) => {
            const xmlKey = escapeXml(key.replace(/[^a-zA-Z0-9_]/g, ''));
            if (value === null || value === undefined) {
                return `${indent}<${xmlKey}/>`;
            }
            if (Array.isArray(value)) {
                const itemName = xmlKey.endsWith('s') ? xmlKey.slice(0, -1) : 'item';
                return `${indent}<${xmlKey}>\n${value
                    .map((item) => `${indent}  <${itemName}>${escapeXml(String(item))}</${itemName}>`)
                    .join('\n')}\n${indent}</${xmlKey}>`;
            }
            if (typeof value === 'object' && value !== null) {
                return `${indent}<${xmlKey}>\n${objectToXml(
                    value as Record<string, unknown>,
                    indent + '  '
                )}\n${indent}</${xmlKey}>`;
            }
            return `${indent}<${xmlKey}>${escapeXml(String(value))}</${xmlKey}>`;
        })
        .join('\n');
};

const drawPdfLayout = (
    doc: jsPDF,
    title: string,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    const pageCount = (doc as any).internal.pages.length;
    const pageWidth = doc.internal.pageSize.width;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235); // primary-600
        doc.text('CannaGuide 2025', 15, 17);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85); // slate-700
        doc.text(title, pageWidth - 15, 17, { align: 'right' });

        doc.setDrawColor(30, 41, 59); // slate-800
        doc.line(15, 22, pageWidth - 15, 22);

        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105); // slate-600
        const footerStr = `${t('common.page')} ${i} / ${pageCount}`;
        doc.text(footerStr, pageWidth / 2, doc.internal.pageSize.height - 10, {
            align: 'center',
        });
        doc.text(
            `${t('common.generated')}: ${new Date().toLocaleString()}`,
            15,
            doc.internal.pageSize.height - 10
        );
    }
};

const cleanHtml = (html: string | null | undefined) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
};

const exportDataLogic = <T extends { [key: string]: any }>(
    data: T[],
    format: ExportFormat,
    filename: string,
    config: {
        title: string;
        toSerializable: (item: T) => Record<string, unknown>;
        xmlRoot: string;
        xmlItem: string;
        txtFormatter: (item: T) => string;
        pdfHeaders: string[];
        pdfRows: (item: T) => (string | number | boolean | null | undefined)[];
        t: (key: string, options?: Record<string, unknown>) => string;
    }
) => {
    const { t } = config;
    const serializableData = data.map((item) => config.toSerializable(item));

    switch (format) {
        case 'json':
            downloadFile(
                JSON.stringify(serializableData, null, 2),
                `${filename}.json`,
                'application/json;charset=utf-8;'
            );
            break;
        case 'csv':
            if (serializableData.length === 0) return;
            const headers = Object.keys(serializableData[0]);
            const rows = serializableData.map((obj) =>
                headers.map((header) => sanitizeForCSV(obj[header])).join(',')
            );
            downloadFile(
                '\uFEFF' + [headers.join(','), ...rows].join('\n'),
                `${filename}.csv`,
                'text/csv;charset=utf-8;'
            );
            break;
        case 'xml':
            const items = serializableData
                .map(
                    (item) =>
                        `  <${config.xmlItem}>\n${objectToXml(item, '    ')}\n  </${config.xmlItem}>`
                )
                .join('\n');
            downloadFile(
                `<?xml version="1.0" encoding="UTF-8"?>\n<${config.xmlRoot}>\n${items}\n</${config.xmlRoot}>`,
                `${filename}.xml`,
                'application/xml;charset=utf-8;'
            );
            break;
        case 'txt':
            let txtString = `CannaGuide 2025 - ${config.title} - ${new Date().toLocaleString()}\n\n`;
            data.forEach((item) => {
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
                body: data.map((item) => config.pdfRows(item)),
                startY: 30,
                didDrawPage: () => drawPdfLayout(doc, config.title, t),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [37, 99, 235] },
            });
            doc.save(`${filename}.pdf`);
            break;
    }
};

export const exportStrainsLogic = (
    strains: Strain[],
    format: ExportFormat,
    filename: string,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    const strainToSerializableObject = (strain: Strain) => ({
        [t('strainsView.csvHeaders.name')]: strain.name,
        [t('strainsView.csvHeaders.type')]: strain.type,
        [t('strainsView.csvHeaders.thc')]: strain.thc,
        [t('strainsView.csvHeaders.cbd')]: strain.cbd,
        [t('strainsView.csvHeaders.floweringTime')]: strain.floweringTime,
        [t('strainsView.csvHeaders.difficulty')]: t(
            `strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`
        ),
        [t('strainsView.csvHeaders.yield')]: t(
            `strainsView.addStrainModal.yields.${strain.agronomic.yield.toLowerCase()}`
        ),
        [t('strainsView.csvHeaders.height')]: t(
            `strainsView.addStrainModal.heights.${strain.agronomic.height.toLowerCase()}`
        ),
        [t('strainsView.csvHeaders.genetics')]: strain.genetics || '',
        [t('strainsView.csvHeaders.aromas')]: (strain.aromas || []).join('; '),
        [t('strainsView.csvHeaders.terpenes')]: (strain.dominantTerpenes || []).join('; '),
        [t('strainsView.csvHeaders.yieldIndoor')]: strain.agronomic.yieldDetails?.indoor || '',
        [t('strainsView.csvHeaders.yieldOutdoor')]: strain.agronomic.yieldDetails?.outdoor || '',
        [t('strainsView.csvHeaders.heightIndoor')]: strain.agronomic.heightDetails?.indoor || '',
        [t('strainsView.csvHeaders.heightOutdoor')]: strain.agronomic.heightDetails?.outdoor || '',
        [t('strainsView.csvHeaders.description')]: strain.description || '',
    });

    if (format === 'pdf') {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const contentWidth = pageWidth - margin * 2;
        let y = 30; // Start y position after header

        const checkPageBreak = (neededHeight: number) => {
            if (y + neededHeight > doc.internal.pageSize.getHeight() - 20) { // 20 for footer
                doc.addPage();
                y = 30;
            }
        };

        const addTitle = (text: string) => {
            checkPageBreak(12);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(37, 99, 235); // primary-600 (darker blue for better contrast)
            doc.text(text, margin, y);
            y += 8;
        };
        
        const addSectionTitle = (text: string) => {
            checkPageBreak(10);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42); // slate-900 (almost black)
            doc.text(text, margin, y);
            y += 6;
        };

        const addKeyValue = (key: string, value: string | undefined | null) => {
            if (!value) return;
            const valueLines = doc.splitTextToSize(value, contentWidth - 40); // indent for key
            checkPageBreak(valueLines.length * 5 + 2);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 65, 85); // slate-700
            doc.text(`${key}:`, margin + 2, y);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59); // slate-800
            doc.text(valueLines, margin + 40, y);
            y += valueLines.length * 5;
        };

        strains.forEach((strain, index) => {
            if (index > 0) {
                doc.addPage();
                y = 30; // Reset y-coordinate for the new page
            }

            addTitle(strain.name);

            addKeyValue(t('common.type'), strain.typeDetails || strain.type);
            addKeyValue(t('common.genetics'), strain.genetics);
            y += 4;

            addSectionTitle(t('strainsView.strainDetail.cannabinoidProfile'));
            addKeyValue(t('strainsView.table.thc'), strain.thcRange || `${strain.thc}%`);
            addKeyValue(t('strainsView.table.cbd'), strain.cbdRange || `${strain.cbd}%`);
            y += 4;
            
            addSectionTitle(t('strainsView.strainModal.agronomicData'));
            addKeyValue(t('strainsView.strainModal.difficulty'), t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`));
            addKeyValue(t('strainsView.table.flowering'), `${strain.floweringTimeRange || strain.floweringTime} ${t('common.units.weeks')}`);
            addKeyValue(t('strainsView.strainModal.yieldIndoor'), strain.agronomic.yieldDetails?.indoor);
            addKeyValue(t('strainsView.strainModal.yieldOutdoor'), strain.agronomic.yieldDetails?.outdoor);
            addKeyValue(t('strainsView.strainModal.heightIndoor'), strain.agronomic.heightDetails?.indoor);
            addKeyValue(t('strainsView.strainModal.heightOutdoor'), strain.agronomic.heightDetails?.outdoor);
            y += 4;

            addSectionTitle(t('strainsView.strainDetail.aromaProfile'));
            addKeyValue(t('strainsView.strainModal.aromas'), (strain.aromas || []).map(aroma => t(`common.aromas.${aroma}`, { defaultValue: aroma })).join(', '));
            addKeyValue(t('strainsView.strainModal.dominantTerpenes'), (strain.dominantTerpenes || []).map(terp => t(`common.terpenes.${terp}`, { defaultValue: terp })).join(', '));
            y += 4;
            
            if (strain.description) {
                addSectionTitle(t('common.description'));
                const descLines = doc.splitTextToSize(strain.description, contentWidth);
                checkPageBreak(descLines.length * 5);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(15, 23, 42); // slate-900 (almost black)
                doc.text(descLines, margin, y);
                y += descLines.length * 5;
            }
        });

        drawPdfLayout(doc, t('strainsView.exportModal.title'), t);
        doc.save(`${filename}.pdf`);

    } else {
        exportDataLogic(strains, format, filename, {
            title: t('strainsView.exportModal.title'),
            toSerializable: strainToSerializableObject,
            xmlRoot: 'strains',
            xmlItem: 'strain',
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
            pdfHeaders: [], // Not used for non-pdf formats here
            pdfRows: () => [], // Not used for non-pdf formats here
            t,
        });
    }
};

export const exportSetupLogic = (
    setup: SavedSetup,
    format: ExportFormat,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    const filename = setup.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const recommendationKeys = Object.keys(setup.recommendation) as (keyof Recommendation)[];

    const setupToSerializableObject = (s: SavedSetup) => ({
        name: s.name,
        createdAt: new Date(s.createdAt).toISOString(),
        totalCost: s.totalCost,
        sourceDetails: s.sourceDetails,
        components: recommendationKeys
            .filter((key): key is RecommendationCategory => key !== 'proTip')
            .map((key) => ({
                category: t(`equipmentView.configurator.categories.${key}`),
                product: s.recommendation[key].name,
                price: s.recommendation[key].price,
                rationale: s.recommendation[key].rationale,
                watts: s.recommendation[key].watts,
            })),
        proTip: s.recommendation.proTip,
    });
    const serializableSetup = setupToSerializableObject(setup);

    switch (format) {
        case 'json':
            downloadFile(
                JSON.stringify(serializableSetup, null, 2),
                `${filename}.json`,
                'application/json;charset=utf-8;'
            );
            break;
        case 'xml':
            const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<savedSetup>\n${objectToXml(
                serializableSetup,
                '  '
            )}\n</savedSetup>`;
            downloadFile(xmlContent, `${filename}.xml`, 'application/xml;charset=utf-8;');
            break;
        case 'csv':
            const headers = [
                t('equipmentView.savedSetups.pdfReport.category'),
                t('equipmentView.savedSetups.pdfReport.product'),
                t('equipmentView.savedSetups.pdfReport.price'),
                t('equipmentView.savedSetups.pdfReport.rationale'),
                t('common.units.watt'),
            ];
            const rows = serializableSetup.components.map((c) =>
                [
                    sanitizeForCSV(c.category),
                    sanitizeForCSV(c.product),
                    sanitizeForCSV(c.price),
                    sanitizeForCSV(c.rationale),
                    sanitizeForCSV(c.watts || ''),
                ].join(',')
            );
            downloadFile(
                '\uFEFF' + [headers.join(','), ...rows].join('\n'),
                `${filename}_components.csv`,
                'text/csv;charset=utf-8;'
            );
            break;
        case 'txt':
            let txtString = `CannaGuide 2025 - ${t(
                'equipmentView.savedSetups.pdfReport.setup'
            )}: ${setup.name}\n`;
            txtString += `========================================\n\n`;
            txtString += `${t(
                'equipmentView.savedSetups.pdfReport.createdAt'
            )}: ${new Date(setup.createdAt).toLocaleString()}\n`;
            txtString += `${t('equipmentView.configurator.total')}: ${setup.totalCost.toFixed(
                2
            )} ${t('common.units.currency_eur')}\n\n`;
            txtString += `--- ${t('equipmentView.configurator.costBreakdown')} ---\n\n`;
            recommendationKeys
                .filter((key): key is RecommendationCategory => key !== 'proTip')
                .forEach((key) => {
                    const item = setup.recommendation[key];
                    txtString += `${t(`equipmentView.configurator.categories.${key}`)}:\n`;
                    txtString += `  - ${t('equipmentView.savedSetups.pdfReport.product')}: ${
                        item.name
                    } ${item.watts ? `(${item.watts}W)` : ''}\n`;
                    txtString += `  - ${t('equipmentView.savedSetups.pdfReport.price')}: ${item.price.toFixed(
                        2
                    )} ${t('common.units.currency_eur')}\n`;
                    txtString += `  - ${t('equipmentView.savedSetups.pdfReport.rationale')}: ${
                        item.rationale
                    }\n\n`;
                });
            if (setup.recommendation.proTip) {
                txtString += `--- Profi-Tipp ---\n${setup.recommendation.proTip}\n`;
            }
            downloadFile(txtString, `${filename}.txt`, 'text/plain;charset=utf-8;');
            break;
        case 'pdf':
            const doc = new jsPDF();
            const reportTitle = t('equipmentView.savedSetups.pdfReport.setup');

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(setup.name || '', 15, 35);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            doc.text(
                `${t('equipmentView.savedSetups.pdfReport.createdAt')}: ${new Date(
                    setup.createdAt
                ).toLocaleString()}`,
                15,
                42
            );
            doc.text(
                `${t('equipmentView.configurator.total')}: ${setup.totalCost.toFixed(2)} ${t(
                    'common.units.currency_eur'
                )}`,
                doc.internal.pageSize.width - 15,
                42,
                { align: 'right' }
            );

            (doc as any).autoTable({
                head: [
                    [
                        t('equipmentView.savedSetups.pdfReport.item'),
                        t('equipmentView.savedSetups.pdfReport.product'),
                        t('equipmentView.savedSetups.pdfReport.rationale'),
                        t('equipmentView.savedSetups.pdfReport.price'),
                    ],
                ],
                body: recommendationKeys
                    .filter((key): key is RecommendationCategory => key !== 'proTip')
                    .map((key) => {
                        const item = setup.recommendation[key];
                        return [
                            t(`equipmentView.configurator.categories.${key}`),
                            `${item.name || ''} ${item.watts ? `(${item.watts}W)` : ''}`,
                            item.rationale || '',
                            item.price?.toFixed(2) || '0.00',
                        ];
                    }),
                startY: 50,
                headStyles: { fillColor: [37, 99, 235] },
                didDrawPage: (data: any) => {
                    drawPdfLayout(doc, reportTitle, t);
                    if (data.pageNumber === (doc as any).internal.pages.length - 1) {
                        if (setup.recommendation.proTip) {
                            let finalY = (data.doc as any).lastAutoTable.finalY;
                            if (finalY + 30 > doc.internal.pageSize.height) {
                                doc.addPage();
                                finalY = 25;
                            }
                            doc.setFontSize(12);
                            doc.setFont('helvetica', 'bold');
                            doc.setTextColor(15, 23, 42);
                            doc.text(t('strainsView.tips.form.categories.proTip'), 15, finalY + 15);
                            doc.setFontSize(10);
                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(30, 41, 59);
                            const proTipLines = doc.splitTextToSize(
                                setup.recommendation.proTip || '',
                                doc.internal.pageSize.width - 30
                            );
                            doc.text(proTipLines, 15, finalY + 22);
                        }
                    }
                },
            });
            doc.save(`${filename}.pdf`);
            break;
    }
};

export const exportSetupsLogic = (
    setups: SavedSetup[],
    format: ExportFormat,
    filename: string,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    exportDataLogic(setups, format, filename, {
        title: t('equipmentView.savedSetups.exportTitle'),
        toSerializable: (item) => ({
            name: item.name,
            createdAt: new Date(item.createdAt).toLocaleDateString(),
            totalCost: item.totalCost,
            area: item.sourceDetails.area,
            budget: item.sourceDetails.budget,
            growStyle: item.sourceDetails.growStyle,
        }),
        xmlRoot: 'savedSetups',
        xmlItem: 'setup',
        txtFormatter: (s) => {
            let str = `[ ${s.name} ]\n`;
            str += `Created: ${new Date(s.createdAt).toLocaleString()}\n`;
            str += `Total Cost: ${s.totalCost.toFixed(2)} ${t('common.units.currency_eur')}\n`;
            str += `Source Details: Area ${s.sourceDetails.area}, Budget ${s.sourceDetails.budget}, Style ${s.sourceDetails.growStyle}\n\n`;
            str += `--- Components ---\n`;
            (Object.keys(s.recommendation) as (keyof Recommendation)[]).forEach((key) => {
                if (key === 'proTip') return;
                const item = s.recommendation[key as RecommendationCategory];
                str += `- ${t(`equipmentView.configurator.categories.${key}`)}: ${
                    item.name
                } (${item.price.toFixed(2)} ${t('common.units.currency_eur')})\n`;
            });
            return str;
        },
        pdfHeaders: [
            t('common.name'),
            t('equipmentView.savedSetups.pdfReport.createdAt'),
            `${t('equipmentView.configurator.total')} (${t('common.units.currency_eur')})`,
            'Area',
            'Style',
            'Budget',
        ],
        pdfRows: (s) => [
            s.name,
            new Date(s.createdAt).toLocaleDateString(),
            s.totalCost.toFixed(2),
            s.sourceDetails.area,
            s.sourceDetails.growStyle,
            s.sourceDetails.budget,
        ],
        t,
    });
};

export const exportStrainTipsLogic = (
    tips: SavedStrainTip[],
    format: ExportFormat,
    filename: string,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
// FIX: Updated `exportStrainTipsLogic` to handle the `SavedStrainTip` type which has structured properties (`nutrientTip`, `trainingTip`, etc.) instead of a single `content` property. This resolves errors where the non-existent `content` property was being accessed for CSV, TXT, and PDF exports.
    const toSerializable = (item: SavedStrainTip) => ({
        Strain: item.strainName,
        Created: new Date(item.createdAt).toLocaleString(),
        Title: item.title,
        'Nutrient Tip': item.nutrientTip,
        'Training Tip': item.trainingTip,
        'Environmental Tip': item.environmentalTip,
        'Pro Tip': item.proTip,
    });

    const txtFormatter = (item: SavedStrainTip) => (
        `[${item.strainName} - ${item.title}]\n` +
        `Date: ${new Date(item.createdAt).toLocaleString()}\n` +
        `- Nutrient: ${item.nutrientTip}\n` +
        `- Training: ${item.trainingTip}\n` +
        `- Environment: ${item.environmentalTip}\n` +
        `- Pro-Tip: ${item.proTip}\n`
    );

    const pdfHeaders = [
        t('strainsView.table.strain'),
        'Title',
        'Date',
        t('strainsView.tips.form.categories.nutrientTip'),
        t('strainsView.tips.form.categories.trainingTip'),
        t('strainsView.tips.form.categories.environmentalTip'),
        t('strainsView.tips.form.categories.proTip'),
    ];

    const pdfRows = (item: SavedStrainTip) => [
        item.strainName,
        item.title,
        new Date(item.createdAt).toLocaleDateString(),
        item.nutrientTip,
        item.trainingTip,
        item.environmentalTip,
        item.proTip,
    ];

    exportDataLogic(tips, format, filename, {
        title: t('strainsView.tips.title'),
        toSerializable,
        xmlRoot: 'strain_tips',
        xmlItem: 'tip',
        txtFormatter,
        pdfHeaders,
        pdfRows,
        t,
    });
};

export const exportMentorArchiveLogic = (
    responses: ArchivedMentorResponse[],
    format: ExportFormat,
    filename: string,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    exportDataLogic(responses, format, filename, {
        title: t('knowledgeView.archive.title'),
        toSerializable: (item) => ({
            Query: item.query,
            Created: new Date(item.createdAt).toLocaleString(),
            Title: item.title,
            Content: cleanHtml(item.content),
        }),
        xmlRoot: 'mentor_responses',
        xmlItem: 'response',
        txtFormatter: (item) =>
            `Query: ${item.query}\nDate: ${new Date(
                item.createdAt
            ).toLocaleString()}\nTitle: ${item.title}\n---\n${cleanHtml(item.content)}\n`,
        pdfHeaders: ['Query', 'Title', 'Date', 'Content'],
        pdfRows: (item) => [
            item.query,
            item.title,
            new Date(item.createdAt).toLocaleDateString(),
            cleanHtml(item.content),
        ],
        t,
    });
};

export const exportAdvisorArchiveLogic = (
    responses: (ArchivedAdvisorResponse & { plantName: string })[],
    format: ExportFormat,
    filename: string,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    exportDataLogic(responses, format, filename, {
        title: t('plantsView.aiAdvisor.archiveTitle'),
        toSerializable: (item) => ({
            Plant: item.plantName,
            Stage: t(`plantStages.${item.plantStage}`),
            Created: new Date(item.createdAt).toLocaleString(),
            Title: item.title,
            Content: cleanHtml(item.content),
        }),
        xmlRoot: 'advisor_responses',
        xmlItem: 'response',
        txtFormatter: (item) =>
            `Plant: ${item.plantName}\nStage: ${t(
                `plantStages.${item.plantStage}`
            )}\nDate: ${new Date(item.createdAt).toLocaleString()}\nTitle: ${
                item.title
            }\n---\n${cleanHtml(item.content)}\n`,
        pdfHeaders: ['Plant', 'Stage', 'Title', 'Date', 'Content'],
        pdfRows: (item) => [
            item.plantName,
            t(`plantStages.${item.plantStage}`),
            item.title,
            new Date(item.createdAt).toLocaleDateString(),
            cleanHtml(item.content),
        ],
        t,
    });
};