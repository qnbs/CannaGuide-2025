import { z } from 'zod'
import { Strain, StrainType } from '@/types'

const GIST_FILE_NAME = 'cannaguide-strains.json'

// Minimal Zod schema that validates the required core fields of an imported strain.
// .passthrough() allows extra fields so older/newer exports remain compatible.
const StrainImportSchema = z
    .object({
        id: z.string().min(1),
        name: z.string().min(1),
        type: z.nativeEnum(StrainType),
        thc: z.number(),
        cbd: z.number(),
    })
    .passthrough()

const GistPayloadSchema = z.object({
    version: z.number(),
    strains: z.array(StrainImportSchema),
})

const extractGistId = (value: string): string => {
    const trimmed = value.trim()
    const match = trimmed.match(/(?:gist\.github\.com\/(?:[^/]+\/)?|^)([a-f0-9]{20,})/i)
    if (!match?.[1]) {
        throw new Error('Invalid gist URL or ID.')
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
            throw new Error(`Gist export failed (${response.status}).`)
        }

        const gist = (await response.json()) as { id: string; html_url: string }
        return { id: gist.id, url: gist.html_url }
    }

    public async importStrainsFromGist(gistUrlOrId: string): Promise<Strain[]> {
        const gistId = extractGistId(gistUrlOrId)
        const response = await fetch(`https://api.github.com/gists/${gistId}`)

        if (!response.ok) {
            throw new Error(`Could not fetch gist (${response.status}).`)
        }

        const gist = (await response.json()) as {
            files: Record<string, { content?: string }>
        }

        const file = gist.files[GIST_FILE_NAME] || Object.values(gist.files)[0]
        if (!file?.content) {
            throw new Error('Gist contains no importable strain payload.')
        }

        const parsed = JSON.parse(file.content)
        const result = GistPayloadSchema.safeParse(parsed)
        if (!result.success) {
            throw new Error(`Invalid strain payload in gist: ${result.error.issues.map((i) => i.message).join(', ')}`)
        }

        return result.data.strains as unknown as Strain[]
    }
}

export const communityShareService = new CommunityShareService()
