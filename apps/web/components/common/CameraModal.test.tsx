import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CameraModal } from './CameraModal'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('./Modal', () => ({
    Modal: ({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) => (
        <div>
            {children}
            {footer}
        </div>
    ),
}))

interface FakeStream {
    stream: MediaStream
    stop: ReturnType<typeof vi.fn>
    stops: ReturnType<typeof vi.fn>[]
}

const createStream = (trackCount = 1): FakeStream => {
    const stops = Array.from({ length: trackCount }, () => vi.fn())
    const [stop] = stops
    if (!stop) throw new Error('A fake stream needs at least one track')
    const stream = {
        getTracks: () => stops.map((stop) => ({ stop })),
    } as unknown as MediaStream
    return { stream, stop, stops }
}

const deferredStream = () => {
    let resolve: (stream: MediaStream) => void = () => undefined
    const promise = new Promise<MediaStream>((resolvePromise) => {
        resolve = resolvePromise
    })
    return { promise, resolve }
}

describe('CameraModal stream lifecycle', () => {
    const getUserMedia = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        getUserMedia.mockReset()
        Object.defineProperty(navigator, 'mediaDevices', {
            configurable: true,
            value: { getUserMedia },
        })
    })

    it('acquires the camera once for one open session', async () => {
        const active = createStream()
        const unexpectedSecondRequest = deferredStream()
        getUserMedia
            .mockResolvedValueOnce(active.stream)
            .mockReturnValueOnce(unexpectedSecondRequest.promise)

        const view = render(<CameraModal isOpen onClose={vi.fn()} onCapture={vi.fn()} />)

        await act(async () => {
            await Promise.resolve()
            await Promise.resolve()
        })

        expect(getUserMedia).toHaveBeenCalledTimes(1)
        view.unmount()
        expect(active.stop).toHaveBeenCalledOnce()
    })

    it('stops a stream that resolves after the modal unmounts', async () => {
        const request = deferredStream()
        const late = createStream()
        getUserMedia.mockReturnValueOnce(request.promise)

        const view = render(<CameraModal isOpen onClose={vi.fn()} onCapture={vi.fn()} />)
        await waitFor(() => expect(getUserMedia).toHaveBeenCalledOnce())
        view.unmount()

        await act(async () => {
            request.resolve(late.stream)
            await request.promise
        })

        await waitFor(() => expect(late.stop).toHaveBeenCalledOnce())
    })

    it('stops every active track when the modal closes', async () => {
        const active = createStream(2)
        getUserMedia.mockResolvedValueOnce(active.stream)

        const view = render(<CameraModal isOpen onClose={vi.fn()} onCapture={vi.fn()} />)
        await waitFor(() => expect(getUserMedia).toHaveBeenCalledOnce())

        view.rerender(<CameraModal isOpen={false} onClose={vi.fn()} onCapture={vi.fn()} />)

        for (const stop of active.stops) expect(stop).toHaveBeenCalledOnce()
    })

    it('stops a retake stream that resolves after unmount', async () => {
        const active = createStream()
        const retakeRequest = deferredStream()
        const lateRetake = createStream()
        getUserMedia.mockResolvedValueOnce(active.stream).mockReturnValueOnce(retakeRequest.promise)
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            drawImage: vi.fn(),
        } as unknown as GPUCanvasContext)
        vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
            'data:image/jpeg;base64,Y2FtZXJh',
        )

        const view = render(<CameraModal isOpen onClose={vi.fn()} onCapture={vi.fn()} />)
        const video = view.container.querySelector('video')
        if (!video) throw new Error('Expected the camera preview video')
        Object.defineProperties(video, {
            videoHeight: { configurable: true, value: 720 },
            videoWidth: { configurable: true, value: 1280 },
        })
        const capture = await screen.findByRole('button', {
            name: 'plantsView.aiDiagnostics.capture',
        })
        await waitFor(() => expect(capture).toBeEnabled())

        fireEvent.click(capture)
        expect(active.stop).toHaveBeenCalledOnce()
        fireEvent.click(screen.getByRole('button', { name: 'plantsView.aiDiagnostics.retake' }))
        await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2))
        view.unmount()

        await act(async () => {
            retakeRequest.resolve(lateRetake.stream)
            await retakeRequest.promise
        })
        await waitFor(() => expect(lateRetake.stop).toHaveBeenCalledOnce())
    })

    it('stops every StrictMode stream on unmount', async () => {
        const first = createStream()
        const second = createStream()
        getUserMedia.mockResolvedValueOnce(first.stream).mockResolvedValueOnce(second.stream)

        const view = render(
            <React.StrictMode>
                <CameraModal isOpen onClose={vi.fn()} onCapture={vi.fn()} />
            </React.StrictMode>,
        )
        await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2))
        view.unmount()

        await waitFor(() => {
            expect(first.stop).toHaveBeenCalledOnce()
            expect(second.stop).toHaveBeenCalledOnce()
        })
    })

    it('stops an unready preview and offers a retry', async () => {
        const active = createStream()
        const replacement = createStream()
        getUserMedia.mockResolvedValueOnce(active.stream).mockResolvedValueOnce(replacement.stream)

        const view = render(<CameraModal isOpen onClose={vi.fn()} onCapture={vi.fn()} />)
        const capture = await screen.findByRole('button', {
            name: 'plantsView.aiDiagnostics.capture',
        })
        await waitFor(() => expect(capture).toBeEnabled())
        fireEvent.click(capture)

        expect(active.stop).toHaveBeenCalledOnce()
        expect(screen.getByRole('alert')).toHaveTextContent('plantsView.aiDiagnostics.cameraError')
        fireEvent.click(screen.getByRole('button', { name: 'common.errorBoundary.retry' }))
        await waitFor(() =>
            expect(document.querySelector('video')?.srcObject).toBe(replacement.stream),
        )
        view.unmount()
        expect(replacement.stop).toHaveBeenCalledOnce()
    })

    it.each(['drawImage', 'toDataURL'])(
        'recovers when %s throws during capture',
        async (method) => {
            const failed = createStream(2)
            const replacement = createStream(2)
            const image = 'data:image/jpeg;base64,Y2FtZXJh'
            const failure = new Error('Canvas capture failed')
            const drawImage = vi.fn()
            const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
                drawImage,
            } as unknown as GPUCanvasContext)
            const encode = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(image)
            const width = vi
                .spyOn(HTMLVideoElement.prototype, 'videoWidth', 'get')
                .mockReturnValue(1280)
            const height = vi
                .spyOn(HTMLVideoElement.prototype, 'videoHeight', 'get')
                .mockReturnValue(720)
            const onCapture = vi.fn()
            const onWindowError = vi.fn((event: ErrorEvent) => {
                if (event.error === failure) event.preventDefault()
            })
            window.addEventListener('error', onWindowError)
            getUserMedia
                .mockResolvedValueOnce(failed.stream)
                .mockResolvedValueOnce(replacement.stream)
            const operation = method === 'drawImage' ? drawImage : encode
            operation.mockImplementationOnce(() => {
                throw failure
            })

            try {
                const view = render(<CameraModal isOpen onClose={vi.fn()} onCapture={onCapture} />)
                const name = 'plantsView.aiDiagnostics.capture'
                const capture = screen.getByRole('button', { name })
                await waitFor(() => expect(capture).toBeEnabled())
                fireEvent.click(capture)

                for (const stop of failed.stops) expect(stop).toHaveBeenCalledOnce()
                expect(onWindowError).not.toHaveBeenCalled()
                expect(screen.getByRole('alert')).toHaveTextContent(
                    'plantsView.aiDiagnostics.cameraError',
                )
                expect(view.container.querySelector('video')).toBeInTheDocument()
                expect(onCapture).not.toHaveBeenCalled()

                fireEvent.click(screen.getByRole('button', { name: 'common.errorBoundary.retry' }))
                await waitFor(() =>
                    expect(view.container.querySelector('video')?.srcObject).toBe(
                        replacement.stream,
                    ),
                )
                expect(screen.queryByRole('alert')).not.toBeInTheDocument()
                fireEvent.click(screen.getByRole('button', { name }))

                for (const stop of replacement.stops) expect(stop).toHaveBeenCalledOnce()
                expect(screen.getByAltText('common.capturedImage')).toHaveAttribute('src', image)
                fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }))
                expect(onCapture).toHaveBeenCalledExactlyOnceWith(image)
            } finally {
                window.removeEventListener('error', onWindowError)
                context.mockRestore()
                encode.mockRestore()
                width.mockRestore()
                height.mockRestore()
            }
        },
    )
})
