import { LexiconEntry } from '@/types';

export const lexiconData: LexiconEntry[] = [
  // --- Cannabinoide ---
  {
    term: 'THC (Tetrahydrocannabinol)',
    definition: 'Das primäre psychoaktive Cannabinoid in Cannabis, verantwortlich für das "High"-Gefühl. Es interagiert hauptsächlich mit den CB1-Rezeptoren im Gehirn.',
    category: 'Cannabinoid',
    details: {
      alsoKnownAs: 'Dronabinol',
      boilingPoint: '157°C (315°F)',
    }
  },
  {
    term: 'CBD (Cannabidiol)',
    definition: 'Ein nicht-psychoaktives Cannabinoid, das für seine therapeutischen Eigenschaften, einschließlich entzündungshemmender, angstlösender und schmerzlindernder Wirkungen, geschätzt wird.',
    category: 'Cannabinoid',
    details: {
      boilingPoint: '160-180°C (320-356°F)',
    }
  },
  {
    term: 'CBN (Cannabinol)',
    definition: 'Ein Cannabinoid, das entsteht, wenn THC abgebaut wird (z. B. durch Alterung oder Hitze). Es ist nur leicht psychoaktiv und wird oft mit einer sedierenden Wirkung in Verbindung gebracht.',
    category: 'Cannabinoid',
    details: {
      alsoKnownAs: 'Das "Schlaf"-Cannabinoid',
      boilingPoint: '185°C (365°F)',
    }
  },

  // --- Terpene ---
  {
    term: 'Myrcen',
    definition: 'Das am häufigsten vorkommende Terpen in Cannabis. Es ist bekannt für sein erdiges, moschusartiges Aroma, das an Nelken erinnert. Es wird angenommen, dass es entspannende und sedierende Wirkungen hat.',
    category: 'Terpene',
    details: {
      boilingPoint: '167°C (333°F)',
      aromas: ['Erdig', 'Moschus', 'Kräuterartig', 'Nelke'],
    }
  },
  {
    term: 'Limonen',
    definition: 'Ein Terpen mit einem starken Zitrusaroma, das häufig in Zitrusfrüchten, Rosmarin und Pfefferminze vorkommt. Es wird mit stimmungsaufhellenden und stressabbauenden Eigenschaften in Verbindung gebracht.',
    category: 'Terpene',
    details: {
      boilingPoint: '176°C (349°F)',
      aromas: ['Zitrus', 'Zitrone', 'Orange'],
    }
  },
  {
    term: 'Linalool',
    definition: 'Dieses Terpen ist für sein blumiges, lavendelartiges Aroma bekannt. Es wird angenommen, dass es beruhigende, angstlösende und schlaffördernde Wirkungen hat.',
    category: 'Terpene',
    details: {
      boilingPoint: '198°C (388°F)',
      aromas: ['Blumig', 'Lavendel', 'Würzig'],
    }
  },

  // --- Flavonoide ---
  {
    term: 'Cannaflavin A',
    definition: 'Ein Flavonoid, das fast ausschließlich in Cannabis vorkommt. Studien deuten darauf hin, dass es starke entzündungshemmende Eigenschaften hat, die die von Aspirin übertreffen könnten.',
    category: 'Flavonoid',
  },
  {
    term: 'Quercetin',
    definition: 'Ein weit verbreitetes Flavonoid, das in vielen Früchten und Gemüsen vorkommt, einschließlich Cannabis. Es ist für seine antioxidativen und antiallergischen Eigenschaften bekannt.',
    category: 'Flavonoid',
    details: {
      alsoKnownAs: 'Pflanzenpigment',
    }
  },
  {
    term: 'Apigenin',
    definition: 'Dieses Flavonoid kommt auch in Kamille vor und wird mit angstlösenden und beruhigenden Wirkungen in Verbindung gebracht, die zur entspannenden Wirkung einiger Cannabis-Sorten beitragen können.',
    category: 'Flavonoid',
  },
  
  // --- Allgemeine Begriffe ---
  {
    term: 'Trichome',
    definition: 'Die harzigen, pilzförmigen Drüsen auf den Blüten und Blättern von Cannabis. Sie produzieren und speichern die Cannabinoide und Terpene der Pflanze.',
    category: 'General',
    details: {
      alsoKnownAs: 'Harzdrüsen, Kristalle',
    }
  },
  {
    term: 'VPD (Dampfdruckdefizit)',
    definition: 'Ein Maß für den kombinierten Druck von Temperatur und Luftfeuchtigkeit, der die Transpirationsrate einer Pflanze beeinflusst. Die Optimierung des VPD ist entscheidend für maximales Wachstum.',
    category: 'General',
  },
  {
    term: 'Curing (Fermentation)',
    definition: 'Der Prozess des langsamen Trocknens und Reifens von Cannabisblüten nach der Ernte. Das Curing baut Chlorophyll ab und verbessert den Geschmack, das Aroma und die Sanftheit des Rauchs erheblich.',
    category: 'General',
  }
];
