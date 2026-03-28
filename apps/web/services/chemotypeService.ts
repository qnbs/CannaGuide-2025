import { getT } from '@/i18n'

export interface ChemotypeInput {
    thc: number
    cbd: number
    cbg: number
    limonene: number
    myrcene: number
    pinene: number
    linalool: number
    caryophyllene: number
}

export interface ChemotypeResult {
    totalCannabinoids: number
    totalTerpenes: number
    dominantCannabinoid: string
    dominantTerpene: string
    profileLabel: string
    guidance: string[]
    disclaimer: string
}

const dominantKey = (entries: Array<[string, number]>) =>
    entries.toSorted((a, b) => b[1] - a[1])[0]?.[0] || 'n/a'

class ChemotypeService {
    public calculate(input: ChemotypeInput): ChemotypeResult {
        const t = getT()
        const cannabinoids: Array<[string, number]> = [
            ['THC', input.thc],
            ['CBD', input.cbd],
            ['CBG', input.cbg],
        ]
        const terpenes: Array<[string, number]> = [
            [t('equipmentView.calculators.chemotype.labels.limonene'), input.limonene],
            [t('equipmentView.calculators.chemotype.labels.myrcene'), input.myrcene],
            [t('equipmentView.calculators.chemotype.labels.pinene'), input.pinene],
            [t('equipmentView.calculators.chemotype.labels.linalool'), input.linalool],
            [t('equipmentView.calculators.chemotype.labels.caryophyllene'), input.caryophyllene],
        ]

        const dominantCannabinoid = dominantKey(cannabinoids)
        const dominantTerpene = dominantKey(terpenes)

        let profileLabel = t('equipmentView.calculators.chemotype.profiles.balanced')
        if (input.limonene >= 0.5 && input.pinene >= 0.3) {
            profileLabel = t('equipmentView.calculators.chemotype.profiles.uplifting')
        } else if (input.myrcene >= 0.6) {
            profileLabel = t('equipmentView.calculators.chemotype.profiles.relaxing')
        } else if (input.cbd >= 8 && input.thc <= 12) {
            profileLabel = t('equipmentView.calculators.chemotype.profiles.cbdForward')
        } else if (input.thc >= 18 && input.cbd < 1) {
            profileLabel = t('equipmentView.calculators.chemotype.profiles.thcForward')
        }

        const guidance = [
            t('equipmentView.calculators.chemotype.guidance.dominantCannabinoid', { name: dominantCannabinoid }),
            t('equipmentView.calculators.chemotype.guidance.dominantTerpene', { name: dominantTerpene }),
            t('equipmentView.calculators.chemotype.guidance.recordEffects'),
            t('equipmentView.calculators.chemotype.guidance.avoidDriving'),
        ]

        return {
            totalCannabinoids: input.thc + input.cbd + input.cbg,
            totalTerpenes:
                input.limonene + input.myrcene + input.pinene + input.linalool + input.caryophyllene,
            dominantCannabinoid,
            dominantTerpene,
            profileLabel,
            guidance,
            disclaimer: t('equipmentView.calculators.chemotype.disclaimer'),
        }
    }
}

export const chemotypeService = new ChemotypeService()
