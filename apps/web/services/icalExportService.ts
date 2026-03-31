import type { GrowReminder } from '@/services/growReminderService'

const CRLF = '\r\n'
const PRODID = '-//CannaGuide 2025//Grow Calendar//EN'
const MAX_LINE_OCTETS = 75

const escapeICalText = (text: string): string =>
    text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r\n/g, '\\n')
        .replace(/\r/g, '\\n')
        .replace(/\n/g, '\\n')

/** RFC 5545 Section 3.1: fold content lines longer than 75 octets. */
const foldLine = (line: string): string => {
    if (line.length <= MAX_LINE_OCTETS) return line

    const parts: string[] = [line.slice(0, MAX_LINE_OCTETS)]
    let offset = MAX_LINE_OCTETS
    while (offset < line.length) {
        // Continuation lines start with a single space (counts toward 75 octets)
        parts.push(' ' + line.slice(offset, offset + MAX_LINE_OCTETS - 1))
        offset += MAX_LINE_OCTETS - 1
    }
    return parts.join(CRLF)
}

const formatICalDate = (timestamp: number): string => {
    const d = new Date(timestamp)
    const pad = (n: number): string => String(n).padStart(2, '0')
    return (
        d.getUTCFullYear().toString() +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) +
        'T' +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        pad(d.getUTCSeconds()) +
        'Z'
    )
}

const severityToAlarmMinutes: Record<GrowReminder['severity'], number> = {
    critical: 0,
    warning: 30,
    info: 60,
}

const buildVEvent = (reminder: GrowReminder): string => {
    const dtStart = formatICalDate(reminder.dueAt)
    const dtEnd = formatICalDate(reminder.dueAt + 30 * 60 * 1000)
    const alarmMinutes = severityToAlarmMinutes[reminder.severity]

    const lines = [
        'BEGIN:VEVENT',
        `UID:${reminder.id}@cannaguide`,
        `DTSTAMP:${formatICalDate(Date.now())}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${escapeICalText(reminder.title)}`,
        `DESCRIPTION:${escapeICalText(reminder.body)}`,
        `CATEGORIES:${reminder.type.toUpperCase()}`,
        `X-CANNAGUIDE-PLANT:${escapeICalText(reminder.plantName)}`,
        `X-CANNAGUIDE-SEVERITY:${reminder.severity}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICalText(reminder.title)}`,
        `TRIGGER:-PT${alarmMinutes}M`,
        'END:VALARM',
        'END:VEVENT',
    ]

    return lines.map(foldLine).join(CRLF)
}

export const generateICalString = (reminders: GrowReminder[]): string => {
    const header = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:${PRODID}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:CannaGuide Grow Calendar',
    ].join(CRLF)

    if (reminders.length === 0) {
        return header + CRLF + 'END:VCALENDAR' + CRLF
    }

    const events = reminders.map(buildVEvent).join(CRLF)

    return header + CRLF + events + CRLF + 'END:VCALENDAR' + CRLF
}

export const downloadICalFile = (
    reminders: GrowReminder[],
    filename = 'cannaguide-reminders.ics',
): void => {
    const icalContent = generateICalString(reminders)
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()

    // Cleanup
    setTimeout(() => {
        URL.revokeObjectURL(url)
        document.body.removeChild(anchor)
    }, 100)
}
