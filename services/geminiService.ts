// import { GoogleGenAI, GenerateContentResponse, Type } from "@google/ai";
import { AIResponse, Plant, AIProTip } from '../types';

// This is a MOCK service. In a real application, you would initialize Gemini API here.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const KNOWLEDGE_ARTICLES: Record<string, { title: string; content: string }> = {
  curing: {
    title: 'Die Kunst des Curing: Veredelung der Ernte',
    content: `
      Curing, oder Aushärten, ist der entscheidende letzte Schritt, um das volle Potenzial Ihrer Cannabisblüten freizusetzen. Es wird oft übersehen, aber es ist der Schlüssel zu einem sanfteren Rauch, einem besseren Geschmack und einer stärkeren Wirkung.

      <h3 class="text-xl font-bold mt-4 mb-2">Warum ist Curing wichtig?</h3>
      <ul class="list-disc list-inside space-y-2">
        <li><strong>Geschmacksverbesserung:</strong> Während des Curing-Prozesses bauen sich Chlorophyll und andere unerwünschte Verbindungen ab. Dies führt zu einem viel sanfteren und angenehmeren Geschmack. Terpene, die für das Aroma verantwortlich sind, können sich voll entfalten.</li>
        <li><strong>Wirkungssteigerung:</strong> Chemische Prozesse während des Aushärtens können die Potenz von Cannabinoiden wie THC erhöhen.</li>
        <li><strong>Haltbarkeit:</strong> Richtig ausgehärtetes Cannabis ist besser vor Schimmel und Bakterien geschützt und kann monatelang gelagert werden, ohne an Qualität zu verlieren.</li>
      </ul>

      <h3 class="text-xl font-bold mt-6 mb-2">Schritt-für-Schritt-Anleitung</h3>
      <ol class="list-decimal list-inside space-y-3">
        <li><strong>Trocknen:</strong> Bevor das Curing beginnt, müssen die Blüten richtig getrocknet werden. Hängen Sie die Zweige kopfüber in einem dunklen, gut belüfteten Raum bei ca. 18-20°C und 50-60% Luftfeuchtigkeit für 7-14 Tage auf. Die Stängel sollten brechen, nicht biegen.</li>
        <li><strong>Eintopfen:</strong> Füllen Sie die getrockneten Blüten locker in luftdichte Gläser (Einmachgläser sind ideal). Füllen Sie die Gläser nur zu etwa 75%, um Luftzirkulation zu ermöglichen.</li>
        <li><strong>"Burping" (Lüften):</strong> In der ersten Woche öffnen Sie die Gläser 2-3 Mal täglich für jeweils 5-10 Minuten. Dies setzt Feuchtigkeit und Gase frei. Riechen Sie dabei an den Blüten – sie sollten zunehmend aromatischer riechen, nicht nach Ammoniak oder Heu.</li>
        <li><strong>Fortgesetztes Curing:</strong> Nach der ersten Woche reicht es aus, die Gläser alle paar Tage für einige Minuten zu lüften. Dieser Prozess sollte mindestens 2-4 Wochen dauern, aber viele Kenner lassen ihre Ernte 6 Monate oder länger aushärten.</li>
        <li><strong>Lagerung:</strong> Nach dem Curing lagern Sie die Gläser an einem kühlen, dunklen Ort. Die ideale Lagertemperatur liegt unter 21°C.</li>
      </ol>
      <p class="mt-4">Geduld ist der Schlüssel zum perfekten Curing. Ihre Mühe wird mit einem Endprodukt von höchster Qualität belohnt.</p>
    `,
  },
  watering: {
    title: 'Richtiges Gießen: Die Grundlage des Erfolgs',
    content: 'Das richtige Gießen ist eine Kunst. Überwässerung ist einer der häufigsten Fehler bei Anfängern. Fühlen Sie die obersten Zentimeter der Erde. Wenn sie trocken ist, ist es Zeit zu gießen. Gießen Sie langsam und gleichmäßig, bis etwa 10-20% des Wassers unten aus dem Topf abfließen (Drainage). Dies stellt sicher, dass alle Wurzeln Wasser bekommen und alte Nährstoffsalze ausgespült werden.',
  },
  lighting: {
    title: 'Beleuchtung für den Indoor-Anbau',
    content: 'Licht ist die Energiequelle Ihrer Pflanze. In der vegetativen Phase benötigen Pflanzen typischerweise 18 Stunden Licht und 6 Stunden Dunkelheit. In der Blütephase wird der Zyklus auf 12 Stunden Licht und 12 Stunden Dunkelheit umgestellt, um die Blütenbildung zu simulieren. LED-Lampen sind heutzutage die effizienteste Wahl, da sie weniger Wärme erzeugen und ein volles Lichtspektrum bieten.',
  },
};

