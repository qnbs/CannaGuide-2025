// Dutch (Nederlands) -- plants namespace
import { plantsView as en } from '../en/plants'

export const plantsView = {
    ...en,
    emptySlot: {
        title: 'Nieuwe kweek starten',
        subtitle: 'Klik om een ras te selecteren',
        subtitleInline: 'en een nieuwe kweekcyclus te beginnen.',
    },
    inlineSelector: {
        title: 'Een nieuwe kweek starten!',
        subtitle: 'Kies een leeg slot hieronder om je geselecteerd ras te planten:',
    },
    hero: {
        ...en.hero,
        badge: 'Tuin commandocentrum',
        description:
            'Live tuintelemetrie, plantgezondheid en bruikbare kweekworkflows in een gefocuste werkruimte.',
        slots: 'Slots',
        tasks: 'Taken',
        alerts: 'Waarschuwingen',
    },
    gardenVitals: {
        ...en.gardenVitals,
        title: 'Tuingezondheid',
    },
    journal: {
        ...en.journal,
    },
}
