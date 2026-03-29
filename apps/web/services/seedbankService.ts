// ---------------------------------------------------------------------------
// seedbankService.ts -- Seedbank availability lookups (mock data for now)
// ---------------------------------------------------------------------------

import type { Seedbank, SeedAvailability, SeedType } from '@/types'

// ---------------------------------------------------------------------------
// Mock seedbank registry
// ---------------------------------------------------------------------------

const SEEDBANKS: Seedbank[] = [
    {
        id: 'sensi-seeds',
        name: 'Sensi Seeds',
        websiteUrl: 'https://sensiseeds.com',
        rating: 4.8,
    },
    {
        id: 'barneys-farm',
        name: "Barney's Farm",
        websiteUrl: 'https://barneysfarm.com',
        rating: 4.7,
    },
    {
        id: 'royal-queen-seeds',
        name: 'Royal Queen Seeds',
        websiteUrl: 'https://royalqueenseeds.com',
        rating: 4.6,
    },
    {
        id: 'dutch-passion',
        name: 'Dutch Passion',
        websiteUrl: 'https://dutch-passion.com',
        rating: 4.5,
    },
    {
        id: 'fastbuds',
        name: 'FastBuds',
        websiteUrl: 'https://fastbuds.com',
        rating: 4.4,
    },
]

// ---------------------------------------------------------------------------
// Deterministic hash for reproducible mock prices
// ---------------------------------------------------------------------------

function simpleHash(input: string): number {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
        hash = (hash * 31 + input.charCodeAt(i)) | 0
    }
    return Math.abs(hash)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getSeedbanks(): Seedbank[] {
    return SEEDBANKS
}

export function getSeedbankById(id: string): Seedbank | undefined {
    return SEEDBANKS.find((sb) => sb.id === id)
}

export async function getAvailabilityForStrain(strainId: string): Promise<SeedAvailability[]> {
    // Simulate async fetch with small delay
    await new Promise((resolve) => {
        setTimeout(resolve, 300 + (simpleHash(strainId) % 200))
    })

    const hash = simpleHash(strainId)
    const seedTypes: SeedType[] = ['Feminized', 'Regular', 'Autoflowering']
    const packOptions: number[][] = [
        [1, 3, 5],
        [3, 5, 10],
        [1, 5, 10],
        [3, 10],
        [5, 10, 25],
    ]

    // Each strain appears at 2-4 seedbanks
    const count = 2 + (hash % 3)
    const startIdx = hash % SEEDBANKS.length

    const results: SeedAvailability[] = []
    for (let i = 0; i < count; i++) {
        const sbIdx = (startIdx + i) % SEEDBANKS.length
        const sb = SEEDBANKS[sbIdx]
        if (!sb) continue
        const entryHash = simpleHash(`${strainId}-${sb.id}`)
        const basePrice = 3 + (entryHash % 12) + (entryHash % 100) / 100

        results.push({
            seedbankId: sb.id,
            pricePerSeed: Math.round(basePrice * 100) / 100,
            currency: 'EUR',
            inStock: entryHash % 5 !== 0,
            packSizes: packOptions[entryHash % packOptions.length] ?? [3, 5, 10],
            seedType: seedTypes[entryHash % seedTypes.length] ?? 'Feminized',
        })
    }

    return results
}
