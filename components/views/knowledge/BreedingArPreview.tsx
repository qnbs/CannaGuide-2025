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

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x09131f)

        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
        camera.position.set(0, 1.2, 3.4)

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
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
        const animate = () => {
            preview.rotation.y += 0.008
            preview.rotation.x = Math.sin(performance.now() * 0.0008) * 0.03
            renderer.render(scene, camera)
            frameHandle = window.requestAnimationFrame(animate)
        }

        animate()

        let arButton: HTMLButtonElement | null = null
        if ('xr' in navigator) {
            const created = ARButton.createButton(renderer, {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: containerRef.current ?? undefined },
            })
            if (created) {
                created.className = `${created.className} mt-3 w-full`
                containerRef.current?.appendChild(created)
                arButton = created
            }
        }

        return () => {
            window.cancelAnimationFrame(frameHandle)
            if (arButton?.parentElement) {
                arButton.parentElement.removeChild(arButton)
            }
            scene.traverse((obj: THREE.Mesh) => {
                if (obj instanceof THREE.Mesh) {
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
    }, [
        normalizedStats.aroma,
        normalizedStats.resistance,
        normalizedStats.resin,
        normalizedStats.vigor,
    ])

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
                <canvas
                    ref={canvasRef}
                    className="w-full h-[320px] rounded-lg"
                    aria-label={t('knowledgeView.breeding.arPreviewLabel')}
                />
            </div>
        </Card>
    )
}

export const BreedingArPreview = memo(BreedingArPreviewComponent)
