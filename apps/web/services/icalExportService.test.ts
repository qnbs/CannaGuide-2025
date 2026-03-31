import { describe, it, expect } from 'vitest'
import { generateICalString } from './icalExportService'
import type { GrowReminder } from './growReminderService'

const createReminder = (overrides: Partial<GrowReminder> = {}): GrowReminder => ({
    id: 'plant-1-vpd',
    plantId: 'plant-1',
    plantName: 'Northern Lights',
    type: 'vpd',
    title: 'VPD alarm for Northern Lights',
    body: 'Current VPD 0.40 kPa is outside 0.8-1.2 kPa.',
    severity: 'warning',
    dueAt: 1711900800000,
    ...overrides,
})

describe('icalExportService', () => {
    it('generates valid iCal structure', () => {
        const ical = generateICalString([createReminder()])

        expect(ical).toContain('BEGIN:VCALENDAR')
        expect(ical).toContain('END:VCALENDAR')
        expect(ical).toContain('VERSION:2.0')
        expect(ical).toContain('PRODID:-//CannaGuide 2025//Grow Calendar//EN')
        expect(ical).toContain('BEGIN:VEVENT')
        expect(ical).toContain('END:VEVENT')
    })

    it('includes reminder details in event', () => {
        const ical = generateICalString([createReminder()])

        expect(ical).toContain('SUMMARY:VPD alarm for Northern Lights')
        expect(ical).toContain('CATEGORIES:VPD')
        expect(ical).toContain('X-CANNAGUIDE-PLANT:Northern Lights')
        expect(ical).toContain('X-CANNAGUIDE-SEVERITY:warning')
    })

    it('includes VALARM for notifications', () => {
        const ical = generateICalString([createReminder()])

        expect(ical).toContain('BEGIN:VALARM')
        expect(ical).toContain('ACTION:DISPLAY')
        expect(ical).toContain('TRIGGER:-PT30M')
        expect(ical).toContain('END:VALARM')
    })

    it('uses correct alarm trigger for critical severity', () => {
        const ical = generateICalString([createReminder({ severity: 'critical' })])
        expect(ical).toContain('TRIGGER:-PT0M')
    })

    it('generates multiple events for multiple reminders', () => {
        const reminders = [
            createReminder({ id: 'r1', type: 'vpd' }),
            createReminder({ id: 'r2', type: 'watering', title: 'Watering reminder' }),
        ]
        const ical = generateICalString(reminders)

        const eventCount = (ical.match(/BEGIN:VEVENT/g) ?? []).length
        expect(eventCount).toBe(2)
    })

    it('escapes special characters in text', () => {
        const ical = generateICalString([createReminder({ title: 'Test; with, special\nchars' })])
        expect(ical).toContain('SUMMARY:Test\\; with\\, special\\nchars')
    })

    it('generates empty calendar for no reminders', () => {
        const ical = generateICalString([])

        expect(ical).toContain('BEGIN:VCALENDAR')
        expect(ical).toContain('END:VCALENDAR')
        expect(ical).not.toContain('BEGIN:VEVENT')
    })
})
