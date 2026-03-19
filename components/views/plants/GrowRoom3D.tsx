import React, { memo, useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { useAppSelector } from '@/stores/store'
import { selectActivePlants, selectGardenHealthMetrics } from '@/stores/selectors'
import { Plant, PlantStage } from '@/types'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 400
const ROOM_WIDTH = 4
const ROOM_DEPTH = 3
const ROOM_HEIGHT = 2.5

// ---------------------------------------------------------------------------
// Color helpers driven by VPD / plant health
// ---------------------------------------------------------------------------

const vpdToColor = (vpd: number): THREE.Color => {
    // 0.4–0.8: blue (too low), 0.8–1.2: green (optimal), 1.2–1.6: yellow-green, >1.6: red
    if (vpd < 0.8) return new THREE.Color().setHSL(0.55, 0.6, 0.4)
    if (vpd < 1.2) return new THREE.Color().setHSL(0.33, 0.7, 0.45)
    if (vpd < 1.6) return new THREE.Color().setHSL(0.2, 0.65, 0.45)
    return new THREE.Color().setHSL(0.0, 0.7, 0.45)
}

const healthToLeafGreen = (health: number): THREE.Color => {
    // health 0-100 → sick (yellow-brown) to healthy (vibrant green)
    const hue = 0.22 + (health / 100) * 0.12 // 0.22 (yellow)→0.34 (green)
    const sat = 0.4 + (health / 100) * 0.3
    const light = 0.25 + (health / 100) * 0.2
    return new THREE.Color().setHSL(hue, sat, light)
}

const stageToHeight = (stage: PlantStage, age: number): number => {
    switch (stage) {
        case PlantStage.Seed:
        case PlantStage.Germination:
            return 0.05
        case PlantStage.Seedling:
            return 0.15 + Math.min(age, 14) * 0.01
        case PlantStage.Vegetative:
            return 0.3 + Math.min(age, 60) * 0.015
        case PlantStage.Flowering:
            return 0.8 + Math.min(age, 70) * 0.005
        default:
            return 0.6
    }
}

// ---------------------------------------------------------------------------
// 3D plant model builder
// ---------------------------------------------------------------------------

const createPlant3D = (plant: Plant): THREE.Group => {
    const group = new THREE.Group()
    const height = stageToHeight(plant.stage, plant.age)
    const leafColor = healthToLeafGreen(plant.health)

    // Pot
    const potGeometry = new THREE.CylinderGeometry(0.18, 0.14, 0.2, 12)
    const potMaterial = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 })
    const pot = new THREE.Mesh(potGeometry, potMaterial)
    pot.position.y = 0.1
    group.add(pot)

    // Soil
    const soilGeometry = new THREE.CylinderGeometry(0.17, 0.17, 0.04, 12)
    const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2518, roughness: 1.0 })
    const soil = new THREE.Mesh(soilGeometry, soilMaterial)
    soil.position.y = 0.21
    group.add(soil)

    if (plant.stage === PlantStage.Seed || plant.stage === PlantStage.Germination) {
        // Just show a small sprout
        const sprout = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x7acc52 }),
        )
        sprout.position.y = 0.24
        group.add(sprout)
        return group
    }

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.035, height, 8)
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.7 })
    const stem = new THREE.Mesh(stemGeometry, stemMaterial)
    stem.position.y = 0.22 + height / 2
    group.add(stem)

    // Leaf canopy – layered spheres
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
        canopy.scale.set(1, 0.7, 1) // flatten slightly
        group.add(canopy)
    }

    // Buds (flowering only)
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
                0.22 + height * 0.85 + Math.random() * 0.05,
                Math.sin(angle) * 0.08,
            )
            group.add(bud)
        }

        // Top cola
        const cola = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), budMaterial)
        cola.position.y = 0.22 + height + 0.04
        group.add(cola)
    }

    return group
}

// ---------------------------------------------------------------------------
// Grow room builder (tent, light, exhaust)
// ---------------------------------------------------------------------------

