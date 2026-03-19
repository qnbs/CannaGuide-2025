// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare module 'three' {
    type Group = any
    type Scene = any
    type PerspectiveCamera = any
    type WebGLRenderer = any
    type AmbientLight = any
    type DirectionalLight = any
    type Mesh = any
    type MeshStandardMaterial = any
    type CylinderGeometry = any
    type SphereGeometry = any
    type Color = any

    export const Group: any
    export const Scene: any
    export const PerspectiveCamera: any
    export const WebGLRenderer: any
    export const AmbientLight: any
    export const DirectionalLight: any
    export const Mesh: any
    export const MeshStandardMaterial: any
    export const CylinderGeometry: any
    export const SphereGeometry: any
    export const Color: any
}

declare module 'three/examples/jsm/webxr/ARButton.js' {
    export const ARButton: {
        createButton(renderer: unknown, options?: Record<string, unknown>): HTMLButtonElement
    }
}
