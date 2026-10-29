import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setSetting } from '@/stores/slices/settingsSlice'
import { porcupineKeyService } from '@/services/porcupineKeyService'
import { cloudTtsKeyService } from '@/services/cloudTtsKeyService'
import { PorcupineKeyField } from './PorcupineKeyField'

// A synthetic canary, never a real key (#709).
const CANARY = 'pv_canary_0000000000000000000000000000'
const dispatch = vi.fn()
let legacyKey: string | null = null

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@/stores/store', () => ({
    useAppDispatch: () => dispatch,
    useAppSelector: (select: (state: unknown) => unknown) =>
        select({
            settings: {
                settings: {
                    tts: { cloudTtsApiKey: null },
                    voiceControl: { porcupineAccessKey: legacyKey },
                },
            },
        }),
}))
const { keyStoreMock } = vi.hoisted(() => ({
    keyStoreMock: () => ({
        hasApiKey: vi.fn().mockResolvedValue(false),
        setApiKey: vi.fn().mockResolvedValue(undefined),
        clearApiKey: vi.fn().mockResolvedValue(undefined),
        resolveLegacyKey: vi.fn(),
    }),
}))
vi.mock('@/services/porcupineKeyService', () => ({ porcupineKeyService: keyStoreMock() }))
vi.mock('@/services/cloudTtsKeyService', () => ({ cloudTtsKeyService: keyStoreMock() }))

describe('PorcupineKeyField (#709)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        legacyKey = null
    })

    it('names the password field for assistive technology', async () => {
        render(<PorcupineKeyField />)
        const field = screen.getByLabelText('settingsView.voice.wakeWord.accessKey')
        expect(field).toHaveAttribute('type', 'password')
        expect(field).toHaveValue('')
        await waitFor(() => expect(porcupineKeyService.hasApiKey).toHaveBeenCalled())
    })

    it('saves to the Porcupine key store only and retires its legacy value', async () => {
        render(<PorcupineKeyField />)
        fireEvent.change(screen.getByLabelText('settingsView.voice.wakeWord.accessKey'), {
            target: { value: CANARY },
        })
        fireEvent.click(screen.getByText('settingsView.security.save'))
        await waitFor(() => expect(porcupineKeyService.setApiKey).toHaveBeenCalledWith(CANARY))
        expect(cloudTtsKeyService.setApiKey).not.toHaveBeenCalled()
        expect(porcupineKeyService.resolveLegacyKey).toHaveBeenCalled()
        expect(dispatch).toHaveBeenCalledWith(
            setSetting({ path: 'voiceControl.porcupineAccessKey', value: null }),
        )
        expect(dispatch).not.toHaveBeenCalledWith(
            setSetting({ path: 'tts.cloudTtsApiKey', value: null }),
        )
        expect(await screen.findByText('settingsView.security.saved')).toBeInTheDocument()
    })

    it('Clear removes a legacy access key whose startup migration failed', async () => {
        legacyKey = CANARY
        render(<PorcupineKeyField />)
        await waitFor(() => expect(porcupineKeyService.hasApiKey).toHaveBeenCalled())
        expect(screen.getByText('settingsView.security.stored')).toBeInTheDocument()
        fireEvent.click(screen.getByText('settingsView.security.clear'))
        await waitFor(() => expect(porcupineKeyService.clearApiKey).toHaveBeenCalled())
        expect(dispatch).toHaveBeenCalledWith(
            setSetting({ path: 'voiceControl.porcupineAccessKey', value: null }),
        )
    })
})