const EQUIPMENT_DATA = {
    shops: [
        { name: "Growmart", url: "growmart.de", description: "Einer der größten Growshops in Deutschland mit einer riesigen Auswahl an Produkten für Einsteiger und Profis." },
        { name: "Zamnesia", url: "zamnesia.com", description: "Ein europäischer Online-Shop, der nicht nur Grow-Equipment, sondern auch Samen, Headshop-Artikel und mehr anbietet." },
        { name: "Grow-Shop24", url: "grow-shop24.de", description: "Bietet komplette Growbox-Sets und eine breite Palette an Beleuchtung, Belüftung und Düngemitteln." },
    ],
    gear: [
        { name: "Growbox (Zelt)", description: "Ein geschlossenes System, das es Ihnen ermöglicht, Licht, Temperatur und Luftfeuchtigkeit vollständig zu kontrollieren." },
        { name: "LED-Beleuchtung", description: "Moderne, energieeffiziente Lampen, die das für das Pflanzenwachstum notwendige Lichtspektrum liefern." },
        { name: "Abluftsystem mit Aktivkohlefilter", description: "Entfernt Gerüche und sorgt für einen konstanten Luftaustausch, der für die Pflanzengesundheit entscheidend ist." },
        { name: "Töpfe mit Untersetzern", description: "Stofftöpfe sind eine gute Wahl, da sie eine bessere Belüftung der Wurzeln ermöglichen (Air-Pruning)." },
        { name: "PH-Messgerät und pH-Regulatoren", description: "Der richtige pH-Wert des Wassers (normalerweise 6.0-7.0 in Erde) ist entscheidend für die Nährstoffaufnahme." },
    ]
};

const AI_KNOWLEDGE_RESPONSES: Record<string, AIResponse> = {
    "spinnmilben": {
        title: "Spinnmilben erkennen und bekämpfen",
        content: `
            Spinnmilben sind ein häufiger Schädling beim Indoor-Anbau. Hier sind die wichtigsten Punkte:
            <h3 class="text-lg font-semibold mt-3 mb-1">Erkennung:</h3>
            <ul class="list-disc list-inside space-y-1">
                <li>Winzige weiße oder gelbe Punkte auf der Blattoberseite.</li>
                <li>Feine Spinnweben zwischen Blättern und Stängeln (bei starkem Befall).</li>
                <li>Mit einer Lupe kann man die winzigen Tierchen auf der Blattunterseite erkennen.</li>
            </ul>
            <h3 class="text-lg font-semibold mt-3 mb-1">Bekämpfung:</h3>
            <ul class="list-disc list-inside space-y-1">
                <li><strong>Sofortmaßnahme:</strong> Befallene Blätter entfernen und die Pflanze vorsichtig mit Wasser absprühen.</li>
                <li><strong>Biologische Mittel:</strong> Neemöl-Lösungen sind sehr effektiv. Alle paar Tage auf die Pflanze sprühen, besonders die Blattunterseiten.</li>
                <li><strong>Nützlinge:</strong> Raubmilben sind natürliche Feinde von Spinnmilben und können online bestellt werden.</li>
                <li><strong>Prävention:</strong> Eine saubere Umgebung und eine gute Luftzirkulation sind der beste Schutz.</li>
            </ul>
        `,
    },
    "standard": {
        title: "Antwort der KI",
        content: "Das ist eine ausgezeichnete Frage. Basierend auf den verfügbaren Daten würde ich empfehlen, einen ganzheitlichen Ansatz zu verfolgen. Stellen Sie sicher, dass die Grundlagen wie Licht, Wasser und Nährstoffe stimmen. Bei spezifischen Problemen ist eine genaue Diagnose entscheidend, bevor man handelt. Beobachten Sie Ihre Pflanze genau."
    }
};

const AI_EQUIPMENT_RESPONSES: Record<string, AIResponse> = {
    "licht": {
        title: "Die beste Beleuchtung für Anfänger",
        content: `
            Für Anfänger sind <strong>LED-Lampen</strong> fast immer die beste Wahl. Hier ist warum:
            <ul class="list-disc list-inside space-y-1 mt-2">
                <li><strong>Energieeffizienz:</strong> LEDs verbrauchen deutlich weniger Strom als ältere Technologien wie HPS-Lampen, was Ihre Stromrechnung schont.</li>
                <li><strong>Geringe Wärmeentwicklung:</strong> Sie produzieren weniger Abwärme, was die Temperaturkontrolle in der Growbox erleichtert und das Risiko von Hitzestress für die Pflanzen verringert.</li>
                <li><strong>Volles Spektrum:</strong> Moderne LED-Lampen bieten ein Lichtspektrum, das sowohl für die Wachstums- als auch für die Blütephase optimiert ist.</li>
                <li><strong>Lange Lebensdauer:</strong> LEDs halten viele Jahre, was sie zu einer guten langfristigen Investition macht.</li>
            </ul>
            <p class="mt-3">Achten Sie beim Kauf auf eine Lampe mit einer Leistung, die zur Größe Ihrer Anbaufläche passt. Für eine Standard-Growbox von 80x80cm ist eine LED-Lampe mit ca. 150-250 Watt eine gute Ausgangsbasis.</p>
        `,
    },
    "standard": {
        title: "KI-Ausrüstungsberater",
        content: "Die Wahl der richtigen Ausrüstung hängt stark von Ihrem Budget, Ihrer Anbaufläche und Ihren Zielen ab. Für ein Standard-Setup empfehle ich eine Growbox, eine dimmbare LED-Lampe, ein Abluftset mit Aktivkohlefilter und Stofftöpfe. Diese Kombination bietet die beste Balance aus Kontrolle, Effizienz und Kosten für den Einstieg."
    }
}


