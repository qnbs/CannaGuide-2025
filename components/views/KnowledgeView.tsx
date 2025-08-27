import React, { useState, useMemo } from 'react';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { useKnowledgeProgress } from '../../hooks/useKnowledgeProgress';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { geminiService } from '../../services/geminiService';
import { AIResponse } from '../../types';
import { SkeletonLoader } from '../common/SkeletonLoader';

const sectionsConfig = [
    {
        id: 'phase1',
        icon: <PhosphorIcons.Cube className="w-8 h-8"/>,
        title: 'Phase 1: Vorbereitung & Setup',
        subtitle: 'Der Grundstein für deinen Erfolg',
        p1_title: 'Der richtige Ort',
        p1_text: 'Wähle einen diskreten Ort mit Zugang zu Strom und frischer Luft. Ein Kellerraum, eine Abstellkammer oder ein ungenutztes Zimmer sind ideal. Die Temperatur sollte stabil sein.',
        p2_title: 'Ausrüstung zusammenstellen',
        p2_text: 'Nutze unseren Setup-Konfigurator im Bereich "Ausrüstung", um eine Einkaufsliste zu erstellen. Die wichtigsten Komponenten sind Zelt, Licht, Abluft und Töpfe.',
        checklist: {
            'c1': 'Diskreten Ort mit Stromanschluss finden.',
            'c2': 'Growbox aufbauen.',
            'c3': 'Lampe und Abluftsystem installieren und testen.',
            'c4': 'Zeitschaltuhr für die Lampe einstellen.',
        },
        proTip: 'Investiere in ein gutes Abluftsystem mit Aktivkohlefilter. Es ist nicht nur für die Geruchskontrolle entscheidend, sondern auch für einen konstanten Luftaustausch, der Schimmel und Schädlinge vorbeugt.'
    },
    {
        id: 'phase2',
        icon: <PhosphorIcons.Plant className="w-8 h-8"/>,
        title: 'Phase 2: Keimung & Sämling',
        subtitle: 'Der Start ins Leben (Woche 1-2)',
        p1_title: 'Samen keimen lassen',
        p1_text: 'Die Papiertuch-Methode ist beliebt: Lege die Samen zwischen zwei feuchte Papiertücher auf einen Teller und decke ihn ab. Halte sie warm (22-25°C) und dunkel. Nach 2-7 Tagen sollte eine kleine Wurzel sichtbar sein.',
        p2_title: 'Der Sämling',
        p2_text: 'Sobald die Wurzel ca. 1-2 cm lang ist, pflanze den Samen vorsichtig ca. 0.5-1 cm tief in einen kleinen Topf mit Anzuchterde. Halte die Erde feucht, aber nicht nass. Die Beleuchtung sollte jetzt auf 18 Stunden an / 6 Stunden aus eingestellt sein.',
        checklist: {
            'c1': 'Samen keimen lassen.',
            'c2': 'Gekeimten Samen in kleinen Topf pflanzen.',
            'c3': 'Für hohe Luftfeuchtigkeit (60-70%) sorgen, z.B. mit einem Mini-Gewächshaus.',
        },
        proTip: 'Überwässere deine Sämlinge nicht! Dies ist der häufigste Fehler. Die kleinen Wurzeln können schnell faulen. Lass die Erde zwischen dem Gießen leicht antrocknen.'
    },
     {
        id: 'phase3',
        icon: <PhosphorIcons.Sun className="w-8 h-8"/>,
        title: 'Phase 3: Wachstumsphase (Vegetation)',
        subtitle: 'Größe und Kraft aufbauen (Woche 3-7)',
        p1_title: 'Wachstumsschub',
        p1_text: 'In dieser Phase konzentriert sich die Pflanze auf das Wachstum von Blättern und Stängeln. Sie benötigt jetzt mehr Licht und Nährstoffe. Sobald die Pflanze größer als ihr Topf ist, sollte sie in den endgültigen Topf umgetopft werden.',
        p2_title: 'Trainingstechniken',
        p2_text: 'Techniken wie LST (Low Stress Training) oder Topping können jetzt angewendet werden, um einen buschigeren Wuchs und einen höheren Ertrag zu fördern. Beginne damit, wenn die Pflanze 5-6 Blattpaare hat.',
        checklist: {
            'c1': 'Pflanze bei Bedarf in den Endtopf umtopfen.',
            'c2': 'Mit der Düngung nach Herstellerangabe beginnen (halbe Dosis am Anfang).',
            'c3': 'Regelmäßig gießen, wenn die Erde trocken ist und auf den pH-Wert achten.',
        },
        proTip: 'Low Stress Training (LST) ist anfängerfreundlich und sehr effektiv. Biege den Haupttrieb sanft zur Seite und binde ihn fest. Dadurch werden die unteren Triebe angeregt, nach oben zu wachsen, was zu einem gleichmäßigeren Blätterdach und mehr Ertrag führt.'
    },
    {
        id: 'phase4',
        icon: <PhosphorIcons.Sparkle className="w-8 h-8"/>,
        title: 'Phase 4: Blütephase',
        subtitle: 'Die Magie geschieht (Woche 8+)',
        p1_title: 'Blüte einleiten',
        p1_text: 'Um die Blüte einzuleiten, wird der Lichtzyklus auf 12 Stunden an / 12 Stunden aus umgestellt. Die Pflanze wird ihr Wachstum in den ersten Wochen noch fortsetzen ("Stretch") und dann beginnen, Blüten zu bilden.',
        p2_title: 'Nährstoffbedarf',
        p2_text: 'Der Nährstoffbedarf ändert sich. Die Pflanze benötigt jetzt mehr Phosphor (P) und Kalium (K). Verwende einen speziellen Blütedünger. Achte auf eine niedrigere Luftfeuchtigkeit (40-50%), um Schimmel zu vermeiden.',
        checklist: {
            'c1': 'Lichtzyklus auf 12/12 umstellen.',
            'c2': 'Auf Blütedünger umstellen und Cal/Mag ergänzen.',
            'c3': 'Luftfeuchtigkeit senken und für gute Luftzirkulation sorgen.',
        },
        proTip: 'In den letzten 1-2 Wochen vor der Ernte solltest du aufhören zu düngen und nur noch mit klarem Wasser spülen. Dies verbessert den Geschmack und die Qualität des Endprodukts erheblich.'
    },
    {
        id: 'phase5',
        icon: <PhosphorIcons.Scissors className="w-8 h-8"/>,
        title: 'Phase 5: Ernte, Trocknung & Curing',
        subtitle: 'Die Belohnung für deine Mühe',
        p1_title: 'Der richtige Erntezeitpunkt',
        p1_text: 'Der beste Indikator sind die Trichome (die kleinen Harzdrüsen). Mit einer Lupe betrachtet, sollten die meisten milchig-trüb und einige bernsteinfarben sein. Sind sie noch klar, ist es zu früh. Sind sie alle bernsteinfarben, wird die Wirkung sehr sedierend.',
        p2_title: 'Trocknung und Curing',
        p2_text: 'Schneide die Zweige ab und hänge sie kopfüber in einem dunklen, kühlen Raum (ca. 18-20°C, 50-60% Luftfeuchtigkeit) für 7-14 Tage auf. Danach kommen die trockenen Blüten in luftdichte Gläser zum "Curing" (Aushärten). Lüfte die Gläser täglich in der ersten Woche. Dieser Schritt ist entscheidend für Qualität, Geschmack und Wirkung.',
        checklist: {
            'c1': 'Trichome prüfen und ernten.',
            'c2': 'Pflanze kopfüber an einem dunklen, kühlen Ort aufhängen.',
            'c3': 'Blüten in Gläsern aushärten (curen) und regelmäßig lüften.',
        },
        proTip: 'Die ideale Luftfeuchtigkeit für das Curing liegt bei 62%. Verwende kleine Hygrometer in deinen Gläsern oder spezielle Feuchtigkeitspacks (z.B. Boveda), um perfekte Ergebnisse zu erzielen.'
    }
];


