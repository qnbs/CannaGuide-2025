import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PersistenceSettingsPanel } from './PersistenceSettingsPanel'
import { defaultSettings } from '@/stores/slices/settingsSlice'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/stores/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ settings: { settings: defaultSettings } }),
}))

describe('PersistenceSettingsPanel', () => {
    it('renders backup and persistence labels', () => {
        render(<PersistenceSettingsPanel />)
        expect(screen.getByText('settingsView.data.autoBackup')).toBeTruthy()
        expect(screen.getByText('settingsView.data.persistenceInterval')).toBeTruthy()
    })
})
