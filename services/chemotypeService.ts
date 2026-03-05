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
    entries.sort((a, b) => b[1] - a[1])[0]?.[0] || 'n/a'

class ChemotypeService {
    public calculate(input: ChemotypeInput): ChemotypeResult {
        const cannabinoids: Array<[string, number]> = [
            ['THC', input.thc],
            ['CBD', input.cbd],
            ['CBG', input.cbg],
        ]
        const terpenes: Array<[string, number]> = [
            ['Limonene', input.limonene],
            ['Myrcene', input.myrcene],
            ['Pinene', input.pinene],
            ['Linalool', input.linalool],
            ['Caryophyllene', input.caryophyllene],
        ]

        const dominantCannabinoid = dominantKey(cannabinoids)
        const dominantTerpene = dominantKey(terpenes)

        let profileLabel = 'Balanced profile'
        if (input.thc >= 18 && input.cbd < 1) profileLabel = 'THC-forward'
        if (input.cbd >= 8 && input.thc <= 12) profileLabel = 'CBD-forward'
        if (input.myrcene >= 0.6) profileLabel = 'Relaxing terpene profile'
        if (input.limonene >= 0.5 && input.pinene >= 0.3) profileLabel = 'Uplifting terpene profile'

        const guidance = [
            `Dominant cannabinoid: ${dominantCannabinoid}`,
            `Dominant terpene: ${dominantTerpene}`,
            'Record observed effects with dose, timing, and set/setting.',
            'Avoid driving or operating machinery after consumption.',
        ]

        return {
            totalCannabinoids: input.thc + input.cbd + input.cbg,
            totalTerpenes:
                input.limonene + input.myrcene + input.pinene + input.linalool + input.caryophyllene,
            dominantCannabinoid,
            dominantTerpene,
            profileLabel,
            guidance,
            disclaimer:
                'Medical disclaimer: This calculator is educational only and not medical advice. Always consult qualified healthcare professionals before making treatment decisions.',
        }
    }
}

export const chemotypeService = new ChemotypeService()