const createGrowRoom = (): THREE.Group => {
    const group = new THREE.Group()

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 1.0 }),
    )
    floor.rotation.x = -Math.PI / 2
    group.add(floor)

    // Reflective tent walls (semi-transparent to allow visibility)
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x222244,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        roughness: 0.2,
        metalness: 0.8,
    })

    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT), wallMaterial)
    backWall.position.set(0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2)
    group.add(backWall)

    // Side walls
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), wallMaterial)
    leftWall.position.set(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0)
    leftWall.rotation.y = Math.PI / 2
    group.add(leftWall)

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), wallMaterial)
    rightWall.position.set(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0)
    rightWall.rotation.y = -Math.PI / 2
    group.add(rightWall)

    // Grow light (panel shape)
    const lightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.06, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x333366 }),
    )
    lightPanel.position.set(0, ROOM_HEIGHT - 0.1, 0)
    group.add(lightPanel)

    // Light glow (emissive plane below the panel)
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

    // Duct (exhaust suggestion – cylinder near ceiling corner)
    const duct = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.7 }),
    )
    duct.position.set(ROOM_WIDTH / 2 - 0.3, ROOM_HEIGHT - 0.25, -ROOM_DEPTH / 2 + 0.3)
    group.add(duct)

    return group
}

// ---------------------------------------------------------------------------
// VPD atmosphere particles
// ---------------------------------------------------------------------------

const createAtmosphereParticles = (vpd: number): THREE.Points => {
    const count = Math.round(30 + vpd * 40) // more particles for higher VPD
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * ROOM_WIDTH * 0.8
        positions[i * 3 + 1] = Math.random() * ROOM_HEIGHT * 0.6 + 0.3
        positions[i * 3 + 2] = (Math.random() - 0.5) * ROOM_DEPTH * 0.8
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface GrowRoom3DProps {
    className?: string
}

const disposeScene = (scene: THREE.Scene, renderer: THREE.WebGLRenderer): void => {
    scene.traverse((obj: THREE.Mesh) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
            obj.geometry.dispose()
            if (Array.isArray(obj.material)) {
                obj.material.forEach((m: THREE.MeshStandardMaterial) => m.dispose())
            } else {
                obj.material.dispose()
            }
        }
    })
    renderer.dispose()
}