export const geminiService = {
  getKnowledgeArticle: async (topic: string): Promise<AIResponse> => {
    console.log(`Fetching mock article for: ${topic}`);
    await new Promise(res => setTimeout(res, 500));
    return KNOWLEDGE_ARTICLES[topic] || { title: 'Nicht gefunden', content: 'Dieser Artikel ist noch nicht verfügbar.' };
  },
  askAboutKnowledge: async (prompt: string): Promise<AIResponse> => {
    console.log(`Asking mock AI about knowledge: ${prompt}`);
    await new Promise(res => setTimeout(res, 800));
    const normalizedPrompt = prompt.toLowerCase();
    if (normalizedPrompt.includes('spinnmilben')) {
        return AI_KNOWLEDGE_RESPONSES['spinnmilben'];
    }
    return AI_KNOWLEDGE_RESPONSES['standard'];
  },
  getEquipmentInfo: async () => {
    console.log('Fetching mock equipment info');
    await new Promise(res => setTimeout(res, 500));
    return EQUIPMENT_DATA;
  },
  askAboutEquipment: async (prompt: string): Promise<AIResponse> => {
    console.log(`Asking mock AI about equipment: ${prompt}`);
    await new Promise(res => setTimeout(res, 800));
    const normalizedPrompt = prompt.toLowerCase();
    if (normalizedPrompt.includes('licht') || normalizedPrompt.includes('lampe')) {
        return AI_EQUIPMENT_RESPONSES['licht'];
    }
    return AI_EQUIPMENT_RESPONSES['standard'];
  },
  askAboutPlant: async (plant: Plant, prompt: string): Promise<AIResponse> => {
    console.log(`Asking mock AI about plant ${plant.name}: ${prompt}`);
    await new Promise(res => setTimeout(res, 1000));

    // Simple context-aware mock logic
    if (plant.problems.some(p => p.type === 'PhTooLow')) {
        return {
            title: `KI-Analyse für ${plant.name}`,
            content: `
                Ich habe die Daten deiner Pflanze analysiert. Der pH-Wert von <strong>${plant.vitals.ph.toFixed(1)}</strong> ist kritisch niedrig. Dies führt wahrscheinlich zu einer <strong>Nährstoffsperre</strong>, bei der die Wurzeln keine Nährstoffe aufnehmen können, selbst wenn sie im Medium vorhanden sind.
                <h3 class="text-lg font-semibold mt-3 mb-1">Empfehlung:</h3>
                <ul class="list-disc list-inside space-y-1">
                    <li>Spüle das Substrat sofort mit pH-neutralem Wasser (ca. 6.5).</li>
                    <li>Passe den pH-Wert deiner nächsten Nährlösung mit einem "pH Up"-Produkt an, um den Wert im Substrat langsam wieder in den idealen Bereich von 6.0-6.8 zu bringen.</li>
                </ul>
            `
        }
    }
    
    if (plant.vitals.substrateMoisture < 20) {
        return {
            title: `KI-Analyse für ${plant.name}`,
            content: `
               Die Daten zeigen, dass das Substrat mit <strong>${plant.vitals.substrateMoisture.toFixed(0)}%</strong> extrem trocken ist. Dies verursacht erheblichen Stress und stoppt das Wachstum.
                <h3 class="text-lg font-semibold mt-3 mb-1">Empfehlung:</h3>
                <ul class="list-disc list-inside space-y-1">
                    <li>Gieße die Pflanze sofort und langsam, bis du etwa 15-20% Drainage am Boden des Topfes siehst.</li>
                    <li>Überprüfe die Bewässerungsroutine. Eventuell musst du häufiger oder mit mehr Volumen gießen, besonders wenn die Pflanze größer wird.</li>
                </ul>
            `
        }
    }

    return {
        title: `KI-Analyse für ${plant.name}`,
        content: `
            Die aktuellen Werte deiner Pflanze sehen stabil aus. Der pH-Wert liegt bei <strong>${plant.vitals.ph.toFixed(1)}</strong> und der EC-Wert bei <strong>${plant.vitals.ec.toFixed(2)}</strong>. Das Substrat hat eine gute Feuchtigkeit.
            <p class="mt-2">Behalte die Werte weiterhin im Auge, besonders wenn die Pflanze in die Blütephase eintritt, da sich ihr Nährstoffbedarf ändern wird. Gut gemacht bisher!</p>
        `
    };
  }
};