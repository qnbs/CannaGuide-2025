export const equipmentView = {
  title: 'Ausrüstung',
  tabs: {
    configurator: 'Konfigurator',
    calculators: 'Rechner',
    setups: 'Meine Setups',
    growShops: 'Grow-Shops',
  },
  configurator: {
    title: 'Setup Konfigurator',
    subtitleNew: 'Wähle die Anzahl der Pflanzen und deine bevorzugte Konfiguration, um eine maßgeschneiderte Ausrüstungsliste zu erhalten.',
    step1TitleNew: 'Wie viele Pflanzen möchtest du anbauen?',
    step2TitleNew: 'Wähle deine Konfiguration',
    plantCount: '{count} Pflanze(n)',
    details: {
      zelt: 'Zelt',
      beleuchtung: 'Beleuchtung',
      abluft: 'Abluft',
      toepfe: 'Töpfe',
      medium: 'Medium',
    },
    setups: {
      '1': {
        standard: {
          title: 'Standard-Setup (Preis/Leistung)',
          description: 'Eine ausgewogene Konfiguration für Einsteiger, die gute Ergebnisse ohne hohe Anfangsinvestitionen anstreben.',
          prompt: 'Erstelle eine anfängerfreundliche Grow-Setup-Empfehlung für 1 Pflanze in einer 60x60x180cm Growbox. Die Beleuchtung sollte eine 100-120W LED sein. Die Abluft sollte ein AC-Lüfter mit ~145-180 m³/h sein. Der Topf sollte ein 15-19L Stofftopf sein. Das Medium ist Light-Mix Erde. Das Budget ist niedrig und preis-leistungsorientiert.'
        },
        medium: {
          title: 'Medium-Setup (Ausgewogen)',
          description: 'Ein Upgrade zum Standard-Setup mit besserer Beleuchtung und mehr Platz für höhere Qualität und Ertrag.',
          prompt: 'Erstelle eine Grow-Setup-Empfehlung für 1 Pflanze in einer 80x80x180cm Growbox. Die Beleuchtung sollte eine 150W LED sein. Die Abluft sollte ein AC-Lüfter mit ~220 m³/h sein. Der Topf sollte ein 19L Stofftopf sein. Das Medium ist All-Mix Erde. Das Budget ist mittel, mit Fokus auf ein gutes Gleichgewicht zwischen Kosten und Qualität.'
        },
        premium: {
          title: 'Premium-Setup (Maximale Kontrolle)',
          description: 'High-End-Komponenten für Züchter, die volle Kontrolle und maximale Qualität und Ertrag anstreben.',
          prompt: 'Erstelle eine High-End Grow-Setup-Empfehlung für 1 Pflanze in einer Premium 60x60x180cm Growbox. Die Beleuchtung sollte eine 150W High-End LED sein. Die Abluft sollte ein EC-Lüfter mit Controller und ~180-250 m³/h sein. Der Topf sollte ein 19-25L Stofftopf sein. Das Medium ist ein Coco/Perlite Mix. Das Budget ist hoch.'
        }
      },
      '2': {
        standard: {
          title: 'Standard-Setup (Preis/Leistung)',
          description: 'Eine solide Konfiguration für 2 Pflanzen, optimiert für gute Erträge und einfache Handhabung.',
          prompt: 'Erstelle eine Grow-Setup-Empfehlung für 2 Pflanzen in einer 80x80 oder 120x60cm Growbox. Die Beleuchtung sollte eine 200-240W LED sein. Die Abluft sollte ein AC-Lüfter mit ~220-280 m³/h sein. Töpfe: 2x 15-19L Stofftöpfe. Medium: All-Mix Erde. Das Budget ist niedrig und preis-leistungsorientiert.'
        },
        medium: {
            title: 'Medium-Setup (Ausgewogen)',
            description: 'Mehr Platz und eine stärkere Lampe für zwei Pflanzen, um das Ertragspotenzial deutlich zu steigern.',
            prompt: 'Erstelle eine Grow-Setup-Empfehlung für 2 Pflanzen in einer 100x100x200cm Growbox. Die Beleuchtung sollte eine 280-300W LED sein. Die Abluft sollte ein AC-Lüfter mit ~360 m³/h sein. Töpfe: 2x 25L Stofftöpfe. Medium: Coco/Perlite Mix. Das Budget ist mittel, mit Fokus auf hohen Ertrag.'
        },
        premium: {
          title: 'Premium-Setup (Maximale Kontrolle)',
          description: 'Fortgeschrittenes Setup für maximale Erträge und volle Kontrolle über die Umgebung von 2 Pflanzen.',
          prompt: 'Erstelle eine High-End Grow-Setup-Empfehlung für 2 Pflanzen in einer Premium 80x80 oder 120x60cm Growbox. Die Beleuchtung sollte eine 250-300W High-End LED sein. Die Abluft sollte ein EC-Lüfter mit Controller und ~280-360 m³/h sein. Töpfe: 2x 19-25L Stofftöpfe. Medium: Coco/Perlite oder ein Hydro-System. Das Budget ist hoch.'
        }
      },
      '3': {
        standard: {
          title: 'Standard-Setup (Preis/Leistung)',
          description: 'Eine effiziente Konfiguration für den Anbau von 3 Pflanzen mit Fokus auf einen hohen Gesamtertrag.',
          prompt: 'Erstelle eine Grow-Setup-Empfehlung für 3 Pflanzen in einer 100x100x200cm Growbox. Die Beleuchtung sollte eine 300-320W LED sein. Die Abluft sollte ein AC-Lüfter mit ~360 m³/h sein. Töpfe: 3x 19-25L Stofftöpfe. Medium: All-Mix oder Coco. Das Budget ist niedrig und preis-leistungsorientiert.'
        },
        medium: {
            title: 'Medium-Setup (Ausgewogen)',
            description: 'Ein größeres Zelt und eine stärkere Beleuchtung, um das volle Potenzial von drei Pflanzen auszuschöpfen.',
            prompt: 'Erstelle eine Grow-Setup-Empfehlung für 3 Pflanzen in einer 120x120x200cm Growbox. Die Beleuchtung sollte eine 400W LED sein. Die Abluft sollte ein EC-Lüfter mit ~400 m³/h sein. Töpfe: 3x 25L Stofftöpfe. Medium: Coco/Perlite. Das Budget ist mittel und auf Qualität und Kontrolle ausgerichtet.'
        },
        premium: {
          title: 'Premium-Setup (Maximale Kontrolle)',
          description: 'Ein großzügiges High-End-Setup für 3 Pflanzen, das auf maximale Qualität, Ertrag und Automatisierung ausgelegt ist.',
          prompt: 'Erstelle eine High-End Grow-Setup-Empfehlung für 3 Pflanzen in einer Premium 120x120x220cm Growbox. Die Beleuchtung sollte eine 450-500W Multi-Bar LED sein. Die Abluft sollte ein EC-Lüfter mit Controller, Schalldämpfer und ~400-500 m³/h sein. Töpfe: 3x 30-50L Stofftöpfe. Medium: Living Soil oder Coco. Das Budget ist hoch.'
        }
      }
    },
    generate: 'Setup generieren',
    resultsTitle: 'Deine persönliche Setup-Empfehlung',
    resultsSubtitle: 'Für deine {area}cm Fläche, mit einem {budget} Budget und dem Stil "{style}", ist dies eine von der KI generierte Konfiguration.',
    costBreakdown: 'Kostenaufschlüsselung',
    total: 'Gesamt',
    startOver: 'Neu starten',
    tryAgain: 'Erneut versuchen',
    saveSetup: 'Setup speichern',
    setupNamePrompt: 'Wie möchtest du dieses Setup nennen?',
    setupSaveConfirm: 'Möchtest du das Setup als "{name}" speichern?',
    setupSaveSuccess: 'Setup "{name}" erfolgreich gespeichert!',
    setupSaveError: 'Fehler beim Speichern des Setups.',
    categories: {
      tent: 'Growbox (Zelt)',
      light: 'Beleuchtung',
      ventilation: 'Abluftsystem',
      pots: 'Töpfe',
      soil: 'Erde & Substrat',
      nutrients: 'Dünger',
      extra: 'Zubehör',
    },
    rationaleModalTitle: 'Warum {category}?',
    budgets: {
      low: 'niedrigen',
      medium: 'mittleren',
      high: 'hohen',
    },
    styles: {
      beginner: 'Anfänger',
      balanced: 'Ausgewogen',
      yield: 'Ertrag',
    },
    setupNameBudgets: {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
    },
  },
  calculators: {
    ventilation: {
      title: 'Lüfter-Rechner',
      description: 'Berechne die benötigte Lüfterleistung (m³/h) für deine Growbox unter Berücksichtigung von Lichtwärme und Filtern.',
      width: 'Breite',
      depth: 'Tiefe',
      height: 'Höhe',
      result: 'Empfohlene Abluftleistung',
      lightWattage: 'Lichtleistung',
      lightWattageTooltip: 'Leistungsstarke Lampen erzeugen mehr Wärme und erfordern eine stärkere Belüftung.',
      carbonFilter: 'Aktivkohlefilter?',
      carbonFilterTooltip: 'Ein Aktivkohlefilter erhöht den Luftwiderstand und erfordert einen stärkeren Lüfter.',
    },
    light: {
      title: 'Licht-Rechner',
      description: 'Erhalte eine Watt-Empfehlung basierend auf PPFD- und DLI-Werten für das jeweilige Wachstumsstadium.',
      width: 'Breite',
      depth: 'Tiefe',
      result: 'Empfohlene LED-Leistung',
      stage: 'Wachstumsphase',
      ppfdTooltip: 'PPFD (Photosynthetische Photonenflussdichte) misst die Menge an nutzbarem Licht, die deine Pflanzen erreicht. Verschiedene Phasen haben unterschiedliche optimale Werte.',
      dliTooltip: 'DLI (Tägliches Lichtintegral) ist die Gesamtmenge an nutzbarem Licht, die eine Pflanze über einen 24-Stunden-Zeitraum erhält.',
    },
    cost: {
      title: 'Stromkosten-Rechner',
      description: 'Schätze die Stromkosten deines Grow-Setups über verschiedene Zeiträume.',
      lightPower: 'Lichtleistung',
      lightHours: 'Lichtstunden',
      fanPower: 'Lüfterleistung',
      fanHours: 'Lüfterstunden',
      otherPower: 'Sonstige Leistung',
      price: 'Strompreis',
      daily: 'Täglich',
      weekly: 'Wöchentlich',
      monthly: 'Monatlich',
      cycle: 'Pro Zyklus',
      cycleSub: '(~90 Tage)',
    },
    nutrients: {
      title: 'Nährstoff-Mixer',
      description: 'Berechne die richtige Düngermenge für deine Gießkanne für mehrere Komponenten.',
      waterAmount: 'Wassermenge',
      dose: 'Dosis',
      result: 'Benötigter Dünger',
      reservoir: 'Reservoir-Größe',
      component: 'Komponente',
      totalFor: 'Gesamt für Komp.',
    },
    converter: {
      title: 'PPM / EC Umrechner',
      description: 'Konvertiere zwischen EC (Elektrische Leitfähigkeit) und PPM (Teile pro Million) Skalen.',
      resultInfo: 'Werte werden automatisch umgerechnet, wenn du ein Feld änderst.',
    },
    yield: {
      title: 'Ertrags-Schätzer',
      description: 'Erhalte eine genauere Schätzung deines potenziellen Ertrags (g) basierend auf mehreren Faktoren.',
      wattage: 'Lichtleistung',
      level: 'Erfahrungslevel',
      levels: {
          beginner: 'Anfänger',
          advanced: 'Fortgeschritten',
          expert: 'Experte'
      },
      result: 'Geschätzter Ertrag',
      training: 'Trainingstechnik',
      trainings: {
        none: 'Keine',
        lst: 'LST',
        scrog: 'Topping/SCROG',
      },
      efficiency: 'Effizienz'
    },
    calculate: 'Berechnen',
    yes: 'Ja',
    no: 'Nein',
  },
  savedSetups: {
    title: 'Meine gespeicherten Setups',
    noSetups: {
      title: 'Keine gespeicherten Setups',
      subtitle: 'Wenn du eine Empfehlung aus dem Konfigurator speicherst, erscheint sie hier.',
    },
    inspect: 'Inspizieren',
    deleteConfirm: 'Möchtest du das Setup "{name}" wirklich endgültig löschen?',
    deleteSuccess: 'Setup "{name}" wurde gelöscht.',
    updateSuccess: 'Setup "{name}" wurde aktualisiert.',
    updateError: 'Fehler beim Aktualisieren des Setups.',
    exportConfirm: 'Möchtest du das Setup "{name}" wirklich als {format} exportieren?',
    exportSuccess: 'Setup "{name}" erfolgreich exportiert.',
    modal: {
      title: 'Setup-Details',
      editMode: 'Bearbeitungsmodus',
      saveChanges: 'Änderungen speichern',
      item: 'Komponente',
      price: 'Preis',
      rationale: 'Begründung',
    },
    pdfReport: {
      setup: 'Setup-Bericht',
      createdAt: 'Erstellt am',
      source: 'Quelle',
      budget: 'Budget',
      total: 'Gesamt',
      product: 'Produkt',
      rationale: 'Begründung',
      price: 'Preis (€)',
      item: 'Komponente',
    }
  },
  growShops: {
    title: 'Grow-Shops',
    intro: 'Auf Basis von Nutzerbewertungen, Forenempfehlungen und dem generellen Ruf in der Grower-Community haben sich über Jahre hinweg bestimmte Online-Shops als besonders seriös, zuverlässig und umfassend im Sortiment erwiesen. Hier ist eine Recherche der besten und naheliegendsten Online-Shops für Grow-Equipment, aufgeteilt nach Europa und den USA.',
    european: {
        title: 'Europäische Online-Shops (Fokus auf DACH-Region & EU-Versand)',
        description: 'Diese Shops sind meist in Deutschland, Österreich oder den Niederlanden ansässig und bekannt für schnellen, diskreten Versand innerhalb der EU. Die Zollabwicklung entfällt somit für Lieferungen innerhalb der Europäischen Union.',
        shopKeys: ['growmart', 'growshop24', 'growland', 'zamnesia'],
    },
    us: {
        title: 'US-amerikanische Online-Shops (Nordamerika)',
        description: 'Diese Shops sind die erste Anlaufstelle für Grower in den USA und Kanada. Sie zeichnen sich durch ein riesiges Sortiment aus, das oft auf den kommerziellen Markt ausgerichtet ist, aber auch Heimgrower bedient. Ein Versand nach Europa ist oft möglich, aber aufgrund von hohen Versandkosten, Zollgebühren und unterschiedlichen Netzspannungen (110V) bei Elektronikartikeln meist nicht sinnvoll.',
        shopKeys: ['acInfinity', 'growGen', 'growersHouse', 'htgSupply'],
    },
    importantNote: {
        title: 'Wichtiger Hinweis',
        content: 'Bevor Sie eine größere Bestellung aufgeben, empfiehlt es sich immer, die Preise zwischen den Top-Shops zu vergleichen und kurz nach aktuellen Erfahrungsberichten oder Bewertungen zu suchen.'
    },
    location: 'Standort',
    strengths: 'Stärken',
    idealFor: 'Ideal für',
    shipping: 'Versand',
    paymentMethods: 'Zahlungsmethoden',
    sortByName: 'Nach Name sortieren',
    sortByRating: 'Nach Bewertung sortieren',
    noResults: 'Keine Shops für die aktuelle Auswahl gefunden.',
    region: {
      europe: 'Europa',
      usa: 'USA'
    },
    shops: {
        growmart: {
            name: 'Growmart',
            url: 'https://www.growmart.de/',
            location: 'Deutschland (Hamburg)',
            description: 'Einer der größten und bekanntesten Online-Growshops in Europa. Sie gelten als extrem zuverlässig, haben einen hervorragenden Kundenservice und ein riesiges Sortiment, das von Einsteiger-Sets bis zu professionellem Equipment reicht. Besonders ihre Growbox-Komplettsets sind sehr beliebt und gut konfiguriert.',
            strengths: [
                'Sehr große Auswahl an Top-Marken (HOMEbox, SANlight, Lumatek, AC Infinity, BioBizz etc.).',
                'Schneller und sehr diskreter Versand mit DHL.',
                'Gute und ehrliche Produktbeschreibungen und oft hilfreiche Blogartikel.',
                'Sehr gute Erreichbarkeit des Kundenservice.'
            ],
            idealFor: 'Anfänger bis Profis, die eine "Alles aus einer Hand"-Lösung suchen.',
            rating: 4.9,
            shipping: 'Versendet EU-weit, sehr diskrete Verpackung',
            paymentMethods: ['credit_card', 'bank_transfer', 'crypto'],
            logo: 'growmart'
        },
        growshop24: {
            name: 'grow-shop24.de',
            url: 'https://www.grow-shop24.de/',
            location: 'Deutschland & Österreich',
            description: 'Ein weiterer sehr etablierter Shop mit einem extrem umfangreichen Sortiment. Sie sind bekannt für konkurrenzfähige Preise und führen oft auch Nischenprodukte, die man anderswo schwerer findet. Mit einer eigenen Domain für Österreich bedienen sie diesen Markt besonders gut.',
            strengths: [
                'Umfassendes Sortiment in allen Kategorien (Beleuchtung, Klima, Dünger).',
                'Führt alle gängigen Marken und oft auch preisgünstigere Alternativen.',
                'Häufig gute Angebote und Rabattaktionen.',
                'Zuverlässiger Versand und gute Bewertungen (z.B. bei Trusted Shops).'
            ],
            idealFor: 'Preisbewusste Käufer und Grower, die spezifische Produkte suchen.',
            rating: 4.7,
            shipping: 'Versendet EU-weit',
            paymentMethods: ['credit_card', 'bank_transfer'],
            logo: 'growshop24'
        },
        growland: {
            name: 'Growland',
            url: 'https://www.growland.net/',
            location: 'Deutschland (Berlin)',
            description: 'Growland hat sich ebenfalls einen Namen als seriöser und gut sortierter Händler gemacht. Sie überzeugen durch langjährige Erfahrung und einen professionellen Auftritt. Das Sortiment ist sorgfältig ausgewählt und deckt alle Bedürfnisse ab.',
            strengths: [
                'Übersichtlicher Online-Shop mit guter Filterfunktion.',
                'Fokus auf qualitativ hochwertige Marken.',
                'Bietet ebenfalls sehr gut abgestimmte Komplettsets an.',
                'Guter Kundensupport und schnelle Lieferung.'
            ],
            idealFor: 'Grower, die Wert auf eine kuratierte Auswahl und einen reibungslosen Bestellprozess legen.',
            rating: 4.8,
            shipping: 'Versendet EU-weit',
            paymentMethods: ['credit_card', 'bank_transfer', 'crypto'],
            logo: 'growland'
        },
        zamnesia: {
            name: 'Zamnesia',
            url: 'https://www.zamnesia.com/de/5-grow-shop',
            location: 'Niederlande',
            description: 'Zamnesia ist weit mehr als nur ein Seedshop. Ihr "Growshop"-Bereich ist extrem umfassend und bietet alles, was man für den Anbau benötigt. Als einer der größten Player in Europa ist ihre Logistik und Zuverlässigkeit auf einem sehr hohen Niveau.',
            strengths: [
                'Gigantische Auswahl, die auch Headshop- und Lifestyle-Produkte umfasst.',
                'Sehr schnelle Lieferung aus den Niederlanden in die gesamte EU.',
                'Exzellenter Ruf und eine riesige Community mit vielen Bewertungen.',
                'Möglichkeit, Samen und Equipment in einer einzigen Bestellung zu kombinieren.'
            ],
            idealFor: 'Grower, die auch an einer riesigen Auswahl an Genetik interessiert sind und alles aus einer Quelle beziehen möchten.',
            rating: 4.9,
            shipping: 'Versendet weltweit, sehr schnell innerhalb der EU',
            paymentMethods: ['credit_card', 'bank_transfer', 'crypto'],
            logo: 'zamnesia'
        },
        acInfinity: {
            name: 'AC Infinity',
            url: 'https://acinfinity.com/',
            location: 'USA (Kalifornien)',
            description: 'AC Infinity hat sich von einem Hersteller für Lüftungstechnik zu einem der beliebtesten One-Stop-Shops entwickelt. Sie verkaufen ihr eigenes, perfekt aufeinander abgestimmtes Ökosystem aus Zelten, Lüftern, Lampen und Controllern. Ihre Produkte gelten als extrem innovativ, hochwertig und benutzerfreundlich.',
            strengths: [
                'Perfekt integriertes System (Controller steuern Lüfter, Licht, etc.).',
                'Sehr hohe Produktqualität und durchdachtes Design.',
                'Hervorragender Kundenservice und eine starke Community.',
                'Kauf direkt vom Hersteller.'
            ],
            idealFor: 'Technikaffine Grower, die ein smartes, automatisiertes und optisch ansprechendes Setup suchen.',
            rating: 4.9,
            shipping: 'Versendet hauptsächlich innerhalb Nordamerikas',
            paymentMethods: ['credit_card', 'paypal'],
            logo: 'acInfinity'
        },
        growGen: {
            name: 'GrowGeneration (GrowGen)',
            url: 'https://growgeneration.com/',
            location: 'USA (landesweite Kette)',
            description: 'GrowGen ist die größte Kette von hydroponischen Fachgeschäften in den USA und betreibt auch einen massiven Online-Shop. Sie sind an der Börse notiert und bedienen sowohl kleine Heimgrower als auch riesige kommerzielle Anlagen. Ihr Sortiment ist dementsprechend gewaltig.',
            strengths: [
                'Enorme Produktvielfalt von praktisch jeder erdenklichen Marke.',
                'Expertise im kommerziellen Anbau, was sich in der Produktauswahl widerspiegelt.',
                'Regelmäßige Verkäufe und professionelle Beratung.'
            ],
            idealFor: 'Grower jeder Größe, die die größte mögliche Auswahl suchen.',
            rating: 4.6,
            shipping: 'Versendet innerhalb der USA',
            paymentMethods: ['credit_card', 'paypal'],
            logo: 'growGen'
        },
        growersHouse: {
            name: 'GrowersHouse',
            url: 'https://growershouse.com/',
            location: 'USA (Arizona)',
            description: 'Ein weiterer sehr großer und seriöser Online-Händler, der für sein breites Sortiment und seine Expertise bekannt ist. Sie bieten detaillierte Produktvergleiche, Video-Reviews und eine starke Kundenberatung, die auch bei der Planung größerer Projekte hilft.',
            strengths: [
                'Große Auswahl an High-End-Marken (z.B. HLG, Gavita).',
                'Sehr informative Website mit vielen Ressourcen für Grower.',
                'Guter Ruf für Zuverlässigkeit und Kundenservice.'
            ],
            idealFor: 'Grower, die detaillierte Informationen und Vergleiche vor dem Kauf schätzen.',
            rating: 4.7,
            shipping: 'Versendet weltweit',
            paymentMethods: ['credit_card', 'crypto'],
            logo: 'growersHouse'
        },
        htgSupply: {
            name: 'HTG Supply',
            url: 'https://www.htgsupply.com/',
            location: 'USA (landesweite Kette)',
            description: 'HTG Supply ist einer der ältesten und etabliertesten Hydroponik-Shops in den USA. Sie haben sowohl eine starke Online-Präsenz als auch physische Geschäfte. Ihr Slogan "einer der schnellsten Versender der Branche" wird oft von Kunden bestätigt.',
            strengths: [
                'Breites Sortiment, das alle Grundlagen abdeckt.',
                'Bekannt für sehr schnellen Versand.',
                'Oft wettbewerbsfähige Preise und Eigenmarken.'
            ],
            idealFor: 'Grower, die eine schnelle und unkomplizierte Lieferung benötigen.',
            rating: 4.5,
            shipping: 'Versendet innerhalb der USA',
            paymentMethods: ['credit_card', 'paypal'],
            logo: 'htgSupply'
        }
    }
  },
};