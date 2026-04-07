import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { Card } from '@/components/common/Card'
import { useTranslation } from 'react-i18next'

interface BreedingArPreviewProps {
    label: string
    vigor: number
    resin: number
    aroma: number
    resistance: number
}

const createPlant = (
    vigor: number,
    resin: number,
    aroma: number,
    resistance: number,
): THREE.Group => {
    const group = new THREE.Group()
    const stemHeight = 1.2 + vigor * 0.08
    const leafScale = 0.45 + aroma * 0.03
    const bloomRadius = 0.18 + resin * 0.012

    const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, stemHeight, 10),
        new THREE.MeshStandardMaterial({
            color: new THREE.Color(`hsl(${120 + resistance * 2}, 42%, 34%)`),
        }),
    )
    stem.position.y = stemHeight / 2
    group.add(stem)

    const leafMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${98 + aroma * 1.4}, 60%, 38%)`),
    })
    const leafGeometry = new THREE.SphereGeometry(leafScale, 16, 12)

    for (let index = 0; index < 4; index += 1) {
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial)
        const side = index % 2 === 0 ? 1 : -1
        leaf.position.set(side * 0.32, 0.42 + index * 0.18, 0.04 * index)
        leaf.rotation.z = side * 0.65
        group.add(leaf)
    }

    const bloom = new THREE.Mesh(
        new THREE.SphereGeometry(bloomRadius, 20, 16),
        new THREE.MeshStandardMaterial({
            color: new THREE.Color(`hsl(${300 - resin * 3}, 68%, 60%)`),
        }),
    )
    bloom.position.y = stemHeight + bloomRadius * 0.7
    group.add(bloom)

    return group
}

const disposeSceneResources = (scene: THREE.Scene): void => {
    scene.traverse((obj: THREE.Object3D) => {
        if (!(obj instanceof THREE.Mesh)) {
            return
        }

        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
            obj.material.forEach((material: THREE.Material) => material.dispose())
            return
        }
        obj.material.dispose()
    })
}

const appendArButton = (
    renderer: THREE.WebGLRenderer,
    root: HTMLDivElement | null,
): HTMLElement | null => {
    if (!(typeof navigator !== 'undefined' && 'xr' in navigator)) {
        return null
    }

    const button = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: root as HTMLElement },
    })

    if (!button) {
        return null
    }

    button.className = `${button.className} mt-3 w-full`
    root?.appendChild(button)
    return button
}

const browserWindow = typeof window === 'undefined' ? null : window

const BreedingArPreviewComponent: React.FC<BreedingArPreviewProps> = ({
    label,
    vigor,
    resin,
    aroma,
    resistance,
}) => {
    const { t } = useTranslation()
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [isSupported, setIsSupported] = useState(false)
    const [webglError, setWebglError] = useState<string | null>(null)

    const normalizedStats = useMemo(
        () => ({
            vigor: Math.max(0, Math.min(10, vigor)),
            resin: Math.max(0, Math.min(10, resin)),
            aroma: Math.max(0, Math.min(10, aroma)),
            resistance: Math.max(0, Math.min(10, resistance)),
        }),
        [aroma, resistance, resin, vigor],
    )

    useEffect(() => {
        setIsSupported(typeof navigator !== 'undefined' && 'xr' in navigator)
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        if (typeof document === 'undefined') {
            setWebglError('WebGL is not available in this environment.')
            return
        }

        try {
            const testCanvas = document.createElement('canvas')
            const contextOptions = { failIfMajorPerformanceCaveat: true }
            const canCreateContext =
                testCanvas.getContext('webgl2', contextOptions) ??
                testCanvas.getContext('webgl', contextOptions) ??
                testCanvas.getContext('experimental-webgl', contextOptions)

            if (!canCreateContext) {
                setWebglError('This browser cannot create a WebGL context.')
                return
            }
        } catch {
            setWebglError('This browser cannot create a WebGL context.')
            return
        }

        setWebglError(null)

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x09131f)

        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
        camera.position.set(0, 1.2, 3.4)

        let renderer: THREE.WebGLRenderer
        try {
            renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Failed to create WebGL renderer.'
            setWebglError(message)
            return
        }
        renderer.setSize(320, 320, false)
        renderer.xr.enabled = true

        const ambient = new THREE.AmbientLight(0xffffff, 1.1)
        scene.add(ambient)

        const keyLight = new THREE.DirectionalLight(0xb0f5b1, 1.4)
        keyLight.position.set(2, 3, 2)
        scene.add(keyLight)

        const preview = createPlant(
            normalizedStats.vigor,
            normalizedStats.resin,
            normalizedStats.aroma,
            normalizedStats.resistance,
        )
        preview.position.y = -0.9
        scene.add(preview)

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.9, 1.1, 0.14, 24),
            new THREE.MeshStandardMaterial({ color: 0x142334, roughness: 0.95 }),
        )
        base.position.y = -1.05
        scene.add(base)

        let frameHandle = 0
        let animating = false
        let cancelled = false

        const animate = (): void => {
            if (cancelled || document.hidden) {
                animating = false
                return
            }
            preview.rotation.y += 0.008
            preview.rotation.x = Math.sin(performance.now() * 0.0008) * 0.03
            renderer.render(scene, camera)
            frameHandle = browserWindow?.requestAnimationFrame(animate) ?? 0
        }

        const startAnimation = (): void => {
            if (animating || cancelled) return
            animating = true
            animate()
        }

        startAnimation()

        const handleVisibility = (): void => {
            if (!document.hidden && !cancelled) {
                startAnimation()
            }
        }
        document.addEventListener('visibilitychange', handleVisibility)

        const handleContextLost = (e: Event): void => {
            e.preventDefault()
            cancelled = true
            browserWindow?.cancelAnimationFrame(frameHandle)
            animating = false
        }
        const handleContextRestored = (): void => {
            cancelled = false
            startAnimation()
        }
        canvas.addEventListener('webglcontextlost', handleContextLost)
        canvas.addEventListener('webglcontextrestored', handleContextRestored)

        const arButton = appendArButton(renderer, containerRef.current)

        return () => {
            cancelled = true
            animating = false
            browserWindow?.cancelAnimationFrame(frameHandle)
            document.removeEventListener('visibilitychange', handleVisibility)
            canvas.removeEventListener('webglcontextlost', handleContextLost)
            canvas.removeEventListener('webglcontextrestored', handleContextRestored)
            if (arButton?.parentElement) {
                arButton.remove()
            }
            disposeSceneResources(scene)
            renderer.dispose()
        }
    }, [
        normalizedStats.aroma,
        normalizedStats.resistance,
        normalizedStats.resin,
        normalizedStats.vigor,
    ])

    const showFallback = webglError !== null

    return (
        <Card className="bg-slate-900/60 ring-1 ring-inset ring-white/20">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                    <h4 className="text-lg font-bold text-primary-300 font-display">
                        {t('knowledgeView.breeding.arTitle')}
                    </h4>
                    <p className="text-sm text-slate-400">{label}</p>
                </div>
                <div className="text-xs rounded-full px-2.5 py-1 bg-slate-800 text-slate-300 ring-1 ring-inset ring-white/10">
                    {isSupported
                        ? t('knowledgeView.breeding.arSupported')
                        : t('knowledgeView.breeding.arFallback')}
                </div>
            </div>
            <div
                ref={containerRef}
                className="rounded-xl overflow-hidden bg-slate-950/80 ring-1 ring-inset ring-white/10 p-3"
                style={{ minHeight: '340px' }}
            >
                {showFallback ? (
                    <div className="flex h-[320px] flex-col items-center justify-center gap-4 rounded-lg border border-white/5 bg-slate-900/60 px-6 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                            <svg
                                className="h-6 w-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 8v4m0 4h.01M4.93 19h14.14c1.54 0 2.49-1.67 1.72-3L14.72 5c-.77-1.33-2.67-1.33-3.44 0L3.21 16c-.77 1.33.18 3 1.72 3Z"
                                />
                            </svg>
                        </div>
                        <div className="max-w-sm space-y-2">
                            <h5 className="text-base font-semibold text-slate-100">
                                {t('knowledgeView.breeding.webglUnavailableTitle')}
                            </h5>
                            <p className="text-sm leading-6 text-slate-300">
                                {t('knowledgeView.breeding.webglUnavailableDescription')}
                            </p>
                            <p className="text-xs leading-5 text-slate-500">
                                {t('knowledgeView.breeding.webglUnavailableHint')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        className="w-full h-[320px] rounded-lg"
                        aria-label={t('knowledgeView.breeding.arPreviewLabel')}
                    />
                )}
            </div>
        </Card>
    )
}

export const BreedingArPreview = memo(BreedingArPreviewComponent)
