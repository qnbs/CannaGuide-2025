import * as THREE from 'three'
import type { Plant } from '@/types'
import { PlantStage } from '@/types'
import {
    MAX_PARTICLES,
    ROOM_DEPTH,
    ROOM_HEIGHT,
    ROOM_WIDTH,
} from './constants'
import { healthToLeafGreen, stageToHeight, vpdToColor } from './colorHelpers'

export const createPlant3D = (plant: Plant): THREE.Group => {
    const group = new THREE.Group()
    const height = stageToHeight(plant.stage, plant.age)
    const leafColor = healthToLeafGreen(plant.health)

    const potGeometry = new THREE.CylinderGeometry(0.18, 0.14, 0.2, 12)
    const potMaterial = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 })
    const pot = new THREE.Mesh(potGeometry, potMaterial)
    pot.position.y = 0.1
    group.add(pot)

    const soilGeometry = new THREE.CylinderGeometry(0.17, 0.17, 0.04, 12)
    const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2518, roughness: 1.0 })
    const soil = new THREE.Mesh(soilGeometry, soilMaterial)
    soil.position.y = 0.21
    group.add(soil)

    if (plant.stage === PlantStage.Seed || plant.stage === PlantStage.Germination) {
        const sprout = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x7acc52 }),
        )
        sprout.position.y = 0.24
        group.add(sprout)
        return group
    }

    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.035, height, 8)
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.7 })
    const stem = new THREE.Mesh(stemGeometry, stemMaterial)
    stem.position.y = 0.22 + height / 2
    group.add(stem)

    const canopyLevels = plant.stage === PlantStage.Flowering ? 3 : 2
    for (let i = 0; i < canopyLevels; i++) {
        const radius = 0.12 + height * 0.2 - i * 0.03
        const leafGeometry = new THREE.SphereGeometry(radius, 12, 10)
        const leafMaterial = new THREE.MeshStandardMaterial({
            color: leafColor,
            roughness: 0.6,
        })
        const canopy = new THREE.Mesh(leafGeometry, leafMaterial)
        canopy.position.y = 0.22 + height * (0.5 + i * 0.2)
        canopy.scale.set(1, 0.7, 1)
        group.add(canopy)
    }

    if (plant.stage === PlantStage.Flowering) {
        const budCount = 5
        const budMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.85, 0.5, 0.55),
            roughness: 0.4,
        })
        for (let i = 0; i < budCount; i++) {
            const angle = (i / budCount) * Math.PI * 2
            const bud = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), budMaterial)
            bud.position.set(
                Math.cos(angle) * 0.08,
                0.22 + height * 0.85 + Math.sin(angle * 2.7) * 0.03,
                Math.sin(angle) * 0.08,
            )
            group.add(bud)
        }

        const cola = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), budMaterial)
        cola.position.y = 0.22 + height + 0.04
        group.add(cola)
    }

    return group
}

export const createGrowRoom = (): THREE.Group => {
    const group = new THREE.Group()

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 1.0 }),
    )
    floor.rotation.x = -Math.PI / 2
    group.add(floor)

    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x222244,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        roughness: 0.2,
        metalness: 0.8,
    })

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT), wallMaterial)
    backWall.position.set(0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2)
    group.add(backWall)

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), wallMaterial)
    leftWall.position.set(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0)
    leftWall.rotation.y = Math.PI / 2
    group.add(leftWall)

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), wallMaterial)
    rightWall.position.set(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0)
    rightWall.rotation.y = -Math.PI / 2
    group.add(rightWall)

    const lightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.06, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x333366 }),
    )
    lightPanel.position.set(0, ROOM_HEIGHT - 0.1, 0)
    group.add(lightPanel)

    const glowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.5),
        new THREE.MeshStandardMaterial({
            color: 0xffe4b5,
            emissive: 0xffe4b5,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.6,
        }),
    )
    glowPlane.position.set(0, ROOM_HEIGHT - 0.14, 0)
    glowPlane.rotation.x = -Math.PI / 2
    group.add(glowPlane)

    const duct = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.7 }),
    )
    duct.position.set(ROOM_WIDTH / 2 - 0.3, ROOM_HEIGHT - 0.25, -ROOM_DEPTH / 2 + 0.3)
    group.add(duct)

    return group
}

export const createAtmosphereParticles = (vpd: number): THREE.Points => {
    const count = Math.min(Math.round(30 + vpd * 40), MAX_PARTICLES)
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const randomBuffer = new Uint32Array(Math.max(1, count * 3))
    const cryptoApi = globalThis.crypto

    if (cryptoApi?.getRandomValues) {
        cryptoApi.getRandomValues(randomBuffer)
    }

    const randomUnit = (index: number): number => {
        if (!cryptoApi?.getRandomValues) return 0.5
        return (randomBuffer[index] ?? 0) / 0x1_0000_0000
    }

    for (let i = 0; i < count; i++) {
        const baseIndex = i * 3
        positions[baseIndex] = (randomUnit(baseIndex) - 0.5) * ROOM_WIDTH * 0.8
        positions[baseIndex + 1] = randomUnit(baseIndex + 1) * ROOM_HEIGHT * 0.6 + 0.3
        positions[baseIndex + 2] = (randomUnit(baseIndex + 2) - 0.5) * ROOM_DEPTH * 0.8
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const color = vpdToColor(vpd)
    const material = new THREE.PointsMaterial({
        size: 0.03,
        color,
        transparent: true,
        opacity: 0.4,
    })

    return new THREE.Points(geometry, material)
}

export const disposeScene = (scene: THREE.Scene, renderer: THREE.WebGLRenderer): void => {
    scene.traverse((obj) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) {
            mesh.geometry.dispose()
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose())
            } else {
                mesh.material.dispose()
            }
        }
    })
    renderer.dispose()
}