const ChecklistItem: React.FC<{
    text: string;
    isChecked: boolean;
    onToggle: () => void;
}> = ({ text, isChecked, onToggle }) => {
    return (
        <li className="flex items-start gap-3 !my-3">
            <input 
                type="checkbox"
                checked={isChecked}
                onChange={onToggle}
                className="h-5 w-5 rounded border-slate-400 dark:border-slate-500 text-primary-600 focus:ring-primary-500 bg-transparent mt-0.5 flex-shrink-0"
            />
            <span className={`transition-colors ${isChecked ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {text}
            </span>
        </li>
    )
};

const ProTip: React.FC<{ content: string }> = ({ content }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400">
            <h4 className="font-bold text-amber-800 dark:text-amber-200">Profi-Tipp</h4>
            {isRevealed ? (
                <p className="text-amber-700 dark:text-amber-300">{content}</p>
            ) : (
                <Button variant="secondary" size="sm" onClick={() => setIsRevealed(true)} className="mt-2">Tipp aufdecken</Button>
            )}
        </div>
    );
};


const JourneyStep: React.FC<{
    section: typeof sectionsConfig[0];
    isOpen: boolean;
    onToggle: () => void;
}> = ({ section, isOpen, onToggle }) => {
    const { progress, toggleItem } = useKnowledgeProgress();
    const isSectionChecked = (itemId: string) => progress[section.id]?.includes(itemId) || false;

    return (
        <div className="relative flex items-start group">
            <div className="absolute left-8 top-8 w-px h-full bg-slate-300 dark:bg-slate-700 journey-step-line"></div>
            <div className={`relative z-10 w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-900 journey-step-icon ${isOpen ? 'is-open border-primary-500/50' : ''}`}>
                 <div className="text-primary-500">{section.icon}</div>
            </div>
            <div className="ml-4 w-full">
                 <div className="p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                     <button type="button" className="flex items-center justify-between w-full font-medium text-left" onClick={onToggle} aria-expanded={isOpen}>
                        <div>
                            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{section.title}</span>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{section.subtitle}</p>
                        </div>
                        <PhosphorIcons.ChevronDown className={`w-6 h-6 shrink-0 transition-transform duration-300 text-slate-500 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                     <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px] pt-4' : 'max-h-0'}`}>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <h4>{section.p1_title}</h4>
                            <p>{section.p1_text}</p>
                            <h4>{section.p2_title}</h4>
                            <p>{section.p2_text}</p>

                            <h4 className="!mt-6">Checkliste</h4>
                            <ul className="checklist">
                                {Object.entries(section.checklist).map(([itemKey, itemText]) => (
                                    <ChecklistItem 
                                        key={itemKey}
                                        text={itemText}
                                        isChecked={isSectionChecked(itemKey)}
                                        onToggle={() => toggleItem(section.id, itemKey)}
                                    />
                                ))}
                            </ul>
                            <ProTip content={section.proTip} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AiMentor: React.FC = () => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAsk = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setResponse(null);
        const res = await geminiService.askAboutKnowledge(query);
        setResponse(res);
        setIsLoading(false);
        setQuery('');
    };

    return (
        <Card className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400 flex items-center gap-2">
                <PhosphorIcons.Sparkle className="w-6 h-6" />
                Frag den KI-Mentor
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
                Hast du eine spezifische Frage zum Anbau? Stelle sie hier und erhalte eine detaillierte Antwort.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                    placeholder="z.B. Was ist der beste pH-Wert in der Blütephase?"
                    className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-white"
                />
                <Button onClick={handleAsk} disabled={isLoading || !query.trim()} className="shrink-0">
                    {isLoading ? 'Frage wird analysiert...' : 'Frage stellen'}
                </Button>
            </div>
            <div className="mt-4">
                {isLoading && <SkeletonLoader count={3} />}
                {response && (
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg animate-fade-in">
                        <article className="prose dark:prose-invert max-w-none">
                            <h4 className="!text-primary-600 dark:!text-primary-300 !mt-0">{response.title}</h4>
                            <div dangerouslySetInnerHTML={{ __html: response.content }} />
                        </article>
                    </div>
                )}
            </div>
        </Card>
    );
};


