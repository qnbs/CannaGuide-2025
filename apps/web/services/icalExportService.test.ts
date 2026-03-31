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

    it('escapes carriage return characters', () => {
        const ical = generateICalString([createReminder({ body: 'Line1\r\nLine2\rLine3' })])
        expect(ical).toContain('DESCRIPTION:Line1\\nLine2\\nLine3')
    })

    it('generates empty calendar without double CRLF', () => {
        const ical = generateICalString([])

        expect(ical).toContain('BEGIN:VCALENDAR')
        expect(ical).toContain('END:VCALENDAR')
        expect(ical).not.toContain('BEGIN:VEVENT')
        // No double CRLF between header and footer
        expect(ical).not.toContain('\r\n\r\nEND:VCALENDAR')
    })

    it('folds lines longer than 75 octets per RFC 5545', () => {
        const longTitle = 'A'.repeat(100)
        const ical = generateICalString([createReminder({ title: longTitle })])

        // The folded line should contain CRLF + space continuation
        const summaryLine = `SUMMARY:${'A'.repeat(100)}`
        // Original line is 108 chars, should be folded
        expect(ical).not.toContain(summaryLine)
        // First chunk is 75 chars, continuation starts with space
        expect(ical).toContain('SUMMARY:' + 'A'.repeat(67))
        expect(ical).toContain('\r\n ' + 'A'.repeat(33))
    })
})
