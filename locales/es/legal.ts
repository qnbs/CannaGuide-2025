// Spanish (Espanol) -- legal namespace
import { legal as en } from '../en/legal'

export const legal = {
    ...en,
    ageGate: {
        title: 'Verificacion de edad requerida',
        subtitle: 'Esta aplicacion contiene contenido relacionado con el cultivo de cannabis.',
        body: 'Segun la Ley alemana de Cannabis (KCanG), el acceso esta restringido a personas mayores de 18 anos. Al continuar, confirmas que tienes al menos 18 anos y que el cultivo de cannabis es legal en tu jurisdiccion.',
        confirm: 'Tengo 18 anos o mas',
        deny: 'Soy menor de 18',
        denied: 'El acceso a esta aplicacion esta restringido a personas mayores de 18 anos.',
    },
    geoLegal: {
        title: 'Aviso legal',
        body: 'Las leyes de cultivo de cannabis varian segun el pais y la region. Esta aplicacion esta disenada para uso en jurisdicciones donde el cultivo personal de cannabis es legal (p. ej., Alemania bajo KCanG). Verifica siempre las leyes aplicables en tu ubicacion antes de cultivar cannabis.',
        dismiss: 'Entendido',
    },
    privacyPolicy: {
        title: 'Politica de privacidad',
        lastUpdated: 'Ultima actualizacion: {{date}}',
        sections: {
            overview: {
                title: 'Resumen',
                content:
                    'CannaGuide 2025 es una aplicacion que prioriza la privacidad. Todos tus datos se almacenan localmente en tu dispositivo. No operamos servidores que recopilen o almacenen tus datos personales.',
            },
            dataStorage: {
                title: 'Almacenamiento de datos',
                content:
                    'Todos los registros de cultivo, datos de plantas, ajustes y preferencias se almacenan exclusivamente en el IndexedDB y localStorage de tu navegador. No se transmiten datos a nuestros servidores.',
            },
            aiServices: {
                title: 'Servicios de IA (Opcional)',
                content:
                    'Si decides usar funciones de IA, tus consultas e imagenes opcionales se envian directamente desde tu navegador al proveedor de IA que seleccionaste (p. ej., Google Gemini, OpenAI, Anthropic, xAI). Tu clave API se cifra localmente con AES-256-GCM y nunca sale de tu dispositivo sin cifrar. No tenemos acceso a tus claves API ni a tus conversaciones de IA.',
            },
            imageProcessing: {
                title: 'Procesamiento de imagenes',
                content:
                    'Las imagenes subidas para diagnostico de plantas por IA se recodifican via canvas para eliminar metadatos EXIF/GPS antes de la transmision. La subida de imagenes requiere tu consentimiento explicito.',
            },
            cookies: {
                title: 'Cookies y almacenamiento local',
                content:
                    'Esta aplicacion no usa cookies de rastreo. Usamos localStorage e IndexedDB unicamente para funcionalidad de la aplicacion (ajustes, datos de plantas, indicadores de consentimiento). No se emplea analisis ni rastreo de terceros.',
            },
            thirdParty: {
                title: 'Servicios de terceros',
                content:
                    'Las unicas conexiones externas son: (1) Google Fonts para tipografia, (2) APIs de proveedores de IA si habilitas funciones de IA con tu propia clave API. No se comparten datos con anunciantes ni proveedores de analisis.',
            },
            rights: {
                title: 'Tus derechos (RGPD/DSGVO)',
                content:
                    'Como todos los datos se almacenan localmente, tienes control total. Puedes exportar todos los datos desde Ajustes, o eliminar todos los datos borrando el almacenamiento del navegador. No es necesario enviarnos ninguna solicitud.',
            },
            contact: {
                title: 'Contacto',
                content:
                    'Para preguntas relacionadas con la privacidad, abre un issue en el repositorio de GitHub del proyecto.',
            },
        },
    },
    consent: {
        title: 'Consentimiento de privacidad',
        body: 'Esta aplicacion almacena datos localmente en tu dispositivo (IndexedDB y localStorage) para guardar tus plantas, ajustes y registros de cultivo. No se envian datos a servidores externos a menos que uses funciones de IA con tu propia clave API.',
        accept: 'Aceptar y continuar',
        learnMore: 'Politica de privacidad',
        required: 'Se requiere consentimiento para usar esta aplicacion.',
    },
    impressum: {
        title: 'Aviso legal (Impressum)',
        content:
            'CannaGuide 2025 es un proyecto de codigo abierto alojado en GitHub. Esta es una aplicacion educativa no comercial. No se requiere Impressum segun el articulo 5 TMG para proyectos privados no comerciales.',
    },
    imageConsent: {
        banner: 'La imagen se enviara a tu proveedor de IA seleccionado para su analisis. Los metadatos EXIF/GPS se eliminan automaticamente antes de la transmision.',
        accept: 'Entiendo y doy mi consentimiento',
        accepted: 'Consentimiento otorgado',
        revoke: 'Revocar consentimiento de imagen',
        revoked:
            'Consentimiento de imagen revocado. Se te pedira de nuevo antes de la proxima subida.',
    },
    medicalDisclaimer:
        'Esto no es consejo medico. Consulta siempre a un profesional cualificado para decisiones relacionadas con la salud.',
}