const GrowRoom3DComponent: React.FC<GrowRoom3DProps> = ({ className }) => {
    const { t } = useTranslation()
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const frameRef = useRef(0)
    const cancelledRef = useRef(false)

    const activePlants = useAppSelector(selectActivePlants)
    const gardenMetrics = useAppSelector(selectGardenHealthMetrics)

    // VPD for display overlay
    const vpdValue = gardenMetrics.avgVPD
    const avgTemp = gardenMetrics.avgTemp
    const avgHumidity = gardenMetrics.avgHumidity

    const vpdStatus = useMemo((): { label: string; color: string } => {
        if (vpdValue < 0.4)
            return { label: t('plantsView.growRoom3d.vpdLow'), color: 'text-blue-400' }
        if (vpdValue < 0.8)
            return { label: t('plantsView.growRoom3d.vpdSlightlyLow'), color: 'text-cyan-400' }
        if (vpdValue < 1.2)
            return { label: t('plantsView.growRoom3d.vpdOptimal'), color: 'text-green-400' }
        if (vpdValue < 1.6)
            return { label: t('plantsView.growRoom3d.vpdSlightlyHigh'), color: 'text-yellow-400' }
        return { label: t('plantsView.growRoom3d.vpdHigh'), color: 'text-red-400' }
    }, [vpdValue, t])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Dispose previous scene/renderer before creating new ones
        if (sceneRef.current && rendererRef.current) {
            disposeScene(sceneRef.current, rendererRef.current)
        }

        cancelledRef.current = false

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0a0a1a)
        scene.fog = new THREE.FogExp2(0x0a0a1a, 0.15)
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(45, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 50)
        camera.position.set(3.5, 2.8, 4.0)
        camera.lookAt(0, 0.5, 0)

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
        renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT, false)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.1
        rendererRef.current = renderer

        // Lighting
        const ambient = new THREE.AmbientLight(0x404060, 0.5)
        scene.add(ambient)

        // Grow light (warm from above)
        const growLight = new THREE.PointLight(0xffe4b5, 1.5, 6)
        growLight.position.set(0, ROOM_HEIGHT - 0.2, 0)
        scene.add(growLight)

        // Rim light
        const rimLight = new THREE.DirectionalLight(0x4466aa, 0.4)
        rimLight.position.set(-3, 2, 3)
        scene.add(rimLight)

        // Build the room
        const room = createGrowRoom()
        scene.add(room)

        // Place plants in the room
        const plantPositions = [
            new THREE.Vector3(-0.8, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.8, 0, 0),
        ]

        activePlants.forEach((plant, index) => {
            if (index < 3) {
                const model = createPlant3D(plant)
                model.position.copy(plantPositions[index])
                scene.add(model)
            }
        })

        // VPD atmosphere particles
        const particles = createAtmosphereParticles(vpdValue)
        scene.add(particles)

        // Animation loop with cancellation guard
        const animate = (): void => {
            if (cancelledRef.current) return

            // Gentle camera orbit
            const time = performance.now() * 0.0003
            camera.position.x = Math.cos(time) * 4.5
            camera.position.z = Math.sin(time) * 4.0
            camera.position.y = 2.4 + Math.sin(time * 0.5) * 0.3
            camera.lookAt(0, 0.5, 0)

            // Animate particles
            const positions = particles.geometry.attributes.position
            if (positions) {
                for (let i = 0; i < positions.count; i++) {
                    const y = positions.getY(i)
                    positions.setY(i, y + Math.sin(time * 3 + i) * 0.001)
                    if (y > ROOM_HEIGHT * 0.9) {
                        positions.setY(i, 0.3)
                    }
                }
                positions.needsUpdate = true
            }

            renderer.render(scene, camera)
            if (!cancelledRef.current) {
                frameRef.current = window.requestAnimationFrame(animate)
            }
        }

        animate()

        return () => {
            cancelledRef.current = true
            window.cancelAnimationFrame(frameRef.current)
            disposeScene(scene, renderer)
            sceneRef.current = null
            rendererRef.current = null
        }
    }, [activePlants, vpdValue])

    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-900/40 border border-primary-500/20">
                        <svg
                            className="w-4 h-4 text-primary-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                    </span>
                    {t('plantsView.growRoom3d.title')}
                </h3>
                <span className="text-[0.65rem] text-slate-500 uppercase tracking-widest">
                    {t('plantsView.growRoom3d.live')}
                </span>
            </div>

            {/* Canvas */}
            <div className="relative rounded-lg overflow-hidden bg-slate-900/50">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-auto"
                    style={{ imageRendering: 'auto' }}
                />

                {/* VPD Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none">
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-[0.6rem] uppercase tracking-wider text-slate-500">
                                VPD
                            </span>
                            <span className={cn('text-lg font-bold font-display', vpdStatus.color)}>
                                {vpdValue.toFixed(2)}
                            </span>
                            <span className="text-[0.6rem] text-slate-500">kPa</span>
                        </div>
                        <span className={cn('text-xs font-semibold', vpdStatus.color)}>
                            {vpdStatus.label}
                        </span>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 flex gap-4 text-xs">
                        <div className="text-center">
                            <span className="text-slate-500 block text-[0.55rem] uppercase">
                                {t('plantsView.growRoom3d.temp')}
                            </span>
                            <span className="text-slate-200 font-semibold">
                                {avgTemp.toFixed(1)}°C
                            </span>
                        </div>
                        <div className="text-center">
                            <span className="text-slate-500 block text-[0.55rem] uppercase">
                                {t('plantsView.growRoom3d.humidity')}
                            </span>
                            <span className="text-slate-200 font-semibold">
                                {avgHumidity.toFixed(0)}%
                            </span>
                        </div>
                        <div className="text-center">
                            <span className="text-slate-500 block text-[0.55rem] uppercase">
                                {t('plantsView.growRoom3d.plants')}
                            </span>
                            <span className="text-slate-200 font-semibold">
                                {activePlants.length}/3
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-3 text-[0.65rem] text-slate-500">
                <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                    {t('plantsView.growRoom3d.legendOptimal')}
                </span>
                <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 inline-block" />
                    {t('plantsView.growRoom3d.legendCaution')}
                </span>
                <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                    {t('plantsView.growRoom3d.legendDanger')}
                </span>
            </div>
        </Card>
    )
}

export const GrowRoom3D = memo(GrowRoom3DComponent)
GrowRoom3D.displayName = 'GrowRoom3D'
