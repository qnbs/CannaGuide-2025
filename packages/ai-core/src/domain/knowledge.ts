// ---------------------------------------------------------------------------
// @cannaguide/ai-core -- knowledge & learning domain types
// ---------------------------------------------------------------------------

import type { PlantStage, ProblemType, DiseaseCategory, DiseaseUrgency } from './enums'

export interface LexiconEntry {
    id?: string | undefined
    key: string
    category: 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'General' | 'Nutrient' | 'Disease'
}

/** Disease atlas entry -- metadata only; text content lives in i18n */
export interface DiseaseEntry {
    id: string
    nameKey: string
    category: DiseaseCategory
    severity: 'low' | 'medium' | 'high' | 'critical'
    affectedStages: PlantStage[]
    urgency: DiseaseUrgency
    relatedLexiconKeys: string[]
    relatedArticleIds: string[]
    /** A Tailwind color token name (e.g. 'amber', 'red') used for visual badges */
    colorToken: string
}

/** A single step in a learning path */
export interface LearningStep {
    id: string
    titleKey: string
    descriptionKey: string
    type: 'article' | 'calculator' | 'quiz' | 'practice'
    referenceId: string
}

/** A curated learning path for guided knowledge acquisition */
export interface LearningPath {
    id: string
    titleKey: string
    descriptionKey: string
    targetLevel: 'beginner' | 'intermediate' | 'expert'
    estimatedMinutes: number
    tags: string[]
    steps: LearningStep[]
}

export interface VisualGuide {
    id: string
    titleKey: string
    descriptionKey: string
}

export interface FAQItem {
    id: string
    questionKey: string
    answerKey: string
    triggers: {
        plantStage?: PlantStage | PlantStage[]
    }
}

export interface KnowledgeArticle {
    id: string
    titleKey: string
    contentKey: string
    tags: string[]
    triggers: {
        ageInDays?: { min: number; max: number } | undefined
        plantStage?: PlantStage | PlantStage[]
        activeProblems?: ProblemType[] | undefined
    }
}
