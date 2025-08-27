import React, { useState, useMemo } from 'react';
import { Card } from '../../common/Card';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { Button } from '../../common/Button';

const tips = [
    "Überwässere deine Pflanzen nicht! Es ist der häufigste Fehler bei Anfängern. Fühle die obersten Zentimeter der Erde, bevor du erneut gießt.",
    "Der richtige pH-Wert (normalerweise 6.0-7.0 in Erde) ist entscheidend für die Nährstoffaufnahme. Ein günstiges pH-Messgerät ist eine lohnende Investition.",
    "Gute Luftzirkulation ist der Schlüssel zur Vermeidung von Schimmel und Schädlingen. Ein kleiner Clip-Ventilator in der Growbox kann Wunder wirken.",
    "Lerne Low Stress Training (LST). Das sanfte Herunterbiegen von Ästen kann deinen Ertrag erheblich steigern, indem mehr Licht an die unteren Blüten gelangt.",
    "Geduld beim Trocknen und Curen macht den Unterschied zwischen gutem und großartigem Cannabis. Überspringe diesen Schritt nicht!"
];
const NUMBER_OF_TIPS = tips.length;

export const TipCard: React.FC = () => {
    const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * NUMBER_OF_TIPS));

    const showNewTip = () => {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * NUMBER_OF_TIPS);
        } while (newIndex === tipIndex);
        setTipIndex(newIndex);
    };

    const currentTip = tips[tipIndex];

    return (
        <Card className="mb-6">
            <div className="flex items-start gap-4">
                <div className="text-amber-500 mt-1">
                    <PhosphorIcons.Lightbulb className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tipp des Tages</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">{currentTip}</p>
                     <Button variant="secondary" size="sm" onClick={showNewTip} className="mt-3">
                        Nächster Tipp
                    </Button>
                </div>
            </div>
        </Card>
    );
};