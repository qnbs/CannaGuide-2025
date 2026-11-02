import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { createPlant } from './BreedingArPreview'

const bloomMeshes = (group: THREE.Group): THREE.Mesh[] =>
    group.children.filter((child): child is THREE.Mesh => {
        if (!(child instanceof THREE.Mesh)) return false
        if (!(child.geometry instanceof THREE.SphereGeometry)) return false
        return child.geometry.parameters.radius < 0.3
    })

const disposePlant = (group: THREE.Group): void => {
    group.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
            obj.material.forEach((material) => material.dispose())
            return
        }
        obj.material.dispose()
    })
}

describe('createPlant', () => {
    it('omits the resin bloom when resin is missing and keeps a zero-resin bloom', () => {
        const missing = createPlant(0, undefined, 1, 0)
        const reportedZero = createPlant(0, 0, 1, 0)
        expect(bloomMeshes(missing)).toHaveLength(0)
        expect(bloomMeshes(reportedZero)).toHaveLength(1)
        expect(missing.children.length).toBeGreaterThan(0)
        disposePlant(missing)
        disposePlant(reportedZero)
    })
})
