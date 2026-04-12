// ---------------------------------------------------------------------------
// @cannaguide/ai-core -- breeding & seed inventory domain types
// ---------------------------------------------------------------------------

import type { StrainType, SeedType, SeedSource } from './enums'

export interface Seed {
    id: string
    strainId: string
    strainName: string
    quality: number // 0-1
    createdAt: number
}

/** Extended seed inventory entry with stock tracking */
export interface SeedInventoryEntry {
    id: string
    strainId: string
    strainName: string
    /** Number of seeds in stock */
    quantity: number
    /** Seed type classification */
    seedType: SeedType
    /** Breeder / source name */
    breeder: string
    /** Quality rating 0-5 (star rating) */
    quality: number
    /** Acquisition date (timestamp) */
    acquiredAt: number
    /** User notes */
    notes?: string | undefined
    /** Tags for filtering */
    tags?: string[] | undefined
    /** Physical storage location */
    storageLocation?: string | undefined
    /** Germination rate percentage 0-100 */
    germinationRate?: number | undefined
    /** How seeds were acquired */
    source?: SeedSource | undefined
    /** Batch / lot number */
    batchNumber?: string | undefined
    /** Estimated expiry timestamp */
    expiryEstimate?: number | undefined
}

/** Pollen record for breeding documentation */
export interface PollenRecord {
    id: string
    /** Strain ID of pollen donor */
    donorStrainId: string
    /** Display name of pollen donor */
    donorStrainName: string
    /** Collection date (timestamp) */
    collectedAt: number
    /** Storage location description */
    storageLocation?: string | undefined
    /** Viability status */
    viable: boolean
    /** User notes */
    notes?: string | undefined
}

// Genealogy types
export interface GenealogyNode {
    id: string
    name: string
    type: StrainType
    thc: number
    isLandrace: boolean
    isPlaceholder?: boolean | undefined
    children?: GenealogyNode[] | undefined
    _children?: GenealogyNode[] | undefined
}

export interface GeneticContribution {
    name: string
    contribution: number
}
