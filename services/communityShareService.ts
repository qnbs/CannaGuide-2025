import { z } from 'zod'
import { Strain, StrainType } from '@/types'
import { getT } from '@/i18n'

const GIST_FILE_NAME = 'cannaguide-strains.json'

// Minimal Zod schema that validates the required core fields of an imported strain.
// .strip() removes unknown keys to prevent injection of unexpected properties
// into persisted Redux state from untrusted gist payloads.
const StrainImportSchema = z
    .object({
        id: z.string().min(1),
        name: z.string().min(1),
        type: z.nativeEnum(StrainType),
        thc: z.number(),
        cbd: z.number(),
        // Optional fields that are part of the Strain type
        description: z.string().optional(),
        floweringTime: z.number().optional(),
        difficulty: z.string().optional(),
        effects: z.array(z.string()).optional(),
        flavors: z.array(z.string()).optional(),
        medicalUses: z.array(z.string()).optional(),
        terpenes: z.array(z.string()).optional(),
        genetics: z.string().optional(),
        parents: z.array(z.string()).optional(),
        isLandrace: z.boolean().optional(),
        origin: z.string().optional(),
        breeder: z.string().optional(),
    })
    .strip()

const GistPayloadSchema = z.object({
    version: z.number(),
    strains: z.array(StrainImportSchema),
})

const extractGistId = (value: string): string => {
    const trimmed = value.trim()
    const match = trimmed.match(/(?:gist\.github\.com\/(?:[^/]+\/)?|^)([a-f0-9]{20,})/i)
    if (!match?.[1]) {
        throw new Error(getT()('common.communityShare.invalidGistUrl'))
    }
    return match[1]
}

class CommunityShareService {
    public async exportStrainsToAnonymousGist(strains: Strain[]): Promise<{ id: string; url: string }> {
        const payload = {
            description: 'CannaGuide anonymous strain share',
            public: false,
            files: {
                [GIST_FILE_NAME]: {
                    content: JSON.stringify(
                        {
                            version: 1,
                            exportedAt: Date.now(),
                            strains,
                        },
                        null,
                        2,
                    ),
                },
            },
        }

        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            throw new Error(getT()('common.communityShare.exportFailed', { status: response.status }))
        }

        const gist = (await response.json()) as { id: string; html_url: string }
        return { id: gist.id, url: gist.html_url }
    }

    public async importStrainsFromGist(gistUrlOrId: string): Promise<Strain[]> {
        const gistId = extractGistId(gistUrlOrId)
        const response = await fetch(`https://api.github.com/gists/${gistId}`)

        if (!response.ok) {
            throw new Error(getT()('common.communityShare.fetchFailed', { status: response.status }))
        }

        const gist = (await response.json()) as {
            files: Record<string, { content?: string }>
        }

        const file = gist.files[GIST_FILE_NAME] || Object.values(gist.files)[0]
        if (!file?.content) {
            throw new Error(getT()('common.communityShare.noPayload'))
        }

        const parsed = JSON.parse(file.content)
        const result = GistPayloadSchema.safeParse(parsed)
        if (!result.success) {
            throw new Error(getT()('common.communityShare.invalidPayload', { details: result.error.issues.map((i) => i.message).join(', ') }))
        }

        return result.data.strains as Strain[]
    }
}

export const communityShareService = new CommunityShareService()
