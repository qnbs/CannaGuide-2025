export const legal = {
    ageGate: {
        title: 'Leeftijdsverificatie Vereist',
        subtitle: 'Deze applicatie bevat inhoud gerelateerd aan cannabisteelt.',
        body: 'Volgens de Duitse Cannabiswet (KCanG) is toegang beperkt tot personen van 18 jaar en ouder. Door verder te gaan, bevestig je dat je minstens 18 jaar oud bent en dat cannabisteelt legaal is in jouw rechtsgebied.',
        confirm: 'Ik ben 18 jaar of ouder',
        deny: 'Ik ben jonger dan 18 jaar',
        denied: 'Toegang tot deze applicatie is beperkt tot personen van 18 jaar en ouder.',
    },
    geoLegal: {
        title: 'Juridische Mededeling',
        body: 'Wetten voor cannabisteelt varieren per land en regio. Deze app is ontworpen voor gebruik in rechtsgebieden waar persoonlijke cannabisteelt legaal is (bijv. Duitsland onder KCanG). Controleer altijd de geldende wetten in jouw locatie voordat je cannabis kweekt.',
        dismiss: 'Ik begrijp het',
    },
    privacyPolicy: {
        title: 'Privacybeleid',
        lastUpdated: 'Laatst bijgewerkt: {{date}}',
        sections: {
            overview: {
                title: 'Overzicht',
                content:
                    'CannaGuide 2025 is een privacy-first applicatie. Al je gegevens worden lokaal op je apparaat opgeslagen. We beheren geen servers die je persoonlijke gegevens verzamelen of opslaan.',
            },
            dataStorage: {
                title: 'Gegevensopslag',
                content:
                    'Alle kweeklogs, plantgegevens, instellingen en voorkeuren worden uitsluitend opgeslagen in de IndexedDB en localStorage van je browser. Er worden geen gegevens naar onze servers verzonden.',
            },
            aiServices: {
                title: 'AI-Diensten (Optioneel)',
                content:
                    'Als je ervoor kiest om AI-functies te gebruiken, worden je vragen en optioneel geuploade afbeeldingen rechtstreeks vanuit je browser naar de door jou geselecteerde AI-provider gestuurd (bijv. Google Gemini, OpenAI, Anthropic, xAI). Je API-sleutel wordt lokaal versleuteld met AES-256-GCM en verlaat nooit onversleuteld je apparaat. We hebben geen toegang tot je API-sleutels of AI-gesprekken.',
            },
            imageProcessing: {
                title: 'Beeldverwerking',
                content:
                    'Afbeeldingen die worden geupload voor AI-plantdiagnose worden opnieuw gecodeerd via canvas om EXIF/GPS-metadata te verwijderen voor verzending. Het uploaden van afbeeldingen vereist je expliciete toestemming.',
            },
            cookies: {
                title: 'Cookies en Lokale Opslag',
                content:
                    'Deze app gebruikt geen trackingcookies. We gebruiken localStorage en IndexedDB uitsluitend voor app-functionaliteit (instellingen, plantgegevens, toestemmingsvlaggen). Er worden geen analytics of tracking van derden gebruikt.',
            },
            thirdParty: {
                title: 'Diensten van Derden',
                content:
                    "De enige externe verbindingen zijn: (1) Google Fonts voor typografie, (2) AI-provider API's als je AI-functies inschakelt met je eigen API-sleutel. Er worden geen gegevens gedeeld met adverteerders of analyticsproviders.",
            },
            rights: {
                title: 'Jouw Rechten (AVG/DSGVO)',
                content:
                    'Aangezien alle gegevens lokaal zijn opgeslagen, heb je volledige controle. Je kunt alle gegevens exporteren via Instellingen, of alle gegevens verwijderen door de browseropslag te wissen. Er is geen verzoek aan ons nodig.',
            },
            contact: {
                title: 'Contact',
                content:
                    'Voor privacygerelateerde vragen, open een issue op de GitHub-repository van het project.',
            },
        },
    },
    consent: {
        title: 'Privacytoestemming',
        body: 'Deze app slaat gegevens lokaal op je apparaat op (IndexedDB en localStorage) om je planten, instellingen en kweeklogs op te slaan. Er worden geen gegevens naar externe servers gestuurd tenzij je expliciet AI-functies gebruikt met je eigen API-sleutel.',
        accept: 'Accepteren en Doorgaan',
        learnMore: 'Privacybeleid',
        required: 'Toestemming is vereist om deze app te gebruiken.',
    },
    impressum: {
        title: 'Juridische Mededeling (Impressum)',
        content:
            'CannaGuide 2025 is een open-source project gehost op GitHub. Dit is een niet-commerciele, educatieve applicatie. Er is geen Impressum vereist volgens paragraaf 5 TMG voor niet-commerciele particuliere projecten.',
    },
    imageConsent: {
        banner: 'De afbeelding wordt naar je geselecteerde AI-provider gestuurd voor analyse. EXIF/GPS-metadata wordt automatisch verwijderd voor verzending.',
        accept: 'Ik begrijp het en geef toestemming',
        accepted: 'Toestemming gegeven',
        revoke: 'Beeldtoestemming intrekken',
        revoked: 'Beeldtoestemming ingetrokken. Je wordt opnieuw gevraagd voor de volgende upload.',
    },
    medicalDisclaimer:
        'Dit is geen medisch advies. Raadpleeg altijd een gekwalificeerde professional voor gezondheidsgerelateerde beslissingen.',
}
