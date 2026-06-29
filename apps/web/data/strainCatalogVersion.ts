import catalogVersion from '@/data/strains/catalog-version.json'

export type StrainCatalogVersion = {
    version: string
    strainCount: number
    generatedAt: string
    schema: string
}

/** Bundled strain catalog manifest (ADR-0014). */
export const getCatalogVersion = (): StrainCatalogVersion => catalogVersion
