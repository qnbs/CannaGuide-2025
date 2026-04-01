// ---------------------------------------------------------------------------
// equipmentProductService.ts -- Product link resolution for equipment items
//
// Maps equipment product names to vendor purchase links and prices.
// Sources: Static catalog + dynamic SeedFinder/shop API lookups.
// ---------------------------------------------------------------------------

import type { ProductLink, RecommendationCategory } from '@/types'

// ---------------------------------------------------------------------------
// Static vendor catalog -- curated links for common grow equipment
// ---------------------------------------------------------------------------

interface VendorCatalogEntry {
    pattern: RegExp
    category: RecommendationCategory
    links: ProductLink[]
}

const VENDOR_CATALOG: VendorCatalogEntry[] = [
    // --- Tents ---
    {
        pattern: /Mars\s*Hydro.*(\d+)x(\d+)/i,
        category: 'tent',
        links: [
            { vendor: 'Mars Hydro', url: 'https://www.mars-hydro.com/grow-tent' },
            { vendor: 'Amazon', url: 'https://www.amazon.com/s?k=mars+hydro+grow+tent' },
        ],
    },
    {
        pattern: /Secret\s*Jardin/i,
        category: 'tent',
        links: [
            { vendor: 'Secret Jardin', url: 'https://www.secretjardin.com/products' },
            { vendor: 'Growmart', url: 'https://www.growmart.de/Secret-Jardin/' },
        ],
    },
    {
        pattern: /Mammoth/i,
        category: 'tent',
        links: [{ vendor: 'Gavita', url: 'https://mammothtents.com/' }],
    },

    // --- Lights ---
    {
        pattern: /Mars\s*Hydro.*(?:TSW?|SP|FC|TS)\s*\d+/i,
        category: 'light',
        links: [
            { vendor: 'Mars Hydro', url: 'https://www.mars-hydro.com/led-grow-light' },
            { vendor: 'Amazon', url: 'https://www.amazon.com/s?k=mars+hydro+led+grow+light' },
        ],
    },
    {
        pattern: /Spider\s*Farmer/i,
        category: 'light',
        links: [
            { vendor: 'Spider Farmer', url: 'https://www.spider-farmer.com/' },
            { vendor: 'Amazon', url: 'https://www.amazon.com/s?k=spider+farmer+led' },
        ],
    },
    {
        pattern: /HLG|Horticulture.*Lighting/i,
        category: 'light',
        links: [{ vendor: 'HLG', url: 'https://horticulturelightinggroup.com/' }],
    },
    {
        pattern: /Sanlight/i,
        category: 'light',
        links: [
            { vendor: 'SANlight', url: 'https://sanlight.com/en/' },
            { vendor: 'Growmart', url: 'https://www.growmart.de/SANlight/' },
        ],
    },
    {
        pattern: /Lumatek/i,
        category: 'light',
        links: [{ vendor: 'Lumatek', url: 'https://lumatek-lighting.com/' }],
    },

    // --- Ventilation ---
    {
        pattern: /AC\s*Infinity/i,
        category: 'ventilation',
        links: [
            { vendor: 'AC Infinity', url: 'https://www.acinfinity.com/' },
            { vendor: 'Amazon', url: 'https://www.amazon.com/s?k=ac+infinity+inline+fan' },
        ],
    },
    {
        pattern: /Prima\s*Klima/i,
        category: 'ventilation',
        links: [
            { vendor: 'Prima Klima', url: 'https://www.primaklima.com/' },
            { vendor: 'Growmart', url: 'https://www.growmart.de/Prima-Klima/' },
        ],
    },
    {
        pattern: /Can\s*Fan|CAN-Fan/i,
        category: 'ventilation',
        links: [{ vendor: 'CAN Filters', url: 'https://www.can-filters.com/' }],
    },

    // --- Nutrients ---
    {
        pattern: /BioBizz/i,
        category: 'nutrients',
        links: [
            { vendor: 'BioBizz', url: 'https://www.biobizz.com/' },
            { vendor: 'Amazon', url: 'https://www.amazon.com/s?k=biobizz+nutrients' },
            { vendor: 'Growmart', url: 'https://www.growmart.de/BioBizz/' },
        ],
    },
    {
        pattern: /Advanced\s*Nutrients/i,
        category: 'nutrients',
        links: [{ vendor: 'Advanced Nutrients', url: 'https://www.advancednutrients.com/' }],
    },
    {
        pattern: /General\s*Hydroponics|GHE|Terra\s*Aquatica/i,
        category: 'nutrients',
        links: [{ vendor: 'Terra Aquatica', url: 'https://www.terraaquatica.com/' }],
    },
    {
        pattern: /CANNA/i,
        category: 'nutrients',
        links: [{ vendor: 'CANNA', url: 'https://www.canna.com/' }],
    },
    {
        pattern: /Plagron/i,
        category: 'nutrients',
        links: [{ vendor: 'Plagron', url: 'https://www.plagron.com/' }],
    },

    // --- Soil ---
    {
        pattern: /BioBizz.*(?:Light|All|Coco)/i,
        category: 'soil',
        links: [{ vendor: 'BioBizz', url: 'https://www.biobizz.com/substrates/' }],
    },
    {
        pattern: /Plagron.*(?:Royal|Grow|Light)/i,
        category: 'soil',
        links: [{ vendor: 'Plagron', url: 'https://www.plagron.com/en/substrates' }],
    },

    // --- Pots ---
    {
        pattern: /Air-?Pot/i,
        category: 'pots',
        links: [{ vendor: 'Airpot', url: 'https://airpot.co.uk/' }],
    },
    {
        pattern: /Smart\s*Pot|Fabric/i,
        category: 'pots',
        links: [{ vendor: 'Amazon', url: 'https://www.amazon.com/s?k=fabric+grow+pots' }],
    },
]

