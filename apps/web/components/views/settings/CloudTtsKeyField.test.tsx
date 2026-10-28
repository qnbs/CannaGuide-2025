import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setSetting } from '@/stores/slices/settingsSlice'
import { cloudTtsKeyService } from '@/services/cloudTtsKeyService'
import { CloudTtsKeyField } from './CloudTtsKeyField'

// A synthetic canary, never a real key (#654).
const CANARY = 'sk_canary_0000000000000000000000000000'
const dispatch = vi.fn()

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
let legacyKey: string | null = null
vi.mock('@/stores/store', () => ({
    useAppDispatch: () => dispatch,
    useAppSelector: (select: (state: unknown) => unknown) =>
        select({ settings: { settings: { tts: { cloudTtsApiKey: legacyKey } } } }),
}))
vi.mock('@/services/cloudTtsKeyService', () => ({
    cloudTtsKeyService: {
        hasApiKey: vi.fn().mockResolvedValue(false),
        setApiKey: vi.fn().mockResolvedValue(undefined),
        clearApiKey: vi.fn().mockResolvedValue(undefined),
        resolveLegacyKey: vi.fn(),
    },
}))

describe('CloudTtsKeyField (#654)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        legacyKey = null
    })

    it('names the password field for assistive technology', async () => {
        render(<CloudTtsKeyField />)
        const field = screen.getByLabelText('settingsView.voice.cloudTts.apiKey')
        expect(field).toHaveAttribute('type', 'password')
        await waitFor(() => expect(cloudTtsKeyService.hasApiKey).toHaveBeenCalled())
    })

    it('saves to the key store and retires a pending legacy key', async () => {
        render(<CloudTtsKeyField />)
        fireEvent.change(screen.getByLabelText('settingsView.voice.cloudTts.apiKey'), {
            target: { value: CANARY },
        })
        fireEvent.click(screen.getByText('settingsView.security.save'))
        await waitFor(() => expect(cloudTtsKeyService.setApiKey).toHaveBeenCalledWith(CANARY))
        expect(cloudTtsKeyService.resolveLegacyKey).toHaveBeenCalled()
        expect(dispatch).toHaveBeenCalledWith(
            setSetting({ path: 'tts.cloudTtsApiKey', value: null }),
        )
        expect(await screen.findByText('settingsView.security.saved')).toBeInTheDocument()
        expect(screen.getByLabelText('settingsView.voice.cloudTts.apiKey')).toHaveValue('')
    })

    it('removing the key retires a pending legacy key too', async () => {
        vi.mocked(cloudTtsKeyService.hasApiKey).mockResolvedValueOnce(true)
        render(<CloudTtsKeyField />)
        const clear = screen.getByText('settingsView.security.clear')
        await waitFor(() => expect(clear).not.toBeDisabled())
        fireEvent.click(clear)
        await waitFor(() => expect(cloudTtsKeyService.clearApiKey).toHaveBeenCalled())
        expect(cloudTtsKeyService.resolveLegacyKey).toHaveBeenCalled()
        expect(dispatch).toHaveBeenCalledWith(
            setSetting({ path: 'tts.cloudTtsApiKey', value: null }),
        )
    })

    it('a failed save keeps any legacy key and reports the error', async () => {
        vi.mocked(cloudTtsKeyService.setApiKey).mockRejectedValueOnce(new Error('quota'))
        render(<CloudTtsKeyField />)
        fireEvent.change(screen.getByLabelText('settingsView.voice.cloudTts.apiKey'), {
            target: { value: CANARY },
        })
        fireEvent.click(screen.getByText('settingsView.security.save'))
        expect(await screen.findByText('settingsView.security.saveError')).toBeInTheDocument()
        expect(cloudTtsKeyService.resolveLegacyKey).not.toHaveBeenCalled()
        expect(dispatch).not.toHaveBeenCalled()
    })

    it('an unreadable key store shows "no key" without an unhandled rejection', async () => {
        vi.mocked(cloudTtsKeyService.hasApiKey).mockRejectedValueOnce(new Error('idb'))
        render(<CloudTtsKeyField />)
        expect(await screen.findByText('settingsView.security.notStored')).toBeInTheDocument()
    })

    it('a stale initial lookup does not overwrite a completed save (#711 review)', async () => {
        let resolveLookup: (stored: boolean) => void = () => undefined
        vi.mocked(cloudTtsKeyService.hasApiKey).mockReturnValueOnce(
            new Promise<boolean>((resolve) => {
                resolveLookup = resolve
            }),
        )
        render(<CloudTtsKeyField />)
        fireEvent.change(screen.getByLabelText('settingsView.voice.cloudTts.apiKey'), {
            target: { value: CANARY },
        })
        fireEvent.click(screen.getByText('settingsView.security.save'))
        expect(await screen.findByText('settingsView.security.saved')).toBeInTheDocument()
        await act(async () => resolveLookup(false))
        expect(screen.getByText('settingsView.security.stored')).toBeInTheDocument()
    })

    it('Clear removes a legacy key whose startup migration failed (#711 review)', async () => {
        legacyKey = CANARY
        render(<CloudTtsKeyField />)
        await waitFor(() => expect(cloudTtsKeyService.hasApiKey).toHaveBeenCalled())
        expect(screen.getByText('settingsView.security.stored')).toBeInTheDocument()
        const clear = screen.getByText('settingsView.security.clear')
        expect(clear).not.toBeDisabled()
        fireEvent.click(clear)
        await waitFor(() => expect(cloudTtsKeyService.clearApiKey).toHaveBeenCalled())
        expect(cloudTtsKeyService.resolveLegacyKey).toHaveBeenCalled()
        expect(dispatch).toHaveBeenCalledWith(
            setSetting({ path: 'tts.cloudTtsApiKey', value: null }),
        )
    })
})
