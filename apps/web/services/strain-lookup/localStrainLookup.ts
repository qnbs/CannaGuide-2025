import { allStrainsData } from '@/data/strains/index'
import type { LookupStrainResult } from '@/services/strain-lookup/strainLookupTypes'
import {
  buildCannabinoidDataPoints,
  buildFlavonoidDataPoints,
  buildTerpeneDataPoints,
  calculateEntourageScore,
  shannonDiversity,
} from '@/services/strain-lookup/strainLookupEnrichment'

export function getFuzzySuggestions(query: string, limit = 8): string[] {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return allStrainsData
        .filter((s) => s.name.toLowerCase().includes(q))
        .sort((a, b) => {
            const aPrefix = a.name.toLowerCase().startsWith(q) ? 0 : 1
            const bPrefix = b.name.toLowerCase().startsWith(q) ? 0 : 1
            return aPrefix - bPrefix || a.name.localeCompare(b.name)
        })
        .slice(0, limit)
        .map((s) => s.name)
}
export function lookupLocalCatalog(name: string): LookupStrainResult | null {
    const q = name.toLowerCase().trim()
    const hit =
        allStrainsData.find((s) => s.name.toLowerCase() === q) ??
        allStrainsData.find((s) => s.name.toLowerCase().includes(q))
    if (!hit) return null

    const terpenes = buildTerpeneDataPoints(hit)
    const cannabinoids = buildCannabinoidDataPoints(hit)
    const flavonoids = buildFlavonoidDataPoints(hit.type)
    const totalEntourageScore = calculateEntourageScore(terpenes, hit.thc, hit.cbd, flavonoids)
    const terpeneDiversity = shannonDiversity(terpenes)

    return {
        id: hit.id,
        name: hit.name,
        breeder: hit.lineage?.breeder ?? 'Community',
        type: hit.type,
        floweringType: hit.floweringType,
        thc: hit.thc,
        cbd: hit.cbd,
        cbg: hit.cbg ?? 0,
        thcv: hit.thcv ?? 0,
        description: hit.description ?? '',
        genetics: hit.genetics ?? '',
        terpenes,
        cannabinoids,
        flavonoids,
        aiSummary: '',
        matchScore: 0,
        confidenceScore: 95,
        confidenceSource: 'local',
        discoveredAt: new Date().toISOString(),
        sourceUrl: '',
        totalEntourageScore,
        terpeneDiversity,
        fullStrain: hit,
    }
}
