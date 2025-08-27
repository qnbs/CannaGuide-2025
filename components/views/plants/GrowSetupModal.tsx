import React, { useState } from 'react';
import { GrowSetup, Strain } from '../../../types';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { useNotifications } from '../../../context/NotificationContext';


interface GrowSetupModalProps {
  strain: Strain;
  onClose: () => void;
  onConfirm: (setup: GrowSetup) => void;
}

export const GrowSetupModal: React.FC<GrowSetupModalProps> = ({ strain, onClose, onConfirm }) => {
  const { addNotification } = useNotifications();
  const [setup, setSetup] = useState<GrowSetup>({
    lightType: 'LED',
    potSize: 10,
    medium: 'Soil',
  });

  const handleConfirm = () => {
    onConfirm(setup);
    addNotification(`Anbau von ${strain.name} erfolgreich gestartet!`, 'success');
  };

  type SetupOption = 'lightType' | 'potSize' | 'medium';
  const options: { id: SetupOption, label: string, choices: (string|number)[], display?: (s: string|number) => string }[] = [
      { id: 'lightType', label: 'Lichtquelle', choices: ['LED', 'HPS', 'CFL'] },
      { id: 'potSize', label: 'Topfgröße', choices: [5, 10, 15], display: s => `${s}L` },
      { id: 'medium', label: 'Anbaumedium', choices: ['Soil', 'Coco', 'Hydro'], display: s => s === 'Soil' ? 'Erde' : String(s) },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-primary-500 dark:text-primary-400 mb-2">{`Setup für ${strain.name}`}</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Konfiguriere dein Anbau-Setup für diese Sorte.</p>
        
        <div className="space-y-6">
            {options.map(opt => (
                <div key={opt.id}>
                    <label className="block text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{opt.label}</label>
                    <div className="flex gap-2">
                    {opt.choices.map(choice => (
                        <button
                            key={choice}
                            onClick={() => setSetup(s => ({ ...s, [opt.id]: choice }))}
                            className={`flex-1 py-2 px-2 text-sm rounded-md transition-colors ${
                                setup[opt.id] === choice
                                ? 'bg-primary-600 text-white font-bold shadow-lg'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                        >
                            {opt.display ? opt.display(choice) : String(choice)}
                        </button>
                    ))}
                    </div>
              </div>
            ))}
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleConfirm}>Bestätigen & Starten</Button>
        </div>
      </Card>
    </div>
  );
};