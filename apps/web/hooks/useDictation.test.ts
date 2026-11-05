/**
 * useDictation.test.ts
 *
 * Unit tests for the useDictation hook.
 * Tests: SpeechRecognition lifecycle, transcript accumulation,
 * error handling, reset/stop behaviour.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, render } from '@testing-library/react'
import { createElement, Fragment, useLayoutEffect } from 'react'
import { isDictationSupported } from '@/hooks/useDictation'

// ---------------------------------------------------------------------------
// Mock i18n selector (selectLanguage -> 'en')
// ---------------------------------------------------------------------------

let mockLocalOnly = false

vi.mock('@/stores/store', () => ({
    useAppSelector: (selector: (s: unknown) => unknown) =>
        selector({
            settings: {
                settings: {
                    general: { language: 'en' },
                    privacy: { localOnlyMode: mockLocalOnly },
                },
            },
        }),
}))
vi.mock('@/stores/selectors', () => ({
    selectLanguage: (state: { settings: { settings: { general: { language: string } } } }) =>
        state.settings.settings.general.language,
    selectLocalOnlyMode: (state: {
        settings: { settings: { privacy: { localOnlyMode: boolean } } }
    }) => state.settings.settings.privacy.localOnlyMode,
}))

// ---------------------------------------------------------------------------
// Typed listener storage per instance
// ---------------------------------------------------------------------------

type ListenerFn = (event?: unknown) => void

type WindowWithSpeech = Window & { SpeechRecognition?: unknown }

type MockRecInstance = {
    continuous: boolean
    interimResults: boolean
    lang: string
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
    abort: ReturnType<typeof vi.fn>
    fire: (type: string, payload?: unknown) => void
}

const mockInstances: MockRecInstance[] = []

// ---------------------------------------------------------------------------
// Mock installation -- uses a class so `new` works correctly
// ---------------------------------------------------------------------------

function installMockSpeechRecognition() {
    mockInstances.length = 0

    class MockSpeechRecognition {
        continuous = false
        interimResults = false
        lang = ''
        private _listeners: Record<string, ListenerFn> = {}

        addEventListener(type: string, fn: ListenerFn) {
            this._listeners[type] = fn
        }
        removeEventListener(_type: string, _fn: ListenerFn) {
            /* no-op */
        }
        start = vi.fn()
        stop = vi.fn()
        abort = vi.fn()

        fire(type: string, payload?: unknown) {
            this._listeners[type]?.(payload)
        }

        constructor() {
            mockInstances.push(this as MockRecInstance)
        }
    }

    ;(window as WindowWithSpeech).SpeechRecognition = MockSpeechRecognition
}

function uninstallMockSpeechRecognition() {
    delete (window as WindowWithSpeech).SpeechRecognition
    mockInstances.length = 0
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('isDictationSupported', () => {
    it('returns a boolean', () => {
        expect(typeof isDictationSupported).toBe('boolean')
    })
})

describe('useDictation -- initial state', () => {
    it('starts with isListening=false', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())
        expect(result.current.isListening).toBe(false)
    })

    it('starts with empty transcript', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())
        expect(result.current.transcript).toBe('')
    })

    it('starts with null error', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())
        expect(result.current.error).toBeNull()
    })

    it('reset() is safe to call on fresh hook', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())
        expect(() =>
            act(() => {
                result.current.reset()
            }),
        ).not.toThrow()
    })

    it('stop() is safe to call when not started', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())
        expect(() =>
            act(() => {
                result.current.stop()
            }),
        ).not.toThrow()
    })
})

describe('useDictation -- with SpeechRecognition mock', () => {
    beforeEach(() => {
        installMockSpeechRecognition()
    })
    afterEach(() => {
        uninstallMockSpeechRecognition()
        vi.clearAllMocks()
    })

    it('sets isListening=true after start()', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())
        await act(async () => {
            result.current.start()
        })
        expect(result.current.isListening).toBe(true)
    })

    it('accumulates transcript from result events', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())
        await act(async () => {
            result.current.start()
        })

        const rec = mockInstances[0]
        expect(rec).toBeDefined()

        act(() => {
            rec!.fire('result', {
                results: {
                    length: 1,
                    0: {
                        isFinal: false,
                        length: 1,
                        0: { transcript: 'hello world', confidence: 0.9 },
                    },
                },
            })
        })
        expect(result.current.transcript).toBe('hello world')
    })

    it('calls onTranscript callback on final result', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const onTranscript = vi.fn()
        const { result } = renderHook(() => useDictation(onTranscript))
        await act(async () => {
            result.current.start()
        })

        const rec = mockInstances[0]
        act(() => {
            rec!.fire('result', {
                results: {
                    length: 1,
                    0: {
                        isFinal: true,
                        length: 1,
                        0: { transcript: 'final text', confidence: 0.9 },
                    },
                },
            })
        })
        expect(onTranscript).toHaveBeenCalledWith('final text')
    })

    it('sets isListening=false on end event', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())
        await act(async () => {
            result.current.start()
        })
        expect(result.current.isListening).toBe(true)
        const rec = mockInstances[0]
        act(() => {
            rec!.fire('end')
        })
        expect(result.current.isListening).toBe(false)
    })

    it('sets error=notAllowed on not-allowed error', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())
        await act(async () => {
            result.current.start()
        })
        const rec = mockInstances[0]
        act(() => {
            rec!.fire('error', { error: 'not-allowed' })
        })
        expect(result.current.error).toBe('notAllowed')
        expect(result.current.isListening).toBe(false)
    })

    it('sets error=noSpeech on no-speech error', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())
        await act(async () => {
            result.current.start()
        })
        const rec = mockInstances[0]
        act(() => {
            rec!.fire('error', { error: 'no-speech' })
        })
        expect(result.current.error).toBe('noSpeech')
    })

    it('reset() clears transcript and error', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())
        await act(async () => {
            result.current.start()
        })
        const rec = mockInstances[0]
        act(() => {
            rec!.fire('result', {
                results: {
                    length: 1,
                    0: {
                        isFinal: false,
                        length: 1,
                        0: { transcript: 'some text', confidence: 0.9 },
                    },
                },
            })
        })
        expect(result.current.transcript).toBe('some text')
        act(() => {
            result.current.reset()
        })
        expect(result.current.transcript).toBe('')
        expect(result.current.error).toBeNull()
    })

    it('stop() calls recognition.stop()', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())
        await act(async () => {
            result.current.start()
        })
        const rec = mockInstances[0]
        act(() => {
            result.current.stop()
        })
        expect(rec?.stop).toHaveBeenCalled()
    })
})

