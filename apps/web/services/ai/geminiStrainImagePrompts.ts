/**
 * Strain image generation prompts and response extraction for Gemini image models.
 */
import type { Strain } from '@/types'
import type { ImageCriteria, ImageStyle } from '@/types/aiProvider'
import { getT } from '@/i18n'
import { secureRandom } from '@/utils/random'

export const STRAIN_IMAGE_STYLES: Exclude<ImageStyle, 'random'>[] = [
    'fantasy',
    'botanical',
    'psychedelic',
    'macro',
    'cyberpunk',
]

export const resolveStrainImageStyle = (style: ImageStyle): Exclude<ImageStyle, 'random'> => {
    if (style === 'random') {
        return (
            STRAIN_IMAGE_STYLES[Math.floor(secureRandom() * STRAIN_IMAGE_STYLES.length)] ??
            'botanical'
        )
    }
    return style as Exclude<ImageStyle, 'random'>
}

const getStrainImageStylePrompts = (
    strainName: string,
): Record<Exclude<ImageStyle, 'random'>, string> => ({
    fantasy: `A stunning, artistic, and imaginative fantasy illustration representing the cannabis strain '${strainName}'. The style should be vibrant and impressive, with ethereal, magical lighting.`,
    botanical: `A detailed vintage botanical illustration of the cannabis strain '${strainName}'. The style should mimic a 19th-century scientific drawing with fine ink lines, delicate watercolor washes, and annotations on aged, parchment-like paper. Focus on realism and anatomical accuracy.`,
    psychedelic: `A vibrant, psychedelic art piece inspired by the cannabis strain '${strainName}'. The style should be reminiscent of 1960s poster art, featuring swirling patterns, kaleidoscopic visuals, bold neon colors, and abstract, flowing shapes. Trippy and mesmerizing.`,
    macro: `An ultra-realistic, professional macro photograph of a perfect cannabis bud from the strain '${strainName}'. Focus on the intricate details: glistening trichomes, vibrant pistils, and complex textures. Use dramatic studio lighting to create depth. The background should be clean and dark.`,
    cyberpunk: `A high-tech, cyberpunk-style hologram of the cannabis strain '${strainName}'. The plant should be rendered as a glowing, neon-blue and purple wireframe or semi-translucent light form, projected into a dark, futuristic scene. Incorporate glitch effects and scan lines for a high-tech feel.`,
})

type CriteriaPromptMaps = {
    focus: { buds: string; plant: string; abstract: string }
    composition: { symmetrical: string; dynamic: string; minimalist: string }
    mood: { mystical: string; energetic: string; calm: string }
}

const getStrainImageCriteriaPrompts = (): CriteriaPromptMaps => ({
    focus: {
        buds: 'The main focus is a close-up on the detailed structure of the flower buds.',
        plant: 'The composition features the entire plant, showcasing its overall shape and structure.',
        abstract:
            "The image is an abstract representation of the strain's essence, not a literal plant.",
    },
    composition: {
        symmetrical: 'The composition is balanced and formally symmetrical.',
        dynamic: 'The composition is dynamic, using strong diagonal lines and a sense of movement.',
        minimalist:
            'The composition is minimalist, with a single subject against a simple, clean background.',
    },
    mood: {
        mystical: 'The overall mood is mystical, dark, and enigmatic.',
        energetic: 'The overall mood is bright, energetic, and vibrant.',
        calm: 'The overall mood is calm, serene, and peaceful.',
    },
})

export const buildStrainImagePrompt = (
    strain: Strain,
    style: Exclude<ImageStyle, 'random'>,
    criteria: ImageCriteria,
): string => {
    const systemPrompt =
        "You are an advanced image generation AI. Your task is to produce a single, high-fidelity, visually stunning, and contextually accurate image based on the user's detailed prompt. Adhere strictly to all instructions, especially regarding style, subject, and mood. Interpret prompts artistically but precisely."
    const stylePrompts = getStrainImageStylePrompts(strain.name)
    const criteriaPrompts = getStrainImageCriteriaPrompts()
    const strainSpecificPrompt = stylePrompts[style]
    const focusPrompt =
        criteria.focus === 'buds'
            ? criteriaPrompts.focus.buds
            : criteria.focus === 'abstract'
              ? criteriaPrompts.focus.abstract
              : criteriaPrompts.focus.plant
    const compositionPrompt =
        criteria.composition === 'symmetrical'
            ? criteriaPrompts.composition.symmetrical
            : criteria.composition === 'minimalist'
              ? criteriaPrompts.composition.minimalist
              : criteriaPrompts.composition.dynamic
    const moodPrompt =
        criteria.mood === 'mystical'
            ? criteriaPrompts.mood.mystical
            : criteria.mood === 'energetic'
              ? criteriaPrompts.mood.energetic
              : criteriaPrompts.mood.calm

    const criteriaString = `
            Artistic Direction:
            - Focus: ${focusPrompt}
            - Composition: ${compositionPrompt}
            - Mood: ${moodPrompt}
            - Integrate the strain's name '${strain.name}' creatively and elegantly into the artwork itself, for example as subtle typography, glowing runes, or part of a natural pattern.
        `

    return `${systemPrompt}\n\n---\n\nCONTEXT: The image request is for legal, educational horticulture visualization only.\n\nEXECUTE THE FOLLOWING PROMPT:\n\n${strainSpecificPrompt}\n\n${criteriaString}`
}

export const extractGeneratedImageDataOrThrow = (response: {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                inlineData?: { data?: string }
            }>
        }
    }>
}): string => {
    const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)
    if (imagePart?.inlineData && typeof imagePart.inlineData.data === 'string') {
        return imagePart.inlineData.data
    }
    throw new Error(getT()('common.noImageGenerated'))
}
