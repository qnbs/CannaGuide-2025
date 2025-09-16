
import React, { useState } from 'react';
import { SavedSetup, RecommendationCategory, RecommendationItem } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { useNotifications } from '../../../context/NotificationContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface SavedSetupsViewProps {
    savedSetups: SavedSetup[];
    updateSetup: (setup: SavedSetup) => void;
    deleteSetup: (id: string) => void;
}

const SetupDetailModal: React.FC<{
    setup: SavedSetup;
    onClose: () => void;
    onUpdate: (updatedSetup: SavedSetup) => void;
}> = ({ setup, onClose, onUpdate }) => {
    const { t } = useTranslations();
    const [isEditing, setIsEditing] = useState(false);
    const [editedSetup, setEditedSetup] = useState<SavedSetup>(JSON.parse(JSON.stringify(setup)));

    const categoryLabels: Record<RecommendationCategory, string> = {
        tent: t('equipmentView.configurator.categories.tent'),
        light: t('equipmentView.configurator.categories.light'),
        ventilation: t('equipmentView.configurator.categories.ventilation'),
        pots: t('equipmentView.configurator.categories.pots'),
        soil: t('equipmentView.configurator.categories.soil'),
        nutrients: t('equipmentView.configurator.categories.nutrients'),
        extra: t('equipmentView.configurator.categories.extra')
    };
    
    const handleItemChange = (category: RecommendationCategory, field: keyof RecommendationItem | 'name' | 'price', value: string | number) => {
        setEditedSetup(prev => {
            const newRec = { ...prev.recommendation };
            (newRec[category] as any)[field] = value;

            if (field === 'price') {
                 const newTotal = Object.values(newRec).reduce((sum, item) => sum + (Number(item.price) || 0), 0);
                 return { ...prev, recommendation: newRec, totalCost: newTotal };
            }
            
            return { ...prev, recommendation: newRec };
        });
    };

    const handleSave = () => {
        onUpdate(editedSetup);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card className="w-full max-w-2xl modal-content-animate" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-primary-400">{isEditing ? t('equipmentView.savedSetups.modal.editMode') : t('equipmentView.savedSetups.modal.title')}</h2>
                        <input type="text" value={editedSetup.name} onChange={e => setEditedSetup(p => ({...p, name: e.target.value}))} disabled={!isEditing} className={`text-slate-300 bg-transparent text-lg ${isEditing ? 'border-b border-slate-500' : ''}`} />
                    </div>
                    <Button size="sm" onClick={() => setIsEditing(!isEditing)}>{isEditing ? t('common.cancel') : t('common.edit')}</Button>
                </div>

                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-2 font-semibold">{t('equipmentView.savedSetups.modal.item')}</th>
                                <th className="text-left py-2 font-semibold">{t('common.details')}</th>
                                <th className="text-right py-2 font-semibold">{t('equipmentView.savedSetups.modal.price')} (€)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(Object.keys(editedSetup.recommendation) as RecommendationCategory[]).map(key => {
                                const item = editedSetup.recommendation[key];
                                return (
                                    <tr key={key} className="border-b border-slate-800">
                                        <td className="py-2 font-bold text-slate-200">{categoryLabels[key]}</td>
                                        <td className="py-2">
                                            <input type="text" value={item.name} onChange={e => handleItemChange(key, 'name', e.target.value)} disabled={!isEditing} className={`w-full bg-transparent ${isEditing ? 'bg-slate-800 p-1 rounded' : ''}`} />
                                            {item.watts && <span className="text-xs text-slate-400">({item.watts}W)</span>}
                                        </td>
                                        <td className="py-2 text-right">
                                             <input type="number" value={item.price} onChange={e => handleItemChange(key, 'price', Number(e.target.value))} disabled={!isEditing} className={`w-20 bg-transparent text-right ${isEditing ? 'bg-slate-800 p-1 rounded' : ''}`} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                    <span className="font-bold">{t('equipmentView.configurator.total')}: {editedSetup.totalCost.toFixed(2)} €</span>
                    <div>
                        {isEditing && <Button onClick={handleSave} className="mr-2">{t('equipmentView.savedSetups.modal.saveChanges')}</Button>}
                        <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};


export const SavedSetupsView: React.FC<SavedSetupsViewProps> = ({ savedSetups, updateSetup, deleteSetup }) => {
    const { t } = useTranslations();
    const { addNotification } = useNotifications();
    const [selectedSetup, setSelectedSetup] = useState<SavedSetup | null>(null);
    
    const handleDelete = (setup: SavedSetup) => {
        if (window.confirm(t('equipmentView.savedSetups.deleteConfirm', { name: setup.name }))) {
            deleteSetup(setup.id);
            addNotification(t('equipmentView.savedSetups.deleteSuccess', { name: setup.name }), 'success');
        }
    };

    const handleUpdate = (updatedSetup: SavedSetup) => {
        try {
            updateSetup(updatedSetup);
            addNotification(t('equipmentView.savedSetups.updateSuccess', { name: updatedSetup.name }), 'success');
            setSelectedSetup(null); // Close modal
        } catch (e) {
            addNotification(t('equipmentView.savedSetups.updateError'), 'error');
            console.error(e);
        }
    };
    
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
    
    const exportAsPDF = (setup: SavedSetup) => {
        if (!window.confirm(t('equipmentView.savedSetups.exportConfirm', { name: setup.name, format: 'PDF' }))) return;
        
        const doc = new jsPDF() as any;
        doc.setFontSize(18);
        doc.text(normalizeGermanChars(`Setup: ${setup.name}`), 15, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(normalizeGermanChars(`Erstellt am: ${new Date(setup.createdAt).toLocaleString()}`), 15, 26);
        doc.text(normalizeGermanChars(`Quelle: ${setup.sourceDetails.area}cm, ${setup.sourceDetails.growStyle}, ${setup.sourceDetails.budget} Budget`), 15, 32);

        const tableBody: any[] = (Object.keys(setup.recommendation) as RecommendationCategory[]).map(key => {
            const item = setup.recommendation[key];
            const name = item.watts ? `${item.name} (${item.watts}W)` : item.name;
            return [
                normalizeGermanChars(t(`equipmentView.configurator.categories.${key}`)), 
                normalizeGermanChars(name), 
                normalizeGermanChars(item.rationale), 
                `${item.price.toFixed(2)} €`
            ];
        });
        
        tableBody.push(['', '', { content: normalizeGermanChars('Gesamt'), styles: { fontStyle: 'bold' } }, { content: `${setup.totalCost.toFixed(2)} €`, styles: { fontStyle: 'bold' } }]);

        doc.autoTable({
            startY: 40,
            head: [[normalizeGermanChars(t('equipmentView.savedSetups.modal.item')), 'Produkt', 'Begründung', 'Preis']],
            body: tableBody,
        });

        doc.save(`${setup.name.replace(/ /g,"_")}.pdf`);
        addNotification(t('equipmentView.savedSetups.exportSuccess', { name: setup.name }), 'success');
    };
    
    const exportAsJSON = (setup: SavedSetup) => {
        if (!window.confirm(t('equipmentView.savedSetups.exportConfirm', { name: setup.name, format: 'JSON' }))) return;
        const jsonString = JSON.stringify(setup, null, 2);
        downloadFile('\uFEFF' + jsonString, `${setup.name.replace(/ /g,"_")}.json`, 'application/json;charset=utf-8;');
        addNotification(t('equipmentView.savedSetups.exportSuccess', { name: setup.name }), 'success');
    }

    const exportAsCSV = (setup: SavedSetup) => {
        if (!window.confirm(t('equipmentView.savedSetups.exportConfirm', { name: setup.name, format: 'CSV' }))) return;
        const escapeCsv = (val: any) => `"${String(val).replace(/"/g, '""')}"`;

        const headers = ['Setup Name', 'Source Area', 'Source Style', 'Source Budget', 'Total Cost', 'Category', 'Item', 'Watts', 'Price', 'Rationale'];
        const rows = (Object.keys(setup.recommendation) as RecommendationCategory[]).map(key => {
            const item = setup.recommendation[key];
            return [
                escapeCsv(setup.name),
                escapeCsv(setup.sourceDetails.area),
                escapeCsv(setup.sourceDetails.growStyle),
                escapeCsv(setup.sourceDetails.budget),
                escapeCsv(setup.totalCost),
                escapeCsv(t(`equipmentView.configurator.categories.${key}`)),
                escapeCsv(item.name),
                escapeCsv(item.watts || ''),
                escapeCsv(item.price),
                escapeCsv(item.rationale)
            ].join(',');
        });
        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
        downloadFile(csvContent, `${setup.name.replace(/ /g,"_")}.csv`, 'text/csv;charset=utf-8;');
        addNotification(t('equipmentView.savedSetups.exportSuccess', { name: setup.name }), 'success');
    };
    
     const exportAsTXT = (setup: SavedSetup) => {
        if (!window.confirm(t('equipmentView.savedSetups.exportConfirm', { name: setup.name, format: 'TXT' }))) return;
        let content = `SETUP REPORT: ${setup.name}\n`;
        content += `========================================\n`;
        content += `Erstellt am: ${new Date(setup.createdAt).toLocaleString()}\n`;
        content += `Quelle: ${setup.sourceDetails.area}cm, ${setup.sourceDetails.growStyle}, ${setup.sourceDetails.budget} Budget\n\n`;

        (Object.keys(setup.recommendation) as RecommendationCategory[]).forEach(key => {
            const item = setup.recommendation[key];
            content += `--- ${t(`equipmentView.configurator.categories.${key}`)} ---\n`;
            content += `Produkt: ${item.name}${item.watts ? ` (${item.watts}W)` : ''}\n`;
            content += `Preis: ${item.price.toFixed(2)} €\n`;
            content += `Begründung: ${item.rationale}\n\n`;
        });

        content += `--- GESAMT ---\nGesamtkosten: ${setup.totalCost.toFixed(2)} €\n`;

        downloadFile('\uFEFF' + content, `${setup.name.replace(/ /g,"_")}.txt`, 'text/plain;charset=utf-8;');
        addNotification(t('equipmentView.savedSetups.exportSuccess', { name: setup.name }), 'success');
    };
    
    const sortedSetups = [...savedSetups].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="mt-6">
             {selectedSetup && <SetupDetailModal setup={selectedSetup} onClose={() => setSelectedSetup(null)} onUpdate={handleUpdate} />}
            {sortedSetups.length === 0 ? (
                <Card className="text-center py-10 text-slate-500">
                    <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="font-semibold">{t('equipmentView.savedSetups.noSetups.title')}</h3>
                    <p className="text-sm">{t('equipmentView.savedSetups.noSetups.subtitle')}</p>
                </Card>
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedSetups.map(setup => (
                        <Card key={setup.id} className="flex flex-col">
                            <h3 className="font-bold text-lg text-primary-400 truncate">{setup.name}</h3>
                            <p className="text-xs text-slate-400 mb-2">{new Date(setup.createdAt).toLocaleString()}</p>
                            <p className="text-sm text-slate-300 flex-grow">{setup.sourceDetails.area}cm | {setup.sourceDetails.growStyle} | {setup.sourceDetails.budget}</p>
                            <p className="text-2xl font-bold text-right my-3">{setup.totalCost.toFixed(2)} €</p>
                            <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-slate-700">
                                <Button size="sm" onClick={() => setSelectedSetup(setup)} className="flex-1">{t('equipmentView.savedSetups.inspect')}</Button>
                                <div className="relative group">
                                    <Button size="sm" variant="secondary" className="flex-1">{t('common.export')}...</Button>
                                    <div className="absolute bottom-full mb-2 w-32 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-lg p-1 shadow-lg opacity-0 pointer-events-none group-focus-within:opacity-100 group-hover:opacity-100 group-focus-within:pointer-events-auto group-hover:pointer-events-auto transition-opacity z-10">
                                        <button onClick={() => exportAsPDF(setup)} className="w-full text-left text-sm p-1.5 hover:bg-slate-700 rounded">PDF</button>
                                        <button onClick={() => exportAsTXT(setup)} className="w-full text-left text-sm p-1.5 hover:bg-slate-700 rounded">TXT</button>
                                        <button onClick={() => exportAsCSV(setup)} className="w-full text-left text-sm p-1.5 hover:bg-slate-700 rounded">CSV</button>
                                        <button onClick={() => exportAsJSON(setup)} className="w-full text-left text-sm p-1.5 hover:bg-slate-700 rounded">JSON</button>
                                    </div>
                                </div>
                                <Button size="sm" variant="danger" onClick={() => handleDelete(setup)} aria-label={t('common.deleteSetup')}>
                                     <PhosphorIcons.TrashSimple className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