// ---------------------------------------------------------------------------
// Product link resolver
// ---------------------------------------------------------------------------

/**
 * Resolve product links for a recommendation item by matching its name
 * against the vendor catalog. Returns matching links or an empty array.
 */
export function resolveProductLinks(
    productName: string,
    _category: RecommendationCategory,
): ProductLink[] {
    const matches: ProductLink[] = []

    for (const entry of VENDOR_CATALOG) {
        if (entry.pattern.test(productName)) {
            matches.push(...entry.links)
        }
    }

    // If no catalog match, generate a generic search link
    if (matches.length === 0 && productName.length > 3) {
        const searchTerm = encodeURIComponent(productName)
        matches.push(
            {
                vendor: 'Amazon',
                url: `https://www.amazon.com/s?k=${searchTerm}`,
            },
            {
                vendor: 'Google Shopping',
                url: `https://www.google.com/search?tbm=shop&q=${searchTerm}`,
            },
        )
    }

    return matches
}

/**
 * Vendor brand colors for UI badges.
 */
export const VENDOR_COLORS: Record<string, string> = {
    'Mars Hydro': 'bg-red-500/20 text-red-300',
    'Spider Farmer': 'bg-green-500/20 text-green-300',
    'AC Infinity': 'bg-blue-500/20 text-blue-300',
    BioBizz: 'bg-lime-500/20 text-lime-300',
    SANlight: 'bg-amber-500/20 text-amber-300',
    Amazon: 'bg-orange-500/20 text-orange-300',
    Growmart: 'bg-teal-500/20 text-teal-300',
    'Google Shopping': 'bg-purple-500/20 text-purple-300',
    default: 'bg-slate-500/20 text-slate-300',
}

export function getVendorColor(vendor: string): string {
    const color: string | undefined = VENDOR_COLORS[vendor]
    return color ?? 'bg-slate-500/20 text-slate-300'
}
