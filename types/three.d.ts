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

    type PlaneGeometry = any
    type BoxGeometry = any
    type BufferGeometry = any
    type BufferAttribute = any
    type PointsMaterial = any
    type Points = any
    type PointLight = any
    type FogExp2 = any
    type Vector3 = any

    export const PlaneGeometry: any
    export const BoxGeometry: any
    export const BufferGeometry: any
    export const BufferAttribute: any
    export const PointsMaterial: any
    export const Points: any
    export const PointLight: any
    export const FogExp2: any
    export const Vector3: any
    export const DoubleSide: any
    export const ACESFilmicToneMapping: any
}

declare module 'three/examples/jsm/webxr/ARButton.js' {
    export const ARButton: {
        createButton(renderer: unknown, options?: Record<string, unknown>): HTMLButtonElement
    }
}
