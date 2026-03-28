export const legal = {
    ageGate: {
        title: 'Verificacion de Edad Requerida',
        subtitle: 'Esta aplicacion contiene contenido relacionado con el cultivo de cannabis.',
        body: 'Segun la Ley Alemana del Cannabis (KCanG), el acceso esta restringido a personas mayores de 18 anos. Al continuar, confirmas que tienes al menos 18 anos y que el cultivo de cannabis es legal en tu jurisdiccion.',
        confirm: 'Tengo 18 anos o mas',
        deny: 'Soy menor de 18 anos',
        denied: 'El acceso a esta aplicacion esta restringido a personas mayores de 18 anos.',
    },
    geoLegal: {
        title: 'Aviso Legal',
        body: 'Las leyes de cultivo de cannabis varian segun el pais y la region. Esta aplicacion esta disenada para uso en jurisdicciones donde el cultivo personal de cannabis es legal (p. ej., Alemania bajo KCanG). Siempre verifica las leyes aplicables en tu ubicacion antes de cultivar cannabis.',
        dismiss: 'Entiendo',
    },
    privacyPolicy: {
        title: 'Politica de Privacidad',
        lastUpdated: 'Ultima actualizacion: {{date}}',
        sections: {
            overview: {
                title: 'Resumen',
                content:
                    'CannaGuide 2025 es una aplicacion centrada en la privacidad. Todos tus datos se almacenan localmente en tu dispositivo. No operamos servidores que recopilen o almacenen tus datos personales.',
            },
            dataStorage: {
                title: 'Almacenamiento de Datos',
                content:
                    'Todos los registros de cultivo, datos de plantas, configuraciones y preferencias se almacenan exclusivamente en IndexedDB y localStorage de tu navegador. Ningun dato se transmite a nuestros servidores.',
            },
            aiServices: {
                title: 'Servicios de IA (Opcional)',
                content:
                    'Si eliges usar funciones de IA, tus consultas e imagenes subidas opcionalmente se envian directamente desde tu navegador al proveedor de IA que seleccionaste (p. ej., Google Gemini, OpenAI, Anthropic, xAI). Tu clave API se cifra localmente con AES-256-GCM y nunca sale de tu dispositivo sin cifrar. No tenemos acceso a tus claves API ni conversaciones de IA.',
            },
            imageProcessing: {
                title: 'Procesamiento de Imagenes',
                content:
                    'Las imagenes subidas para diagnostico de plantas con IA se recodifican via canvas para eliminar metadatos EXIF/GPS antes de la transmision. La subida de imagenes requiere tu consentimiento explicito.',
            },
            cookies: {
                title: 'Cookies y Almacenamiento Local',
                content:
                    'Esta aplicacion no usa cookies de rastreo. Usamos localStorage e IndexedDB unicamente para la funcionalidad de la app (configuraciones, datos de plantas, banderas de consentimiento). No se emplean analiticas ni rastreo de terceros.',
            },
            thirdParty: {
                title: 'Servicios de Terceros',
                content:
                    'Las unicas conexiones externas son: (1) Google Fonts para tipografia, (2) APIs de proveedores de IA si habilitas funciones de IA con tu propia clave API. Ningun dato se comparte con anunciantes o proveedores de analiticas.',
            },
            rights: {
                title: 'Tus Derechos (RGPD/DSGVO)',
                content:
                    'Dado que todos los datos se almacenan localmente, tienes control total. Puedes exportar todos los datos en Configuracion, o eliminar todos los datos borrando el almacenamiento de tu navegador. No es necesaria ninguna solicitud a nosotros.',
            },
            contact: {
                title: 'Contacto',
                content:
                    'Para preguntas relacionadas con la privacidad, abre un issue en el repositorio de GitHub del proyecto.',
            },
        },
    },
    consent: {
        title: 'Consentimiento de Privacidad',
        body: 'Esta aplicacion almacena datos localmente en tu dispositivo (IndexedDB y localStorage) para guardar tus plantas, configuraciones y registros de cultivo. Ningun dato se envia a servidores externos a menos que uses explicitamente funciones de IA con tu propia clave API.',
        accept: 'Aceptar y Continuar',
        learnMore: 'Politica de Privacidad',
        required: 'Se requiere consentimiento para usar esta aplicacion.',
    },
    impressum: {
        title: 'Aviso Legal (Impressum)',
        content:
            'CannaGuide 2025 es un proyecto de codigo abierto alojado en GitHub. Esta es una aplicacion educativa sin fines comerciales. No se requiere Impressum segun el paragrafo 5 TMG para proyectos privados no comerciales.',
    },
    imageConsent: {
        banner: 'La imagen sera enviada a tu proveedor de IA seleccionado para su analisis. Los metadatos EXIF/GPS se eliminan automaticamente antes de la transmision.',
        accept: 'Entiendo y consiento',
        accepted: 'Consentimiento otorgado',
        revoke: 'Revocar consentimiento de imagen',
        revoked:
            'Consentimiento de imagen revocado. Se te preguntara nuevamente antes de la proxima subida.',
    },
    medicalDisclaimer:
        'Esto no es consejo medico. Siempre consulta a un profesional cualificado para decisiones relacionadas con la salud.',
}