export const KnowledgeView: React.FC = () => {
    const [openAccordion, setOpenAccordion] = useState<string | null>('phase1');
    const { progress } = useKnowledgeProgress();

    const { totalItems, completedItems } = useMemo(() => {
        const total = sectionsConfig.reduce((acc, section) => acc + Object.keys(section.checklist).length, 0);
        const completed = Object.values(progress).reduce((acc, items) => acc + items.length, 0);
        return { totalItems: total, completedItems: completed };
    }, [progress]);

    const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    const handleToggle = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    return (
        <div>
            <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">Grow-Anleitung</h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 mt-1">Dein Wegweiser von der Vorbereitung bis zur Ernte.</p>
            </div>

            <Card className="mb-8">
                <h3 className="font-bold text-slate-700 dark:text-slate-200">Dein Fortschritt</h3>
                <div className="flex items-center gap-4 mt-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                        <div className="bg-primary-500 h-4 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                    </div>
                    <span className="font-bold text-primary-600 dark:text-primary-300">{completionPercentage.toFixed(0)}%</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">{`${completedItems} von ${totalItems} Schritten erledigt`}</p>
            </Card>

            <AiMentor />
            
            <div className="mt-8">
                 {sectionsConfig.map(section => (
                     <JourneyStep
                        key={section.id}
                        section={section}
                        isOpen={openAccordion === section.id}
                        onToggle={() => handleToggle(section.id)}
                    />
                 ))}
            </div>
        </div>
    );
};