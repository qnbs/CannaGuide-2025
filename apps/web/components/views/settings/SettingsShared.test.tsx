import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RangeSlider } from '@/components/common/RangeSlider'
import { Switch } from '@/components/common/Switch'
import { SettingsRow, SettingsSelect } from './SettingsShared'

describe('SettingsRow accessible names', () => {
    it('names a switch from the row label and does not label the wrapper', () => {
        const { container } = render(
            <SettingsRow label="Notifications">
                <Switch checked={false} onChange={() => undefined} />
            </SettingsRow>,
        )

        expect(screen.getByRole('switch', { name: 'Notifications' })).toBeInTheDocument()
        expect(container.querySelector('[aria-label]')).toBeNull()
    })

    it('keeps an explicit switch name', () => {
        render(
            <SettingsRow label="Notifications">
                <Switch checked={false} onChange={() => undefined} aria-label="Custom" />
            </SettingsRow>,
        )

        expect(screen.getByRole('switch', { name: 'Custom' })).toBeInTheDocument()
    })

    it('names a select from the row label', () => {
        render(
            <SettingsRow label="Language">
                <SettingsSelect
                    value="en"
                    options={[{ value: 'en', label: 'English' }]}
                    onChange={() => undefined}
                />
            </SettingsRow>,
        )

        expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument()
    })

    it('names an empty-label slider and its number field from the row', () => {
        render(
            <SettingsRow label="Rate">
                <RangeSlider
                    singleValue
                    label=""
                    unit="x"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={1}
                    onChange={() => undefined}
                />
            </SettingsRow>,
        )

        expect(screen.getByRole('slider', { name: 'Rate' })).toBeInTheDocument()
        expect(screen.getByRole('spinbutton', { name: 'Rate' })).toBeInTheDocument()
    })

    it('names a direct input from the row label', () => {
        render(
            <SettingsRow label="API key">
                <input type="password" />
            </SettingsRow>,
        )

        expect(screen.getByLabelText('API key')).toBeInTheDocument()
    })
})
