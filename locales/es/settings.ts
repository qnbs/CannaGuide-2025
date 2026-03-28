// Spanish (Espanol) -- settings namespace
import { settingsView as en } from '../en/settings'

export const settingsView = {
    ...en,
    title: 'Ajustes',
    searchPlaceholder: 'Buscar ajustes...',
    saveSuccess: 'Ajustes guardados!',
    categories: {
        general: 'General e interfaz',
        strains: 'Vista de variedades',
        plants: 'Plantas y simulacion',
        notifications: 'Notificaciones',
        defaults: 'Valores predeterminados',
        data: 'Gestion de datos',
        about: 'Acerca de',
        tts: 'Voz y habla',
        privacy: 'Privacidad y seguridad',
        accessibility: 'Accesibilidad',
        lookAndFeel: 'Apariencia',
        interactivity: 'Interactividad',
        ai: 'Configuracion de IA',
    },
    security: {
        ...en.security,
        title: 'Seguridad IA (multi-modelo BYOK)',
        warning:
            'Tu clave API se almacena solo en este dispositivo en IndexedDB. Nunca compartas tu clave y eliminala en dispositivos compartidos.',
        provider: 'Proveedor de IA',
        providerDesc:
            'Selecciona el proveedor del modelo de IA. Cada proveedor requiere su propia clave API.',
        apiKey: 'Clave API',
        apiKeyDesc:
            'Requerida para todas las funciones de IA en esta implementacion de aplicacion estatica.',
        save: 'Guardar clave',
        test: 'Validar clave',
        clear: 'Eliminar clave',
        openAiStudio: 'Obtener clave API',
        stored: 'Una clave API esta guardada actualmente en este dispositivo.',
        notStored: 'Aun no se ha guardado ninguna clave API.',
        saved: 'Clave API guardada exitosamente.',
        cleared: 'Clave API eliminada.',
    },
    aiMode: {
        ...en.aiMode,
        title: 'Modo de ejecucion de IA',
    },
}
