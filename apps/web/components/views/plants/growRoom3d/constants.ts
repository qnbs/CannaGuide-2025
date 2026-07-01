export const ASPECT_RATIO = 16 / 10
export const ROOM_WIDTH = 4
export const ROOM_DEPTH = 3
export const ROOM_HEIGHT = 2.5
export const MAX_PARTICLES = 120
export const MAX_PIXEL_RATIO = 2

export const getWebGLSupportError = (): string | null => {
    if (typeof document === 'undefined') {
        return 'WebGL is not available in this environment.'
    }

    try {
        const testCanvas = document.createElement('canvas')
        const contextOptions = { failIfMajorPerformanceCaveat: true }
        const context =
            testCanvas.getContext('webgl2', contextOptions) ??
            testCanvas.getContext('webgl', contextOptions) ??
            testCanvas.getContext('experimental-webgl', contextOptions)

        if (context) {
            return null
        }

        return 'This browser cannot create a WebGL context.'
    } catch {
        return 'This browser cannot create a WebGL context.'
    }
}
