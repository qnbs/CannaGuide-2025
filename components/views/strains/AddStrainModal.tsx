import React, { useState } from 'react';
import { Strain } from '../../../types';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { useNotifications } from '../../../context/NotificationContext';
import { PhosphorIcons } from '../../icons/PhosphorIcons';

interface AddStrainModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddStrain: (strain: Strain) => void;
}

const defaultStrainData: any = {
    type: 'Hybrid',
    thc: 20,
    cbd: 1,
    floweringTime: 9,
    agronomic: {
        difficulty: 'Medium',
        yield: 'Medium',
        height: 'Medium',
    },
};

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 border-b border-primary-200 dark:border-primary-800 pb-1 mb-3">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {children}
        </div>
    </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <input {...props} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </div>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div className="sm:col-span-2">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <textarea {...props} rows={3} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }> = ({ label, options, ...props }) => (
     <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <select {...props} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
)

export const AddStrainModal: React.FC<AddStrainModalProps> = ({ isOpen, onClose, onAddStrain }) => {
    const { addNotification } = useNotifications();
    const [strainData, setStrainData] = useState<any>(defaultStrainData);

    const handleChange = (field: string, value: any) => {
        const keys = field.split('.');
        if (keys.length > 1) {
            setStrainData((prev: any) => ({
                ...prev,
                [keys[0]]: { ...prev[keys[0]], [keys[1]]: value }
            }));
        } else {
            setStrainData((prev: any) => ({ ...prev, [field]: value }));
        }
    };
    
    const parseStringToArray = (str: string = '') => str.split(',').map(s => s.trim()).filter(Boolean);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!strainData.name || !strainData.thc || !strainData.floweringTime) {
            addNotification('Bitte fülle alle Pflichtfelder aus (Name, THC, Blütezeit).', 'error');
            return;
        }

        const newStrain: Strain = {
            id: `${strainData.name.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
            name: strainData.name,
            type: strainData.type,
            typeDetails: strainData.typeDetails,
            genetics: strainData.genetics,
            thc: parseFloat(strainData.thc),
            cbd: parseFloat(strainData.cbd || 1),
            thcRange: strainData.thcRange,
            cbdRange: strainData.cbdRange,
            floweringTime: parseFloat(strainData.floweringTime),
            floweringTimeRange: strainData.floweringTimeRange,
            description: strainData.description,
            aromas: parseStringToArray(strainData.aromasString),
            dominantTerpenes: parseStringToArray(strainData.terpenesString),
            agronomic: {
                difficulty: strainData.agronomic.difficulty,
                yield: strainData.agronomic.yield,
                height: strainData.agronomic.height,
                yieldDetails: {
                    indoor: strainData.agronomic.yieldIndoor,
                    outdoor: strainData.agronomic.yieldOutdoor,
                },
                heightDetails: {
                    indoor: strainData.agronomic.heightIndoor,
                    outdoor: strainData.agronomic.heightOutdoor,
                }
            }
        };
        onAddStrain(newStrain);
        setStrainData(defaultStrainData); // Reset form for next time
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-primary-500 dark:text-primary-400 mb-4">Neue Sorte hinzufügen</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <PhosphorIcons.X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto pr-2 flex-grow" style={{maxHeight: '70vh'}}>
                        <div className="space-y-6">
                           <FormSection title="Allgemeine Informationen">
                                <Input label="Sortenname" value={strainData.name || ''} onChange={(e) => handleChange('name', e.target.value)} required />
                                <Select label="Typ" value={strainData.type} onChange={(e) => handleChange('type', e.target.value)} options={[{value: 'Sativa', label: 'Sativa'}, {value: 'Indica', label: 'Indica'}, {value: 'Hybrid', label: 'Hybrid'}]}/>
                                <Input label="Typ-Details" value={strainData.typeDetails || ''} onChange={(e) => handleChange('typeDetails', e.target.value)} placeholder="z.B. Sativa 60% / Indica 40%" />
                                <Input label="Genetik" value={strainData.genetics || ''} onChange={(e) => handleChange('genetics', e.target.value)} />
                           </FormSection>

                           <FormSection title="Cannabinoide">
                                <Input label="THC (%)" type="number" step="0.1" value={strainData.thc || ''} onChange={(e) => handleChange('thc', e.target.value)} required />
                                <Input label="CBD (%)" type="number" step="0.1" value={strainData.cbd || ''} onChange={(e) => handleChange('cbd', e.target.value)} />
                                <Input label="THC-Bereich" value={strainData.thcRange || ''} onChange={(e) => handleChange('thcRange', e.target.value)} placeholder="z.B. 20-25%" />
                                <Input label="CBD-Bereich" value={strainData.cbdRange || ''} onChange={(e) => handleChange('cbdRange', e.target.value)} placeholder="z.B. <1%" />
                           </FormSection>

                           <FormSection title="Anbaudaten">
                                <Input label="Blütezeit (Wochen)" type="number" step="0.5" value={strainData.floweringTime || ''} onChange={(e) => handleChange('floweringTime', e.target.value)} required />
                                <Input label="Blütezeit-Bereich" value={strainData.floweringTimeRange || ''} onChange={(e) => handleChange('floweringTimeRange', e.target.value)} placeholder="z.B. 8-9"/>
                                <Select label="Schwierigkeit" value={strainData.agronomic.difficulty} onChange={(e) => handleChange('agronomic.difficulty', e.target.value)} options={[{value: 'Easy', label: 'Einfach'}, {value: 'Medium', label: 'Mittel'}, {value: 'Hard', label: 'Schwer'}]}/>
                                <Select label="Ertrag" value={strainData.agronomic.yield} onChange={(e) => handleChange('agronomic.yield', e.target.value)} options={[{value: 'Low', label: 'Niedrig'}, {value: 'Medium', label: 'Mittel'}, {value: 'High', label: 'Hoch'}]}/>
                                <Input label="Ertrag (Indoor)" value={strainData.agronomic.yieldIndoor || ''} onChange={(e) => handleChange('agronomic.yieldIndoor', e.target.value)} placeholder="z.B. ~500 g/m²"/>
                                <Input label="Ertrag (Outdoor)" value={strainData.agronomic.yieldOutdoor || ''} onChange={(e) => handleChange('agronomic.yieldOutdoor', e.target.value)} placeholder="z.B. ~600 g/Pflanze"/>
                                <Input label="Höhe (Indoor)" value={strainData.agronomic.heightIndoor || ''} onChange={(e) => handleChange('agronomic.heightIndoor', e.target.value)} placeholder="z.B. Mittel (100-150cm)"/>
                                <Input label="Höhe (Outdoor)" value={strainData.agronomic.heightOutdoor || ''} onChange={(e) => handleChange('agronomic.heightOutdoor', e.target.value)} placeholder="z.B. Hoch (bis 2m)"/>
                           </FormSection>

                           <FormSection title="Profil">
                                <Textarea label="Beschreibung" value={strainData.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
                                <Input label="Aromen" value={strainData.aromasString || ''} onChange={(e) => handleChange('aromasString', e.target.value)} placeholder="Werte mit Komma trennen" />
                                <Input label="Dominante Terpene" value={strainData.terpenesString || ''} onChange={(e) => handleChange('terpenesString', e.target.value)} placeholder="Werte mit Komma trennen" />
                           </FormSection>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button type="button" variant="secondary" onClick={onClose}>Abbrechen</Button>
                        <Button type="submit">Sorte speichern</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
