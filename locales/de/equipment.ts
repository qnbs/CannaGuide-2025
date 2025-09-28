export const equipmentView = {
  tabs: {
    configurator: 'KI-Konfigurator',
    calculators: 'Rechner',
    setups: 'Meine Setups',
    growShops: 'Grow Shops',
  },
  configurator: {
    title: 'KI Setup-Konfigurator',
    subtitle: 'Beantworte ein paar Fragen und lass unsere KI die perfekte Ausrüstung für deine Bedürfnisse empfehlen.',
    subtitleNew: 'Erhalte eine maßgeschneiderte Ausrüstungsempfehlung basierend auf deiner geplanten Anzahl an Pflanzen und deinem Stil.',
    step1Title: 'Anbaufläche & Budget',
    step1TitleNew: '1. Wie viele Pflanzen planst du anzubauen?',
    step2Title: 'Anbaustil',
    step2TitleNew: '2. Wähle deinen Konfigurationsstil',
    area: 'Fläche',
    areas: {
      '60x60': 'Klein (60x60 cm)',
      '80x80': 'Mittel (80x80 cm)',
      '100x100': 'Groß (100x100 cm)',
      '120x60': 'Rechteckig (120x60 cm)',
      '120x120': 'XL (120x120 cm)',
    },
    plantCount_one: '1 Pflanze',
    plantCount_other: '{{count}} Pflanzen',
    budget: 'Budget',
    budgets: {
      low: 'Preis-Leistung',
      medium: 'Ausgewogen',
      high: 'Premium',
    },
    style: 'Anbaustil',
    styles: {
      beginner: 'Anfängerfreundlich',
      balanced: 'Ausgewogen',
      yield: 'Ertragsmaximierung',
    },
    generate: 'Setup generieren',
    resultsTitle: 'Deine persönliche Setup-Empfehlung',
    resultsSubtitle: 'Für: {area} Fläche, {budget} Budget, {style} Stil',
    categories: {
      tent: 'Zelt',
      light: 'Beleuchtung',
      ventilation: 'Belüftung',
      pots: 'Töpfe',
      soil: 'Erde/Substrat',
      nutrients: 'Nährstoffe',
      extra: 'Extras',
    },
    total: 'Gesamtkosten',
    costBreakdown: 'Kostenaufstellung',
    tryAgain: 'Erneut versuchen',
    startOver: 'Neu starten',
    saveSetup: 'Setup speichern',
    setupNamePrompt: 'Wie möchtest du dieses Setup nennen?',
    setupSaveSuccess: 'Setup "{name}" erfolgreich gespeichert!',
    setupNameBudgets: {
      low: 'Preiswert',
      medium: 'Ausgewogen',
      high: 'Premium',
    },
    setups: {
      '1': {
        standard: {
          title: 'Einsteiger-Solo',
          description: 'Ein budgetfreundliches, einfaches Setup, perfekt für den ersten Grow einer einzelnen Pflanze.',
          prompt: 'Erstelle ein anfängerfreundliches, preisgünstiges Grow-Setup für eine einzelne Cannabispflanze auf 60x60cm.'
        },
        medium: {
          title: 'Ausgewogener Solist',
          description: 'Ein hochwertiges Setup mit Fokus auf Effizienz und Ertrag für eine einzelne Pflanze.',
          prompt: 'Erstelle ein ausgewogenes Grow-Setup für eine einzelne Cannabispflanze auf 80x80cm.'
        },
        premium: {
          title: 'Boutique-Einzelstück',
          description: 'Ein High-End-Setup für maximale Qualität und Kontrolle über eine einzelne Pflanze.',
          prompt: 'Erstelle ein Premium-Grow-Setup für eine einzelne Cannabispflanze auf 60x60cm, mit Fokus auf höchste Qualität und Ertrag.'
        }
      },
      '2': {
        standard: {
          title: 'Effizientes Duo',
          description: 'Ein solides Setup für den Anbau von zwei Pflanzen mit gutem Preis-Leistungs-Verhältnis.',
          prompt: 'Erstelle ein anfängerfreundliches, preisgünstiges Grow-Setup für zwei Cannabispflanzen auf einer Fläche von 80x80cm oder 120x60cm.'
        },
        medium: {
          title: 'Dynamisches Duo',
          description: 'Ein optimiertes Setup für zwei Pflanzen, das auf höhere Erträge und bessere Qualität abzielt.',
          prompt: 'Erstelle ein ausgewogenes Grow-Setup für zwei Cannabispflanzen auf 100x100cm.'
        },
        premium: {
          title: 'High-Tech-Zwillinge',
          description: 'Das Nonplusultra-Setup für zwei Pflanzen mit modernster Technologie für maximale Ergebnisse.',
          prompt: 'Erstelle ein Premium-Grow-Setup für zwei Cannabispflanzen auf einer Fläche von 80x80cm oder 120x60cm, mit Fokus auf maximale Qualität und Ertrag.'
        }
      },
      '3': {
        standard: {
          title: 'Produktives Trio',
          description: 'Ein kosteneffizientes Setup, um den Ertrag von drei Pflanzen zu maximieren.',
          prompt: 'Erstelle ein anfängerfreundliches, preisgünstiges Grow-Setup für drei Cannabispflanzen auf einer Fläche von 100x100cm.'
        },
        medium: {
          title: 'Power-Trio',
          description: 'Ein leistungsstarkes Setup für drei Pflanzen, das fortschrittliche Komponenten für beeindruckende Ernten kombiniert.',
          prompt: 'Erstelle ein ausgewogenes Grow-Setup für drei Cannabispflanzen auf 120x120cm.'
        },
        premium: {
          title: 'Kommerzielle Klasse',
          description: 'Ein professionelles Setup für drei Pflanzen, ausgelegt für maximale Erträge, Qualität und Automatisierung.',
          prompt: 'Erstelle ein Premium-Grow-Setup für drei Cannabispflanzen auf einer Fläche von 120x120cm, mit Fokus auf maximale Qualität und Ertrag im kommerziellen Stil.'
        }
      }
    },
    details: {
      zelt: 'Zelt',
      beleuchtung: 'Licht',
      abluft: 'Abluft',
      toepfe: 'Töpfe',
      medium: 'Medium'
    },
    error: 'Fehler bei der Generierung der Empfehlung.'
  },
  calculators: {
    title: 'Rechner',
    ventilation: {
      title: 'Abluft-Rechner',
      description: 'Berechne die benötigte Leistung deines Abluftventilators (in m³/h), um eine optimale Umgebung zu gewährleisten.',
      width: 'Breite des Zeltes',
      depth: 'Tiefe des Zeltes',
      height: 'Höhe des Zeltes',
      lightWattage: 'Lampenleistung (LED)',
      lightWattageTooltip: 'Die Wärme deiner Lampe ist ein wichtiger Faktor. Gib hier die tatsächliche Leistungsaufnahme deiner LED-Lampe an.',
      carbonFilter: 'Aktivkohlefilter im Einsatz?',
      carbonFilterTooltip: 'Ein Filter erhöht den Luftwiderstand und erfordert ca. 25-40% mehr Leistung vom Lüfter.',
      result: 'Empfohlene Lüfterleistung',
    },
    light: {
      title: 'Licht-Rechner',
      description: 'Schätze die benötigte LED-Lampenleistung (in Watt) für deine Anbaufläche und die aktuelle Wachstumsphase deiner Pflanze.',
      width: 'Breite der Fläche',
      depth: 'Tiefe der Fläche',
      stage: 'Wachstumsphase',
      result: 'Empfohlene LED-Leistung',
      ppfdTooltip: 'PPFD (Photosynthetische Photonenflussdichte) misst die Menge an nutzbarem Licht, die auf deine Pflanzen trifft.',
      dliTooltip: 'DLI (Tägliche Lichtintegral) ist die Gesamtmenge an nutzbarem Licht, die deine Pflanzen über einen 24-Stunden-Zeitraum erhalten.'
    },
    cost: {
      title: 'Stromkosten-Rechner',
      description: 'Schätze die Stromkosten deines Grows pro Tag, Woche, Monat und für einen typischen 90-Tage-Zyklus.',
      lightPower: 'Lichtleistung',
      lightHours: 'Lichtstunden',
      fanPower: 'Lüfterleistung',
      fanHours: 'Lüfterstunden',
      otherPower: 'Sonstige Verbraucher',
      price: 'Strompreis',
      daily: 'Täglich',
      weekly: 'Wöchentlich',
      monthly: 'Monatlich',
      cycle: 'Pro Zyklus',
      cycleSub: '(ca. 90 Tage)',
    },
    nutrients: {
      title: 'Nährstoff-Rechner',
      description: 'Berechne die benötigte Menge jeder Nährstoffkomponente für dein Wasserreservoir.',
      reservoir: 'Wasserreservoir-Größe',
      component: 'Komponente',
      dose: 'Dosis',
      totalFor: 'Gesamt für',
      componentName: 'Komp. {count}',
      addComponent: 'Komponente hinzufügen',
    },
    converter: {
      title: 'EC/PPM-Umrechner',
      description: 'Wandle zwischen EC (Elektrische Leitfähigkeit) und PPM (Parts Per Million) auf verschiedenen Skalen um.',
      resultInfo: 'Ändere einen Wert, um die anderen automatisch umzurechnen.',
      ec: 'EC (mS/cm)',
      ppm500: 'PPM (500er Skala)',
      ppm700: 'PPM (700er Skala)',
    },
    yield: {
      title: 'Ertrags-Rechner',
      description: 'Erhalte eine grobe Schätzung deines potenziellen Ertrags basierend auf deiner Lampenleistung und Erfahrung.',
      wattage: 'LED-Leistung',
      level: 'Erfahrungslevel',
      levels: {
        beginner: 'Anfänger',
        advanced: 'Fortgeschritten',
        expert: 'Experte',
      },
      training: 'Trainingstechnik',
      trainings: {
        none: 'Keine',
        lst: 'LST (Low Stress Training)',
        scrog: 'SCROG (Screen of Green)',
      },
      result: 'Geschätzter Ertrag',
      efficiency: 'Effizienz',
    },
    yes: 'Ja',
    no: 'Nein',
  },
  savedSetups: {
    title: 'Gespeicherte Setups',
    noSetups: {
      title: 'Keine Setups gespeichert',
      subtitle: 'Nutze den KI-Konfigurator, um dein erstes Setup zu erstellen und zu speichern.',
    },
    deleteConfirm: 'Möchtest du dieses Setup wirklich löschen?',
    editTitle: 'Setup bearbeiten',
    pdfReport: {
      setup: 'Setup-Bericht',
      createdAt: 'Erstellt am',
      item: 'Komponente',
      product: 'Produkt',
      rationale: 'Begründung',
      price: 'Preis',
      category: 'Kategorie',
    },
    exportTitle: 'Gespeicherte Setups Export',
  },
  growShops: {
    title: 'Empfohlene Grow Shops',
    strengths: 'Stärken',
    shipping: 'Versand',
    paymentMethods: 'Zahlungsmethoden',
    region: {
      europe: 'Europa',
      usa: 'USA',
    },
    european: {
      title: 'Top Grow Shops in Europa',
      shopKeys: ['grow-guru', 'grow-shop-24', 'growmart'],
    },
    us: {
      title: 'Top Grow Shops in den USA',
      shopKeys: ['grow-generation', 'hydrobuilder', 'htg-supply'],
    },
    shops: {
      'grow-guru': {
        name: 'Grow Guru',
        location: 'Deutschland',
        rating: 4.8,
        description: 'Ein hoch bewerteter deutscher Shop, bekannt für seine exzellente Auswahl an hochwertigen Marken wie Sanlight und Lumatek sowie für seinen schnellen und diskreten Versand.',
        strengths: ['Exzellenter Kundenservice', 'Große Auswahl an Premium-Marken', 'Schneller Versand in ganz Europa'],
        shipping: 'Europaweit',
        paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
        url: 'https://www.grow-guru.com/',
      },
      'grow-shop-24': {
        name: 'Grow-Shop24',
        location: 'Deutschland',
        rating: 4.6,
        description: 'Bietet eine breite Palette an Produkten für alle Budgets, von Einsteiger-Kits bis hin zu professioneller Ausrüstung. Bekannt für wettbewerbsfähige Preise und häufige Angebote.',
        strengths: ['Gutes Preis-Leistungs-Verhältnis', 'Breites Sortiment', 'Regelmäßige Rabattaktionen'],
        shipping: 'Europaweit',
        paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
        url: 'https://www.grow-shop24.de/',
      },
      'growmart': {
        name: 'Growmart',
        location: 'Deutschland',
        rating: 4.7,
        description: 'Ein etablierter Shop mit einem starken Fokus auf Nachhaltigkeit und Bio-Anbau. Sie bieten eine große Auswahl an organischen Düngemitteln und Erden.',
        strengths: ['Fokus auf Bio- & nachhaltige Produkte', 'Sehr informative Website & Blog', 'Gute Auswahl an Komplettsets'],
        shipping: 'Europaweit',
        paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
        url: 'https://www.growmart.de/',
      },
      'grow-generation': {
        name: 'GrowGeneration',
        location: 'USA',
        rating: 4.9,
        description: 'Einer der größten hydroponischen Einzelhändler in den USA mit Ladengeschäften und einem umfangreichen Online-Shop. Führt alle großen Marken und bietet alles vom Hobby- bis zum kommerziellen Maßstab.',
        strengths: ['Riesige Auswahl', 'Physische Standorte', 'Kommerzielle Lösungen verfügbar'],
        shipping: 'USA',
        paymentMethods: ['credit_card', 'paypal'],
        url: 'https://growgeneration.com/',
      },
      'hydrobuilder': {
        name: 'Hydrobuilder',
        location: 'USA',
        rating: 4.8,
        description: 'Ein Online-Superstore für Grow-Ausrüstung, der für seinen exzellenten Kundenservice und seine detaillierten Produktinformationen bekannt ist. Bietet oft Paketangebote und kostenlosen Versand.',
        strengths: ['Hervorragender Kundenservice', 'Kostenloser Versand bei vielen Artikeln', 'Umfassende Produktleitfäden'],
        shipping: 'USA',
        paymentMethods: ['credit_card', 'paypal', 'crypto'],
        url: 'https://hydrobuilder.com/',
      },
      'htg-supply': {
        name: 'HTG Supply',
        location: 'USA',
        rating: 4.7,
        description: 'HTG Supply ist bekannt für seine große Auswahl an Eigenmarkenprodukten, die eine kostengünstige Alternative zu teureren Marken bieten. Sie haben auch physische Standorte an der Ostküste.',
        strengths: ['Gute Auswahl an Eigenmarken', 'Wettbewerbsfähige Preise', 'Hilfsbereites und sachkundiges Personal'],
        shipping: 'USA',
        paymentMethods: ['credit_card', 'paypal'],
        url: 'https://www.htgsupply.com/',
      },
    },
    selectShopTitle: 'Shop auswählen',
    selectShopSubtitle: 'Wähle einen Shop aus der Liste, um Details anzuzeigen.',
    visitShop: '{shopName} besuchen',
  }
};