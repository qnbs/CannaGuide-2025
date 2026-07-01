import * as THREE from 'three'
import { PlantStage } from '@/types'

export const vpdToColor = (vpd: number): THREE.Color => {
    if (vpd < 0.8) return new THREE.Color().setHSL(0.55, 0.6, 0.4)
    if (vpd < 1.2) return new THREE.Color().setHSL(0.33, 0.7, 0.45)
    if (vpd < 1.6) return new THREE.Color().setHSL(0.2, 0.65, 0.45)
    return new THREE.Color().setHSL(0.0, 0.7, 0.45)
}

export const healthToLeafGreen = (health: number): THREE.Color => {
    const hue = 0.22 + (health / 100) * 0.12
    const sat = 0.4 + (health / 100) * 0.3
    const light = 0.25 + (health / 100) * 0.2
    return new THREE.Color().setHSL(hue, sat, light)
}

export const stageToHeight = (stage: PlantStage, age: number): number => {
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
