import type { AppSettings, JournalEntry, Plant, Task } from '@/types'
import { JournalEntryType } from '@/types'

const isWithinQuietHours = (start: string, end: string, now = new Date()): boolean => {
    const [startHour = 0, startMinute = 0] = start.split(':').map(Number)
    const [endHour = 0, endMinute = 0] = end.split(':').map(Number)
    if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) {
        return false
    }

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    if (startMinutes === endMinutes) {
        return true
    }

    if (startMinutes < endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes
}

const showBrowserNotification = async (
    title: string,
    body: string,
    tag: string,
    plantId: string,
): Promise<void> => {
    if (
        typeof window === 'undefined' ||
        !('Notification' in window) ||
        Notification.permission !== 'granted'
    ) {
        return
    }

    const registration = await navigator.serviceWorker.getRegistration().catch(() => undefined)
    if (registration) {
        await registration.showNotification(title, {
            body,
            icon: registration.scope + 'icon.svg',
            badge: registration.scope + 'icon.svg',
            tag,
            data: { plantId },
        })
        return
    }

    new Notification(title, { body, tag })
}

const areNotificationsMuted = (settings: AppSettings): boolean => {
    const quietHoursEnabled = settings.notifications.quietHours.enabled
    return (
        quietHoursEnabled &&
        isWithinQuietHours(
            settings.notifications.quietHours.start,
            settings.notifications.quietHours.end,
        )
    )
}

const findStageChangeEntry = (entries: JournalEntry[]): JournalEntry | undefined =>
    entries.find(
        (entry) =>
            entry.type === JournalEntryType.System && entry.notes.startsWith('Stage changed'),
    )

export const notifyPlantEvents = async (
    settings: AppSettings,
    plant: Plant,
    filteredJournalEntries: JournalEntry[],
    newProblemEntries: JournalEntry[],
    filteredTasks: Task[],
): Promise<void> => {
    if (!settings.notifications.enabled || areNotificationsMuted(settings)) {
        return
    }

    const stageChangeEntry = findStageChangeEntry(filteredJournalEntries)
    if (settings.notifications.stageChange && stageChangeEntry) {
        await showBrowserNotification(
            plant.name,
            stageChangeEntry.notes,
            `stage-change-${plant.id}`,
            plant.id,
        )
    }

    if (
        settings.notifications.problemDetected &&
        newProblemEntries.length > 0 &&
        newProblemEntries[0]
    ) {
        await showBrowserNotification(
            plant.name,
            newProblemEntries[0].notes,
            `problem-${plant.id}`,
            plant.id,
        )
    }

    if (settings.notifications.newTask && filteredTasks.length > 0 && filteredTasks[0]) {
        await showBrowserNotification(
            plant.name,
            filteredTasks[0].title,
            `task-${plant.id}`,
            plant.id,
        )
    }
}
