export const legal = {
    ageGate: {
        title: 'Age Verification Required',
        subtitle: 'This application contains content related to cannabis cultivation.',
        body: 'Under the German Cannabis Act (KCanG), access is restricted to persons aged 18 and older. By continuing, you confirm that you are at least 18 years old and that cannabis cultivation is legal in your jurisdiction.',
        confirm: 'I am 18 or older',
        deny: 'I am under 18',
        denied: 'Access to this application is restricted to persons aged 18 and older.',
    },
    geoLegal: {
        title: 'Legal Notice',
        body: 'Cannabis cultivation laws vary by country and region. This app is designed for use in jurisdictions where personal cannabis cultivation is legal (e.g. Germany under KCanG). Always verify the laws applicable in your location before growing cannabis.',
        dismiss: 'I understand',
    },
    privacyPolicy: {
        title: 'Privacy Policy',
        lastUpdated: 'Last updated: {{date}}',
        sections: {
            overview: {
                title: 'Overview',
                content:
                    'CannaGuide 2025 is a privacy-first application. All your data is stored locally on your device. We do not operate servers that collect or store your personal data.',
            },
            dataStorage: {
                title: 'Data Storage',
                content:
                    "All grow logs, plant data, settings, and preferences are stored exclusively in your browser's IndexedDB and localStorage. No data is transmitted to our servers.",
            },
            aiServices: {
                title: 'AI Services (Optional)',
                content:
                    'If you choose to use AI features, your queries and optionally uploaded images are sent directly from your browser to the AI provider you selected (e.g. Google Gemini, OpenAI, Anthropic, xAI). Your API key is encrypted locally with AES-256-GCM and never leaves your device unencrypted. We have no access to your API keys or AI conversations.',
            },
            imageProcessing: {
                title: 'Image Processing',
                content:
                    'Images uploaded for AI plant diagnosis are re-encoded via canvas to strip EXIF/GPS metadata before transmission. Image upload requires your explicit consent.',
            },
            cookies: {
                title: 'Cookies & Local Storage',
                content:
                    'This app does not use tracking cookies. We use localStorage and IndexedDB solely for app functionality (settings, plant data, consent flags). No analytics or third-party tracking is employed.',
            },
            thirdParty: {
                title: 'Third-Party Services',
                content:
                    'Typography is bundled with the app. Optional features can contact these hosts: generativelanguage.googleapis.com, api.openai.com, api.x.ai, and api.anthropic.com when you enable AI with your own API key; huggingface.co, cdn-lfs.huggingface.co, cdn-lfs.hf.co, and huggingfaceusercontent.com plus cdn.jsdelivr.net when a local model or runtime is downloaded; api.elevenlabs.io when cloud text-to-speech is enabled. No data is shared with advertisers or analytics providers. Cloud sync is not enabled in this version.',
            },
            rights: {
                title: 'Your Rights (GDPR/DSGVO)',
                content:
                    'Since all data is stored locally, you have full control. You can export all data via Settings, or delete all data by clearing your browser storage. No request to us is necessary.',
            },
            contact: {
                title: 'Contact',
                content:
                    "For privacy-related questions, please open an issue on the project's GitHub repository.",
            },
        },
    },
    consent: {
        title: 'Privacy Consent',
        body: 'This app stores data locally on your device (IndexedDB & localStorage) to save your plants, settings, and grow logs. No data is sent to external servers unless you explicitly use AI features with your own API key.',
        accept: 'Accept & Continue',
        learnMore: 'Privacy Policy',
        required: 'Consent is required to use this app.',
    },
    // LEGAL_REVIEW_REQUIRED: DDG replaced section 5 TMG. This text does not decide whether an Impressum is mandatory.
    impressum: {
        title: 'Legal Notice (Impressum)',
        content:
            'CannaGuide 2025 is an open-source project hosted on GitHub. This is a non-commercial, educational application. Provider identification was previously described under section 5 TMG. That statute was replaced by the Digitale-Dienste-Gesetz (DDG). Whether this project must publish an Impressum is a legal question and is not decided by this application. Legal review is still required.',
    },
    imageConsent: {
        banner: 'The image will be sent to your selected AI provider for analysis. EXIF/GPS metadata is stripped automatically before transmission.',
        accept: 'I understand and consent',
        accepted: 'Consent given',
        revoke: 'Revoke image consent',
        revoked: 'Image consent revoked. You will be asked again before the next upload.',
    },
    medicalDisclaimer:
        'This is not medical advice. Always consult a qualified professional for health-related decisions.',
}
