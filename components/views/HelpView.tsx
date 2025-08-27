import React, { useState } from 'react';
import { Card } from '../common/Card';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { View } from '../../types';

const AccordionItem: React.FC<{
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ title, children, isOpen, onToggle }) => (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
        <h2>
            <button
                type="button"
                className="flex items-center justify-between w-full p-4 font-medium text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                onClick={onToggle}
                aria-expanded={isOpen}
            >
                <span className="font-semibold">{title}</span>
                <PhosphorIcons.ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
        </h2>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px]' : 'max-h-0'}`}>
            <div className="px-4 pb-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

const SectionCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <Card>
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 text-primary-500">{icon}</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
        </div>
        <div className="pl-11">{children}</div>
    </Card>
)

export const HelpView: React.FC = () => {
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    
    const handleToggle = (id: string, group: string) => {
        setOpenAccordion(prev => prev === `${group}-${id}` ? null : `${group}-${id}`);
    };

    const faqItems = [
        { id: 'q1', q: 'Wie starte ich meinen ersten Anbau?', a: `Gehe zum Bereich <strong>Sorten</strong>, wähle eine anfängerfreundliche Sorte (markiert mit "Einfach"), und klicke auf "Anbau starten". Fülle die Setup-Details aus und deine Pflanze erscheint im Bereich <strong>Pflanzen</strong>, wo die Simulation beginnt.` },
        { id: 'q2', q: 'Meine Pflanze hat Probleme. Was soll ich tun?', a: `Gehe zur Detailansicht deiner Pflanze im Bereich <strong>Pflanzen</strong>. Überprüfe die Vitalwerte und Warnungen. Nutze den <strong>KI-Berater</strong>, um eine Analyse und Handlungsempfehlungen basierend auf den aktuellen Daten deiner Pflanze zu erhalten. Vergleiche die Symptome auch mit den Beschreibungen im Abschnitt "Pflanzenpflege-ABC" hier im Hilfe-Center.` },
        { id: 'q3', q: 'Kann ich meine Daten sichern oder übertragen?', a: `Ja! Gehe zum <strong>Setup</strong>-Bereich unter "Datenverwaltung". Dort kannst du alle deine Daten (Pflanzen, Einstellungen, eigene Sorten, Favoriten) in eine einzige Backup-Datei exportieren. Diese Datei kannst du später auf demselben oder einem anderen Gerät wieder importieren.` },
        { id: 'q4', q: 'In welchen Sprachen ist die App verfügbar?', a: `Die App ist vollständig auf <strong>Deutsch</strong> und <strong>Englisch</strong> verfügbar. Du kannst die Sprache jederzeit im <strong>Setup</strong>-Bereich unter "Anzeige" -> "Sprache" ändern. Deine Auswahl wird automatisch gespeichert.` },
        { id: 'q5', q: 'Ist die App barrierefrei?', a: `Ja, die Barrierefreiheit wurde stark verbessert. Die App unterstützt die Navigation per <strong>Tastatur</strong> und ist für die Nutzung mit <strong>Screenreadern</strong> optimiert. Alle interaktiven Elemente haben entsprechende Labels für eine klare Bedienung.` },
        { id: 'q6', q: 'Wie genau ist die Simulation?', a: `Die App simuliert das Pflanzenwachstum basierend auf allgemeinen Modellen und den spezifischen Daten der Sorten. Faktoren wie Genetik, Alter und Stress beeinflussen die Entwicklung. Die Simulation ist ein pädagogisches Werkzeug und kann von einem echten Anbau abweichen. Regelmäßige Interaktionen (Gießen, Düngen) halten deine simulierte Pflanze gesund.` },
        { id: 'q7', q: 'Kann ich meine hinzugefügten Sorten bearbeiten oder löschen?', a: `Derzeit kannst du deine eigenen Sorten nur über die "Datenverwaltung" im <strong>Setup</strong>-Bereich komplett zurücksetzen. Eine Funktion zum Bearbeiten oder Löschen einzelner Sorten ist für ein zukünftiges Update geplant.`},
    ];

    const cannabinoidItems = [
        { id: 'c1', term: 'Was sind Cannabinoide?', def: 'Cannabinoide sind die primären chemischen Verbindungen in Cannabis, die mit dem Endocannabinoid-System (ECS) des menschlichen Körpers interagieren und die vielfältigen Wirkungen der Pflanze hervorrufen. Sie imitieren die körpereigenen Endocannabinoide und können so verschiedene physiologische Prozesse wie Stimmung, Schmerzempfinden, Appetit und Gedächtnis beeinflussen. Man unterscheidet zwischen Phytocannabinoiden (aus der Pflanze) und Endocannabinoiden (vom Körper produziert).' },
        { id: 'c2', term: 'THC (Δ⁹-Tetrahydrocannabinol)', def: '<strong>Eigenschaft:</strong> Das bekannteste und primär psychoaktive Cannabinoid. THC ist für das "High"-Gefühl verantwortlich.<br><strong>Potenzielle Wirkung:</strong> Euphorisch, schmerzlindernd, appetitanregend, antiemetisch (gegen Übelkeit). Kann bei hohen Dosen Angst oder Paranoia auslösen.<br><strong>Siedepunkt:</strong> ~157°C' },
        { id: 'c3', term: 'CBD (Cannabidiol)', def: '<strong>Eigenschaft:</strong> Das zweithäufigste Cannabinoid, nicht-psychoaktiv. Es erzeugt kein "High" und kann sogar die psychoaktiven Effekte von THC abschwächen.<br><strong>Potenzielle Wirkung:</strong> Angstlösend, entzündungshemmend, antikonvulsiv (krampflösend), neuroprotektiv. Sehr beliebt für therapeutische Anwendungen.<br><strong>Siedepunkt:</strong> ~160-180°C' },
        { id: 'c4', term: 'CBG (Cannabigerol)', def: '<strong>Eigenschaft:</strong> Oft als "Mutter aller Cannabinoide" bezeichnet, da es die Vorstufe ist, aus der andere Cannabinoide (THC, CBD, CBC) in der Pflanze synthetisiert werden. Nicht-psychoaktiv.<br><strong>Potenzielle Wirkung:</strong> Antibakteriell, entzündungshemmend, schmerzlindernd, kann den Augeninnendruck senken. Vielversprechend in der Forschung.<br><strong>Siedepunkt:</strong> ~52°C (Decarboxylierung)' },
        { id: 'c5', term: 'CBN (Cannabinol)', def: '<strong>Eigenschaft:</strong> Entsteht hauptsächlich, wenn THC durch Oxidation (Alterung, Lichteinwirkung) abgebaut wird. Nur sehr mild psychoaktiv.<br><strong>Potenzielle Wirkung:</strong> Bekannt für seine stark sedierenden und schlaffördernden Eigenschaften. Oft in gealtertem Cannabis zu finden.<br><strong>Siedepunkt:</strong> ~185°C' },
        { id: 'c6', term: 'CBC (Cannabichromen)', def: '<strong>Eigenschaft:</strong> Ein weiteres nicht-psychoaktives Cannabinoid, das aus CBG entsteht. Bindet nicht gut an CB1-Rezeptoren im Gehirn, aber an andere Rezeptoren im Körper.<br><strong>Potenzielle Wirkung:</strong> Stark entzündungshemmend, potenziell antidepressiv, fördert die Gehirnfunktion (Neurogenese).<br><strong>Siedepunkt:</strong> ~220°C' },
        { id: 'c7', term: 'THCV (Tetrahydrocannabivarin)', def: '<strong>Eigenschaft:</strong> Ein Analogon von THC mit einer etwas anderen chemischen Struktur. Die psychoaktive Wirkung ist oft klarer, energetischer und kürzer als bei THC.<br><strong>Potenzielle Wirkung:</strong> Appetitzügelnd (im Gegensatz zu THC), kann den Blutzuckerspiegel regulieren. In geringen Dosen nicht psychoaktiv, in hohen Dosen schon.<br><strong>Siedepunkt:</strong> ~220°C' },
        { id: 'c8', term: 'Säureformen (THCA, CBDA, etc.)', def: 'In der rohen Cannabispflanze liegen die meisten Cannabinoide in ihrer sauren Form vor (z.B. THCA, CBDA). Diese sind nicht psychoaktiv. Erst durch Erhitzung (z.B. beim Rauchen, Verdampfen oder Kochen) wird ein Carboxygruppe abgespalten – ein Prozess namens <strong>Decarboxylierung</strong> –, der sie in ihre aktive Form (THC, CBD) umwandelt.' },
    ];
    
    const flavonoidItems = [
        { id: 'f1', term: 'Was sind Flavonoide?', def: 'Flavonoide sind eine vielfältige Gruppe von Pflanzenstoffen, die für die leuchtenden Farben vieler Früchte, Gemüse und Blumen verantwortlich sind (z.B. das Blau von Heidelbeeren oder das Rot von Erdbeeren). In Cannabis tragen sie nicht nur zur Färbung (z.B. violette Töne) bei, sondern auch zum Aroma und Geschmack und wirken synergistisch mit Cannabinoiden und Terpenen im Rahmen des Entourage-Effekts. Sie besitzen starke antioxidative und entzündungshemmende Eigenschaften.' },
        { id: 'f2', term: 'Cannflavine (A, B, C)', def: '<strong>Eigenschaft:</strong> Eine Gruppe von Flavonoiden, die exklusiv in der Cannabispflanze vorkommt.<br><strong>Potenzielle Wirkung:</strong> Besonders bekannt für ihre extrem starken entzündungshemmenden Eigenschaften. Studien haben gezeigt, dass Cannflavin A und B bis zu 30-mal wirksamer als Aspirin sein können.' },
        { id: 'f3', term: 'Quercetin', def: '<strong>Eigenschaft:</strong> Eines der am häufigsten vorkommenden Flavonoide in der Natur, findet sich auch in Grünkohl, Äpfeln und Zwiebeln.<br><strong>Potenzielle Wirkung:</strong> Starkes Antioxidans mit antiviralen und potenziell krebshemmenden Eigenschaften.' },
        { id: 'f4', term: 'Kaempferol', def: '<strong>Eigenschaft:</strong> Weit verbreitet in Obst und Gemüse wie Brokkoli und Trauben.<br><strong>Potenzielle Wirkung:</strong> Wirkt als starkes Antioxidans und wird auf seine Fähigkeit untersucht, das Risiko chronischer Krankheiten zu reduzieren.' },
        { id: 'f5', term: 'Apigenin', def: '<strong>Eigenschaft:</strong> Findet sich in großen Mengen in Kamille, Petersilie und Sellerie.<br><strong>Potenzielle Wirkung:</strong> Bekannt für seine angstlösenden, beruhigenden und sedierenden Eigenschaften, ähnlich wie die Wirkung von Kamillentee.' },
    ];

    const terpeneItems = [
      { id: 't1', term: 'Was sind Terpene?', def: 'Terpene sind aromatische Öle, die in vielen Pflanzen vorkommen und ihnen ihren charakteristischen Duft und Geschmack verleihen (z.B. der Duft von Kiefern oder Lavendel). In Cannabis modulieren sie die Wirkung von Cannabinoiden wie THC und CBD – ein Phänomen, das als <strong>"Entourage-Effekt"</strong> bekannt ist. Jedes Terpen hat ein einzigartiges Aromaprofil und potenzielle therapeutische Eigenschaften.' },
      { id: 't2', term: 'Myrcen', def: '<strong>Aroma:</strong> Erdig, moschusartig, kräuterig, mit Noten von Nelken und tropischen Früchten wie Mango.<br><strong>Potenzielle Wirkung:</strong> Wirkt oft entspannend und sedierend. Es wird angenommen, dass es die Wirkung von THC verstärkt und die Blut-Hirn-Schranke durchlässiger macht, was den Eintritt der Effekte beschleunigt.<br><strong>Siedepunkt:</strong> ~167°C' },
      { id: 't3', term: 'Limonen', def: '<strong>Aroma:</strong> Starkes, frisches Zitrusaroma, das an Zitronen, Orangen und Limetten erinnert.<br><strong>Potenzielle Wirkung:</strong> Stimmungsaufhellend, stresslösend und angstlösend. Kann ein Gefühl von Energie und Wohlbefinden vermitteln.<br><strong>Siedepunkt:</strong> ~176°C' },
      { id: 't4', term: 'Caryophyllen', def: '<strong>Aroma:</strong> Pfeffrig, würzig, holzig, mit Noten von Nelken und Zimt.<br><strong>Potenzielle Wirkung:</strong> Einzigartig, da es an die CB2-Rezeptoren im Endocannabinoid-System bindet (ähnlich wie ein Cannabinoid). Wirkt stark entzündungshemmend und schmerzlindernd.<br><strong>Siedepunkt:</strong> ~130°C' },
      { id: 't5', term: 'Pinen', def: '<strong>Aroma:</strong> Frisches, scharfes Aroma von Kiefernnadeln und Tannen.<br><strong>Potenzielle Wirkung:</strong> Fördert die Aufmerksamkeit, das Gedächtnis und die Konzentration. Kann als Bronchodilatator wirken (öffnet die Atemwege) und hat entzündungshemmende Eigenschaften.<br><strong>Siedepunkt:</strong> ~155°C' },
      { id: 't6', term: 'Terpinolen', def: '<strong>Aroma:</strong> Komplexes, vielschichtiges Aroma: blumig, kräuterig, kiefernartig mit einem Hauch von Zitrus und Apfel.<br><strong>Potenzielle Wirkung:</strong> Oft leicht sedierend und beruhigend. Hat antioxidative und antibakterielle Eigenschaften.<br><strong>Siedepunkt:</strong> ~186°C' },
      { id: 't7', term: 'Linalool', def: '<strong>Aroma:</strong> Blumig, süß, mit einem starken Lavendel-Charakter.<br><strong>Potenzielle Wirkung:</strong> Bekannt für seine beruhigenden, angstlösenden und schlaffördernden Eigenschaften. Wirkt stressreduzierend.<br><strong>Siedepunkt:</strong> ~198°C' },
      { id: 't8', term: 'Humulen', def: '<strong>Aroma:</strong> Erdig, holzig, hopfenartig (ist das Hauptterpen in Hopfen).<br><strong>Potenzielle Wirkung:</strong> Appetitzügelnd und entzündungshemmend. Trägt zum "erdigen" Geschmack vieler Sorten bei.<br><strong>Siedepunkt:</strong> ~106°C' },
      { id: 't9', term: 'Ocimen', def: '<strong>Aroma:</strong> Süß, kräuterig und holzig. Erinnert an eine Mischung aus Minze und Petersilie.<br><strong>Potenzielle Wirkung:</strong> Erhebend, antiviral und abschwellend. Oft in Sativa-Sorten gefunden, die eine energetische Wirkung haben.<br><strong>Siedepunkt:</strong> ~100°C' },
      { id: 't10', term: 'Bisabolol', def: '<strong>Aroma:</strong> Leicht süß, blumig, mit Noten von Kamille und einem Hauch von Pfeffer.<br><strong>Potenzielle Wirkung:</strong> Stark entzündungshemmend und hautberuhigend. Wird häufig in Kosmetika verwendet.<br><strong>Siedepunkt:</strong> ~153°C' },
    ];
    
    const agronomyItems = [
      { id: 'a1', term: 'Sativa, Indica & Hybrid', def: 'Diese Begriffe beschreiben die Hauptkategorien von Cannabis, die sich traditionell in Wuchsform und Wirkung unterscheiden:<ul><li><strong>Sativa:</strong> Wächst hoch und schlank mit schmalen Blättern. Die Wirkung wird oft als zerebral, energetisierend und kreativ beschrieben ("Kopf-High").</li><li><strong>Indica:</strong> Wächst kurz, buschig und kompakt mit breiten Blättern. Die Wirkung ist meist körperlich, entspannend und sedierend ("Körper-High").</li><li><strong>Hybrid:</strong> Eine Kreuzung aus Sativa- und Indica-Genetik. Moderne Sorten sind fast alle Hybriden, deren Eigenschaften und Wirkungen eine Mischung beider Elternteile sind. Das Terpenprofil ist oft ein besserer Indikator für die zu erwartende Wirkung als die reine Sativa/Indica-Einstufung.</li></ul>' },
      { id: 'a2', term: 'Der Entourage-Effekt', def: 'Der Entourage-Effekt beschreibt die Theorie, dass all diese Verbindungen (Cannabinoide, Terpene, Flavonoide) synergistisch zusammenwirken und eine umfassendere und nuanciertere Wirkung erzeugen, als jede Verbindung für sich allein. THC und CBD wirken beispielsweise zusammen anders als jeweils isoliert. Ein Vollspektrum-Produkt ist daher oft wirksamer als ein Isolat.'},
      { id: 'a3', term: 'Blütezeit: Photoperiodisch vs. Autoflower', def: '<ul><li><strong>Photoperiodisch:</strong> Diese Pflanzen benötigen eine Änderung des Lichtzyklus, um die Blütephase einzuleiten. Im Indoor-Anbau wird dies durch eine Umstellung auf 12 Stunden Licht und 12 Stunden Dunkelheit (12/12) erreicht. Sie können theoretisch unendlich lange in der vegetativen Phase gehalten werden.</li><li><strong>Autoflower (Autoflowering):</strong> Diese Sorten enthalten Ruderalis-Genetik, eine Cannabis-Unterart aus kalten Regionen. Sie beginnen nach einer genetisch festgelegten Zeit (typischerweise 2-4 Wochen) automatisch zu blühen, unabhängig vom Lichtzyklus. Sie haben einen kürzeren Lebenszyklus und sind oft anfängerfreundlicher und kompakter.</li></ul>' },
      { id: 'a4', term: 'Ertrag & Höhe verstehen', def: 'Diese Angaben sind Schätzungen, die stark von den Anbaubedingungen abhängen.<ul><li><strong>Ertrag (g/m²):</strong> Gibt an, wie viel Ernte (in Gramm getrockneter Blüten) pro Quadratmeter Anbaufläche bei optimalen Bedingungen erwartet werden kann. Relevant für Indoor-Anbau.</li><li><strong>Ertrag (g/Pflanze):</strong> Gibt den erwarteten Ertrag für eine einzelne Pflanze an, typischerweise im Outdoor-Anbau.</li><li><strong>Faktoren:</strong> Genetik, Lichtintensität, Topfgröße, Nährstoffversorgung, Trainingstechniken und die Erfahrung des Züchters haben einen massiven Einfluss auf beide Werte.</li></ul>' },
    ];
    
    const plantCareItems = [
      { id: 'pc1', term: 'Lebensphasen im Detail', def: '<ul><li><strong>Samen/Keimung:</strong> Der Samen benötigt Feuchtigkeit, Wärme und Dunkelheit. Die Pfahlwurzel erscheint.</li><li><strong>Sämling:</strong> Die Pflanze entwickelt die ersten Keimblätter (Cotyledonen) und danach die ersten echten, gefingerten Blätter. Sehr verletzliche Phase.</li><li><strong>Wachstum (Vegetation):</strong> Die Pflanze konzentriert sich auf das Wachstum von Blättern, Stängeln und Wurzeln. Benötigt viel Licht (18+ Stunden) und stickstoffreichen Dünger.</li><li><strong>Blüte:</strong> Nach Umstellung auf 12/12 Licht (bei photoperiodischen Sorten) stellt die Pflanze das vegetative Wachstum ein und entwickelt Blüten (Buds). Der Nährstoffbedarf verschiebt sich zu Phosphor und Kalium.</li><li><strong>Ernte, Trocknung & Curing:</strong> Die entscheidenden Schritte zur Veredelung. Richtiges Trocknen und Aushärten sind entscheidend für Qualität, Geschmack und Haltbarkeit.</li></ul>' },
      { id: 'pc2', term: 'Vitalwerte meistern', def: '<ul><li><strong>pH-Wert & Nährstoffsperre:</strong> Der pH-Wert beeinflusst die Fähigkeit der Wurzeln, Nährstoffe aufzunehmen. Ein falscher pH-Wert führt zur "Nährstoffsperre" (Lockout), bei der die Pflanze hungert, obwohl Nährstoffe im Substrat vorhanden sind. Ideal in Erde: 6.0-7.0, in Hydro/Coco: 5.5-6.5.</li><li><strong>EC-Wert (Elektrische Leitfähigkeit):</strong> Misst die Nährstoffkonzentration. Ein zu hoher EC-Wert führt zu "Nährstoffbrand" (verbrannte Blattspitzen), ein zu niedriger zu Mangelerscheinungen.</li><li><strong>Substratfeuchtigkeit & Wurzelatmung:</strong> Die Wurzeln benötigen nicht nur Wasser, sondern auch Sauerstoff. Ein ständiger Wechsel zwischen feucht und leicht trocken ist ideal. Chronische Nässe führt zu Wurzelfäule.</li></ul>' },
      { id: 'pc3', term: 'Fortgeschrittene Trainingstechniken', def: 'Training formt die Pflanze für maximalen Lichteinfall und Ertrag.<ul><li><strong>LST (Low Stress Training):</strong> Sanftes Herunterbiegen von Ästen, um ein breites, flaches Blätterdach zu erzeugen.</li><li><strong>Topping:</strong> Abschneiden des Haupttriebs, um die Pflanze zu zwingen, zwei neue Haupttriebe zu bilden (buschiger Wuchs).</li><li><strong>FIMing (Fuck I Missed):</strong> Eine Variante des Toppings, bei der nur ein Teil des Haupttriebs entfernt wird, was zu 4+ neuen Trieben führen kann.</li><li><strong>SCROG (Screen of Green):</strong> Ein Netz wird über die Pflanzen gespannt. Alle Triebe werden durch das Netz geflochten, um eine perfekt ebene und lichteffiziente Oberfläche aus Blüten zu erzeugen.</li><li><strong>Entlaubung (Defoliation):</strong> Gezieltes Entfernen von großen Fächerblättern, um die Lichtdurchdringung und Luftzirkulation zu den unteren Blüten zu verbessern.</li></ul>' },
      { id: 'pc4', term: 'Häufige Probleme & Lösungen', def: '<ul><li><strong>Nährstoffmängel (Mobile Nährstoffe wie N, P, K, Mg):</strong> Symptome zeigen sich zuerst an den unteren, älteren Blättern, da die Pflanze die Nährstoffe zu den neuen Trieben verschiebt. <strong>Lösung:</strong> Düngung anpassen.</li><li><strong>Nährstoffmängel (Immobile Nährstoffe wie Ca, S, B):</strong> Symptome zeigen sich zuerst an den oberen, neuen Blättern, da die Pflanze diese Nährstoffe nicht intern bewegen kann. <strong>Lösung:</strong> Düngung anpassen, oft ist Cal/Mag-Zusatz nötig.</li><li><strong>Schädlinge:</strong><ul><li><strong>Spinnmilben:</strong> Winzige weiße Punkte auf Blättern, feine Spinnweben. <strong>Lösung:</strong> Neemöl, Raubmilben.</li><li><strong>Trauermücken:</strong> Kleine schwarze Fliegen um die Erde. <strong>Lösung:</strong> Gelbtafeln, Erde trockener halten, Nematoden.</li></ul></li></ul>' },
    ];

    const glossaryItems = [
        { id: 'g1', term: 'Calyx (Blütenkelch)', def: 'Der eigentliche Teil der Blüte, der die Samenanlage umschließt. Die Calyxen sind die harzigsten Teile der Pflanze.' },
        { id: 'g2', term: 'Clone (Klon/Steckling)', def: 'Ein genetisch identischer Ableger einer Mutterpflanze, der geschnitten und bewurzelt wird, um eine neue Pflanze zu züchten.' },
        { id: 'g3', term: 'Feminisiert', def: 'Saatgut, das so behandelt wurde, dass es fast ausschließlich (zu 99%+) weibliche Pflanzen hervorbringt, die die begehrten Blüten produzieren.' },
        { id: 'g4', term: 'Flushing (Spülen)', def: 'Das Gießen der Pflanze mit reinem, pH-reguliertem Wasser in den letzten 1-2 Wochen vor der Ernte, um überschüssige Nährstoffsalze aus dem Substrat und der Pflanze zu entfernen, was den Geschmack verbessert.' },
        { id: 'g5', term: 'Landrasse (Landrace)', def: 'Eine reine, ursprüngliche Cannabis-Sorte, die sich über lange Zeit in einer bestimmten geografischen Region natürlich entwickelt und angepasst hat (z.B. Afghan Kush, Durban Poison).' },
        { id: 'g6', term: 'N-P-K', def: 'Das Verhältnis der drei primären Makronährstoffe, die Pflanzen benötigen: Stickstoff (N), Phosphor (P) und Kalium (K). Düngerflaschen geben dieses Verhältnis oft als Zahlen an (z.B. 5-10-5).' },
        { id: 'g7', term: 'Phänotyp (Phenotype)', def: 'Die sichtbaren Merkmale einer Pflanze, die aus der Interaktion ihrer Genetik (Genotyp) und der Umwelt resultieren. Samen derselben Sorte können unterschiedliche Phänotypen hervorbringen.' },
        { id: 'g8', term: 'Pistil (Stempel/Blütennarbe)', def: 'Die kleinen "Härchen" auf den Calyxen, die anfangs weiß sind und sich im Laufe der Reifung orange/braun verfärben. Sie dienen dem Einfangen von Pollen.' },
        { id: 'g9', term: 'Trichome', def: 'Die winzigen, pilzförmigen Harzdrüsen auf den Blüten und Blättern, die Cannabinoide und Terpene produzieren. Ihre Farbe (klar, milchig, bernsteinfarben) ist der beste Indikator für den Erntezeitpunkt.' },
    ];
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-primary-600 dark:text-primary-400">Hilfe-Center</h1>
            
            <div className="space-y-6">
                <SectionCard icon={<PhosphorIcons.RocketLaunch />} title="Erste Schritte & Hauptfunktionen">
                    <p className="text-slate-600 dark:text-slate-300">Willkommen beim Grow Guide! Diese App ist dein interaktiver Begleiter für den Cannabis-Anbau. Hier ist ein kurzer Überblick:</p>
                    <ul className="list-disc list-inside space-y-2 mt-4 text-slate-600 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
                       <li><strong>Sorten entdecken:</strong> Blättere durch die <strong>{View.Strains}</strong>-Datenbank, nutze Filter und Suche, um die perfekte Sorte zu finden. Speichere Favoriten und starte einen neuen Grow direkt aus der Detailansicht.</li>
                       <li><strong>Pflanzen managen:</strong> Verwalte bis zu drei Pflanzen im Bereich <strong>{View.Plants}</strong>. Beobachte ihre Entwicklung in Echtzeit, protokolliere alle Maßnahmen im Journal und reagiere auf Probleme und Aufgaben.</li>
                       <li><strong>Wissen aneignen:</strong> Folge der Schritt-für-Schritt-<strong>{View.Knowledge}</strong>, um die Grundlagen zu lernen. Hake die Checklistenpunkte ab, um deinen Fortschritt zu verfolgen und stelle dem KI-Mentor deine Fragen.</li>
                       <li><strong>Setup planen:</strong> Plane dein Setup mit dem <strong>{View.Equipment}</strong>-Konfigurator oder nutze die praktischen Rechner für Licht, Belüftung und Nährstoffe.</li>
                       <li><strong>App anpassen:</strong> Im <strong>{View.Settings}</strong>-Bereich kannst du das Farbschema (Hell/Dunkel), die Schriftgröße und die Sprache (Deutsch/Englisch) anpassen sowie deine Daten sichern und importieren.</li>
                    </ul>
                </SectionCard>

                <SectionCard icon={<PhosphorIcons.Question />} title="Häufig gestellte Fragen (FAQ)">
                    <Card className="p-0">
                        {faqItems.map(item => (
                            <AccordionItem key={item.id} title={item.q} isOpen={openAccordion === `faq-${item.id}`} onToggle={() => handleToggle(item.id, 'faq')}>
                                <p dangerouslySetInnerHTML={{ __html: item.a }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>

                <SectionCard icon={<PhosphorIcons.Brain />} title="Umfassendes Cannabinoid-Lexikon">
                    <Card className="p-0">
                        {cannabinoidItems.map(item => (
                            <AccordionItem key={item.id} title={item.term} isOpen={openAccordion === `cannabinoid-${item.id}`} onToggle={() => handleToggle(item.id, 'cannabinoid')}>
                                <div dangerouslySetInnerHTML={{ __html: item.def }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>

                <SectionCard icon={<PhosphorIcons.Flask />} title="Terpen-Lexikon">
                    <Card className="p-0">
                        {terpeneItems.map(item => (
                            <AccordionItem key={item.id} title={item.term} isOpen={openAccordion === `terpene-${item.id}`} onToggle={() => handleToggle(item.id, 'terpene')}>
                                <div dangerouslySetInnerHTML={{ __html: item.def }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>
                
                <SectionCard icon={<PhosphorIcons.Sparkle />} title="Flavonoid-Lexikon">
                    <Card className="p-0">
                        {flavonoidItems.map(item => (
                            <AccordionItem key={item.id} title={item.term} isOpen={openAccordion === `flavonoid-${item.id}`} onToggle={() => handleToggle(item.id, 'flavonoid')}>
                                <div dangerouslySetInnerHTML={{ __html: item.def }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>

                <SectionCard icon={<PhosphorIcons.GraduationCap />} title="Agronomie-Grundlagen">
                    <Card className="p-0">
                        {agronomyItems.map(item => (
                            <AccordionItem key={item.id} title={item.term} isOpen={openAccordion === `agronomy-${item.id}`} onToggle={() => handleToggle(item.id, 'agronomy')}>
                                <div dangerouslySetInnerHTML={{ __html: item.def }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>

                <SectionCard icon={<PhosphorIcons.BookOpenText />} title="Pflanzenpflege-ABC">
                    <Card className="p-0">
                        {plantCareItems.map(item => (
                            <AccordionItem key={item.id} title={item.term} isOpen={openAccordion === `plantcare-${item.id}`} onToggle={() => handleToggle(item.id, 'plantcare')}>
                                <div dangerouslySetInnerHTML={{ __html: item.def }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>

                <SectionCard icon={<PhosphorIcons.Book />} title="Umfassendes Glossar">
                    <Card className="p-0">
                        {glossaryItems.map(item => (
                            <AccordionItem key={item.id} title={item.term} isOpen={openAccordion === `glossary-${item.id}`} onToggle={() => handleToggle(item.id, 'glossary')}>
                                <p dangerouslySetInnerHTML={{ __html: item.def }} />
                            </AccordionItem>
                        ))}
                    </Card>
                </SectionCard>

                 <SectionCard icon={<PhosphorIcons.Info />} title="Über die App">
                     <div className="space-y-4 text-slate-600 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold !text-slate-800 dark:!text-slate-200 !m-0">Cannabis Grow Guide</h3>
                            <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">v2.2.0</span>
                        </div>
                        <p>Diese App ist ein interaktiver Guide, der dir hilft, deine Cannabis-Anbau-Reise zu managen. Verfolge deine Pflanzen, lerne über Sorten und erhalte Expertentipps zu Ausrüstung und Techniken.</p>
                         <p><strong>Neue Features:</strong> Diese Version enthält eine vollständige Übersetzung für Englisch und Deutsch sowie umfassende Verbesserungen der Barrierefreiheit (Tastatur- & Screenreader-Unterstützung).</p>
                        <div>
                            <h4 className="font-semibold !text-primary-600 dark:!text-primary-400">Haftungsausschluss</h4>
                            <p>Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Regelungen, die von Land zu Land unterschiedlich sind. Bitte informiere dich über die Gesetze in deiner Region und handle stets verantwortungsbewusst und gesetzeskonform.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold !text-primary-600 dark:!text-primary-400">Datenschutz</h4>
                            <p>Deine Privatsphäre ist uns wichtig. Alle deine Daten, einschließlich Pflanzenjournale und Einstellungen, werden ausschließlich lokal in deinem Browser gespeichert und verlassen niemals dein Gerät.</p>
                        </div>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
};