describe('useDictation -- lang mapping', () => {
    it('maps de to de-DE, other langs to en-US', () => {
        const mapLang = (lang: string) => (lang === 'de' ? 'de-DE' : 'en-US')
        expect(mapLang('de')).toBe('de-DE')
        expect(mapLang('en')).toBe('en-US')
        expect(mapLang('fr')).toBe('en-US')
        expect(mapLang('nl')).toBe('en-US')
    })
})

describe('useDictation -- Local-Only Mode (GH #717)', () => {
    beforeEach(() => {
        mockLocalOnly = false
        installMockSpeechRecognition()
    })

    afterEach(() => {
        mockLocalOnly = false
        uninstallMockSpeechRecognition()
    })

    it('does not start the browser recognizer and reports why', async () => {
        mockLocalOnly = true
        const { useDictation } = await import('@/hooks/useDictation')
        const { result } = renderHook(() => useDictation())

        act(() => {
            result.current.start()
        })

        expect(mockInstances).toHaveLength(0)
        expect(result.current.isListening).toBe(false)
        expect(result.current.error).toBe('localOnly')
    })

    it('switching the mode on stops a running dictation', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result, rerender } = renderHook(() => useDictation())
        act(() => {
            result.current.start()
        })
        const running = mockInstances[0]
        expect(result.current.isListening).toBe(true)

        mockLocalOnly = true
        rerender()

        expect(running?.abort).toHaveBeenCalled()
        expect(result.current.isListening).toBe(false)
        expect(result.current.error).toBe('localOnly')
    })

    it('stops dictation in the commit of the switch, so a queued result does not count', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const onTranscript = vi.fn()
        let api: ReturnType<typeof useDictation> | undefined
        const Host = () => {
            api = useDictation(onTranscript)
            return null
        }
        const atCommit = { aborted: false }
        // Rendered after Host: its layout effect runs after Host's layout effects
        // and before any passive effect.
        const Probe = ({ blocked }: { blocked: boolean }) => {
            useLayoutEffect(() => {
                if (!blocked) return
                const rec = mockInstances[0]
                atCommit.aborted = (rec?.abort.mock.calls.length ?? 0) > 0
                rec?.fire('result', {
                    results: [
                        Object.assign([{ transcript: 'late', confidence: 1 }], { isFinal: true }),
                    ],
                })
            }, [blocked])
            return null
        }
        const tree = (blocked: boolean) =>
            createElement(Fragment, null, createElement(Host), createElement(Probe, { blocked }))
        const view = render(tree(false))
        act(() => {
            api?.start()
        })

        mockLocalOnly = true
        view.rerender(tree(true))

        expect(atCommit.aborted).toBe(true)
        expect(onTranscript).not.toHaveBeenCalled()
        expect(api?.transcript).toBe('')
        view.unmount()
    })

    it('switching the mode on keeps the interim text that was dictated', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const onTranscript = vi.fn()
        const { result, rerender } = renderHook(() => useDictation(onTranscript))
        act(() => {
            result.current.start()
        })
        act(() => {
            mockInstances[0]?.fire('result', {
                results: [
                    Object.assign([{ transcript: 'half a note', confidence: 1 }], {
                        isFinal: false,
                    }),
                ],
            })
        })
        expect(onTranscript).not.toHaveBeenCalled()

        mockLocalOnly = true
        rerender()

        expect(onTranscript).toHaveBeenCalledWith('half a note')
    })

    it('a late aborted error or end from the stopped recognizer keeps the reason', async () => {
        const { useDictation } = await import('@/hooks/useDictation')
        const { result, rerender } = renderHook(() => useDictation())
        act(() => {
            result.current.start()
        })
        const running = mockInstances[0]
        mockLocalOnly = true
        rerender()

        act(() => {
            running?.fire('error', { error: 'aborted' })
            running?.fire('end')
        })

        expect(result.current.error).toBe('localOnly')
        expect(result.current.isListening).toBe(false)
    })
})
