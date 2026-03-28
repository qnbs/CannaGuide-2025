// Spanish (Espanol) -- plants namespace
import { plantsView as en } from '../en/plants'

export const plantsView = {
    ...en,
    emptySlot: {
        title: 'Iniciar nuevo cultivo',
        subtitle: 'Haz clic para seleccionar una variedad',
        subtitleInline: 'y comenzar un nuevo ciclo de cultivo.',
    },
    inlineSelector: {
        title: 'Iniciando un nuevo cultivo!',
        subtitle: 'Elige un espacio vacio abajo para plantar tu variedad seleccionada:',
    },
    hero: {
        ...en.hero,
        badge: 'Centro de control del jardin',
        description:
            'Telemetria en vivo del jardin, salud de plantas y flujos de trabajo de cultivo en un espacio enfocado.',
        slots: 'Espacios',
        tasks: 'Tareas',
        alerts: 'Alertas',
    },
    gardenVitals: {
        ...en.gardenVitals,
        title: 'Salud del jardin',
    },
    journal: {
        ...en.journal,
    },
}
