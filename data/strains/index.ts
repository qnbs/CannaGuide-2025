import type { Strain } from '@/types'

import { strainsNumeric } from './numeric'
import { strainsA } from './a'
import { strainsB } from './b'
import { strainsC } from './c'
import { strainsD } from './d'
import { strainsE } from './e'
import { strainsF } from './f'
import { strainsG } from './g'
import { strainsH } from './h'
import { strainsI } from './i'
import { strainsJ } from './j'
import { strainsK } from './k'
import { strainsL } from './l'
import { strainsM } from './m'
import { strainsN } from './n'
import { strainsO } from './o'
import { strainsP } from './p'
import { strainsQ } from './q'
import { strainsR } from './r'
import { strainsS } from './s'
import { strainsT } from './t'
import { strainsU } from './u'
import { strainsV } from './v'
import { strainsW } from './w'
import { strainsX } from './x'
import { strainsY } from './y'
import { strainsZ } from './z'

/**
 * Combined strain catalog.
 * All strains are organized in alphabetical files (a.ts-z.ts, numeric.ts).
 * De-duplicated by ID to ensure data integrity.
 */
const combinedStrains: Strain[] = [
    ...strainsNumeric,
    ...strainsA,
    ...strainsB,
    ...strainsC,
    ...strainsD,
    ...strainsE,
    ...strainsF,
    ...strainsG,
    ...strainsH,
    ...strainsI,
    ...strainsJ,
    ...strainsK,
    ...strainsL,
    ...strainsM,
    ...strainsN,
    ...strainsO,
    ...strainsP,
    ...strainsQ,
    ...strainsR,
    ...strainsS,
    ...strainsT,
    ...strainsU,
    ...strainsV,
    ...strainsW,
    ...strainsX,
    ...strainsY,
    ...strainsZ,
]

// De-duplicate strains by ID to ensure data integrity from the source.
const deduplicatedMap = new Map(combinedStrains.map((strain) => [strain.id, strain]))

if (import.meta.env.DEV && deduplicatedMap.size < combinedStrains.length) {
    const duplicateCount = combinedStrains.length - deduplicatedMap.size
    const idCounts = new Map<string, number>()
    for (const strain of combinedStrains) {
        idCounts.set(strain.id, (idCounts.get(strain.id) ?? 0) + 1)
    }
    const duplicateIds = [...idCounts.entries()].filter(([, count]) => count > 1).map(([id]) => id)
    console.warn(
        `[Strains] ${duplicateCount} duplicate strain(s) detected and auto-deduplicated. IDs: ${duplicateIds.join(', ')}`,
    )
}

export const allStrainsData: Strain[] = Array.from(deduplicatedMap.values())
