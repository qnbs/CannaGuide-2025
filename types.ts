// FIX: Add React to the scope for React.FC type usage. This resolves cascading type errors in other files.
import type React from 'react'
import type { EntityState } from '@reduxjs/toolkit'

// --- ENUMS ---

export enum View {
  Strains = 'Strains',
  Plants = 'Plants',
  Equipment = 'Equipment',
  Knowledge = 'Knowledge',
  Settings = 'Settings',
  Help = 'Help',
}

export enum PlantStage {
  Seed = 'SEED',
  Germination = 'GERMINATION',
  Seedling = 'SEEDLING',
  Vegetative = 'VEGETATIVE',
  Flowering = 'FLOWERING',
  Harvest = 'HARVEST',
  Drying = 'DRYING',
  Curing = 'CURING',
  Finished = 'FINISHED',
}

export enum StrainType {
  Sativa = 'Sativa',
  Indica = 'Indica',
  Hybrid = 'Hybrid',
}

export enum ProblemType {
  NutrientDeficiency = 'NUTRIENT_DEFICIENCY',
  Overwatering = 'OVERWATERING',
  Underwatering = 'UNDERWATERING',
  PestInfestation = 'PEST_INFESTATION',
  PH_TOO_HIGH = 'PH_TOO_HIGH',
  PH_TOO_LOW = 'PH_TOO_LOW',
  HUMIDITY_TOO_HIGH = 'HUMIDITY_TOO_HIGH',
  HUMIDITY_TOO_LOW = 'HUMIDITY_TOO_LOW',
  TEMPERATURE_TOO_HIGH = 'TEMPERATURE_TOO_HIGH',
  TEMPERATURE_TOO_LOW = 'TEMPERATURE_TOO_LOW',
  NUTRIENT_BURN = 'NUTRIENT_BURN',
}

export enum JournalEntryType {
  Watering = 'WATERING',
  Feeding = 'FEEDING',
  Training = 'TRAINING',
  Observation = 'OBSERVATION',
  System = 'SYSTEM',
  Photo = 'PHOTO',
  PestControl = 'PEST_CONTROL',
  Environment = 'ENVIRONMENT',
  Amendment = 'AMENDMENT',
}

export enum StrainViewTab {
  All = 'all',
  MyStrains = 'my-strains',
  Favorites = 'favorites',
  Exports = 'exports',
  Tips = 'tips',
  Genealogy = 'genealogy',
}

export enum EquipmentViewTab {
  Configurator = 'configurator',
  Setups = 'setups',
  Calculators = 'calculators',
  GrowShops = 'growShops',
}

export enum KnowledgeViewTab {
  Mentor = 'mentor',
  Guide = 'guide',
  Archive = 'archive',
  Breeding = 'breeding',
  Sandbox = 'sandbox',
}

export enum PhotoCategory {
  FullPlant = 'FullPlant',
  Bud = 'Bud',
  Leaf = 'Leaf',
  Roots = 'Roots',
  ProblemArea = 'ProblemArea',
  Trichomes = 'Trichomes',
  Setup = 'Setup',
}

// --- TYPE ALIASES ---

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard'
export type YieldLevel = 'Low' | 'Medium' | 'High'
export type HeightLevel = 'Short' | 'Medium' | 'Tall'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TrainingType = 'LST' | 'Topping' | 'FIMing' | 'Defoliation'
export type Language = 'en' | 'de'
export type Theme =
  | 'midnight'
  | 'forest'
  | 'purpleHaze'
  | 'desertSky'
  | 'roseQuartz'
export type UiDensity = 'comfortable' | 'compact'
export type SortKey =
  | 'name'
  | 'type'
  | 'thc'
  | 'cbd'
  | 'floweringTime'
  | 'difficulty'
  | 'yield'
export type SortDirection = 'asc' | 'desc'
export type ModalType =
  | 'watering'
  | 'feeding'
  | 'training'
  | 'pestControl'
  | 'observation'
  | 'photo'
  | 'amendment'
export type ExportFormat = 'pdf' | 'csv' | 'json' | 'txt' | 'xml'
export type PlantCount = '1' | '2-3'
export type Budget = 'value' | 'balanced' | 'premium'
export type GrowStyle = 'beginner' | 'balanced' | 'yield'
export type ScenarioAction = 'NONE' | 'TOP' | 'LST'
export type NotificationType = 'success' | 'error' | 'info'

// --- INTERFACES ---

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export interface GeneticModifiers {
  pestResistance: number // multiplier
  nutrientUptakeRate: number // multiplier
  stressTolerance: number // multiplier
  rue: number // Radiation Use Efficiency
}

export interface Strain {
  id: string
  name: string
  type: StrainType
  typeDetails?: string
  genetics?: string
  floweringType: 'Photoperiod' | 'Autoflower'
  thc: number
  cbd: number
  thcRange?: string
  cbdRange?: string
  floweringTime: number
  floweringTimeRange?: string
  description?: string
  agronomic: {
    difficulty: DifficultyLevel
    yield: YieldLevel
    height: HeightLevel
    yieldDetails?: { indoor: string; outdoor: string }
    heightDetails?: { indoor: string; outdoor: string }
  }
  aromas?: string[]
  dominantTerpenes?: string[]
  geneticModifiers: GeneticModifiers
}

export interface PlantProblem {
  type: ProblemType
  status: 'active' | 'resolved'
  severity: number // 0 to 1
  detectedAt: number // timestamp
  resolvedAt?: number
}

export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  isCompleted: boolean
  createdAt: number
  completedAt?: number
}

export interface PhotoDetails {
  imageId?: string
  imageUrl?: string
  photoCategory?: PhotoCategory
}

export interface JournalEntry {
  id: string
  createdAt: number
  type: JournalEntryType
  notes: string
  details?: Record<string, any> | PhotoDetails
}

export interface PlantHistoryEntry {
  day: number
  height: number
  health: number
  stressLevel: number
  medium: {
    ph: number
    ec: number
    moisture: number
  }
}

export interface HarvestData {
  wetWeight: number
  dryWeight: number
  terpeneRetentionPercent: number
  moldRiskPercent: number
  dryingEnvironment: {
    temperature: number
    humidity: number
  }
  currentDryDay: number
  currentCureDay: number
  jarHumidity: number
  finalQuality: number
  chlorophyllPercent: number
  terpeneProfile: Record<string, number>
  cannabinoidProfile: {
    thc: number
    cbn: number
  }
  lastBurpDay: number
}

export interface Plant {
  id: string
  name: string
  strain: Strain
  createdAt: number
  lastUpdated: number
  age: number // in days
  stage: PlantStage
  height: number // in cm
  biomass: number // abstract growth value
  health: number // 0-100
  stressLevel: number // 0-100
  nutrientPool: number
  problems: PlantProblem[]
  tasks: Task[]
  journal: JournalEntry[]
  history: PlantHistoryEntry[]
  isTopped: boolean
  lstApplied: number
  environment: {
    internalTemperature: number
    internalHumidity: number
    vpd: number
    co2Level: number
  }
  medium: {
    ph: number
    ec: number
    moisture: number
    microbeHealth: number
  }
  rootSystem: {
    health: number
    microbeActivity: number
    rootMass: number
  }
  structuralModel: {
    branches: number
    nodes: number
    leafCount: number
  }
  equipment: {
    light: { wattage: number; isOn: boolean; lightHours: number }
    fan: { isOn: boolean; speed: number }
  }
  harvestData?: HarvestData
}

export interface GrowSetup {
  potSize: number
  medium: 'Soil' | 'Coco' | 'Hydro'
  lightHours: number
}

export interface AIResponse {
  title: string
  content: string
}

export interface RecommendationItem {
  name: string
  price: number
  rationale: string
  watts?: number
}

export type RecommendationCategory =
  | 'tent'
  | 'light'
  | 'ventilation'
  | 'circulationFan'
  | 'pots'
  | 'soil'
  | 'nutrients'
  | 'extra'

export type Recommendation = {
  [key in RecommendationCategory]: RecommendationItem
} & { proTip: string }

export interface PlantDiagnosisResponse {
  title: string
  confidence: number
  diagnosis: string
  immediateActions: string
  longTermSolution: string
  prevention: string
}

export interface MentorMessage {
  role: 'user' | 'model'
  title: string
  content: string
  uiHighlights?: { elementId: string; plantId?: string }[]
}

export interface StructuredGrowTips {
  nutrientTip: string
  trainingTip: string
  environmentalTip: string
  proTip: string
}

export interface DeepDiveGuide {
  introduction: string
  stepByStep: string[]
  prosAndCons: {
    pros: string[]
    cons: string[]
  }
  proTip: string
}

// FIX: Add missing KnowledgeArticle interface
export interface KnowledgeArticle {
  id: string
  titleKey: string
  contentKey: string
  tags: string[]
  triggers: {
    ageInDays?: { min: number; max: number }
    plantStage?: PlantStage | PlantStage[]
    activeProblems?: ProblemType[]
  }
}

export interface SavedExport {
  id: string
  createdAt: number
  name: string
  source: 'selected' | 'all'
  format: ExportFormat
  count: number
  strainIds: string[]
  notes?: string
}

export interface SavedSetup {
  id: string
  createdAt: number
  name: string
  recommendation: Recommendation
  totalCost: number
  sourceDetails: {
    plantCount: PlantCount
    area: string
    budget: string
    growStyle: string
  }
}

export interface SavedStrainTip extends AIResponse {
  id: string
  createdAt: number
  strainId: string
  strainName: string
  imageUrl?: string
}

export interface ArchivedMentorResponse extends Omit<MentorMessage, 'role'> {
  id: string
  createdAt: number
  query: string
}

export interface ArchivedAdvisorResponse extends AIResponse {
  id: string
  createdAt: number
  plantId: string
  plantStage: PlantStage
  query: string
}

export interface Seed {
  id: string
  strainId: string
  strainName: string
  createdAt: number
}

export interface Experiment {
  id: string
  createdAt: number
  name: string
  basePlantId: string
  basePlantName: string
  scenarioDescription: string
  durationDays: number
  originalHistory: PlantHistoryEntry[]
  modifiedHistory: PlantHistoryEntry[]
  originalFinalState: Plant
  modifiedFinalState: Plant
}

export interface Scenario {
  id: string
  titleKey: string
  descriptionKey: string
  durationDays: number
  plantAModifier: { action: ScenarioAction; day: number }
  plantBModifier: { action: ScenarioAction; day: number }
}

export interface AdvancedFilterState {
  thcRange: [number, number]
  cbdRange: [number, number]
  floweringRange: [number, number]
  selectedDifficulties: DifficultyLevel[]
  selectedYields: YieldLevel[]
  selectedHeights: HeightLevel[]
  selectedAromas: string[]
  selectedTerpenes: string[]
}

export interface AppSettings {
  fontSize: 'sm' | 'base' | 'lg'
  language: Language
  theme: Theme
  defaultView: View
  strainsViewSettings: {
    defaultSortKey: SortKey
    defaultSortDirection: SortDirection
    defaultViewMode: 'list' | 'grid'
    visibleColumns: Record<string, boolean>
  }
  notificationsEnabled: boolean
  notificationSettings: {
    stageChange: boolean
    problemDetected: boolean
    harvestReady: boolean
    newTask: boolean
  }
  onboardingCompleted: boolean
  simulationProfile: 'beginner' | 'expert' | 'experimental' | 'custom'
  simulationSettings: {
    difficulty: 'easy' | 'medium' | 'hard' | 'custom'
    autoJournaling: {
      stageChanges: boolean
      problems: boolean
      tasks: boolean
    }
    customDifficultyModifiers: {
      pestPressure: number
      nutrientSensitivity: number
      environmentalStability: number
    }
    autoAdvance: boolean
    speed: string
  }
  defaultGrowSetup: {
    light: { type: 'LED' | 'HPS' | 'CFL'; wattage: number }
    potSize: number
    medium: 'Soil' | 'Coco' | 'Hydro'
  }
  defaultJournalNotes: {
    watering: string
    feeding: string
  }
  defaultExportSettings: {
    source: 'all' | 'selected'
    format: ExportFormat
  }
  lastBackupTimestamp?: number
  accessibility: {
    reducedMotion: boolean
    dyslexiaFont: boolean
  }
  uiDensity: UiDensity
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  tts: TTSSettings
  showArchivedInPlantsView: boolean
}

export interface Command {
  id: string
  title: string
  subtitle?: string
  icon: React.FC
  group: string
  action: () => void
  keywords?: string
  shortcut?: string[]
  isHeader?: boolean
}

export interface Notification {
  id: number
  message: string
  type: NotificationType
}

export interface StoredImageData {
  id: string
  data: string // base64 data URL
  createdAt: number
}

export interface LexiconEntry {
  key: string
  category: 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'General'
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
    ageInDays?: { min: number; max: number }
    plantStage?: PlantStage | PlantStage[]
    activeProblems?: ProblemType[]
  }
}

export interface StrainTranslationData {
  description?: string
  typeDetails?: string
  genetics?: string
  yieldDetails?: {
    indoor: string
    outdoor: string
  }
  heightDetails?: {
    indoor: string
    outdoor: string
  }
}

export interface SpeechQueueItem {
  id: string
  text: string
}

export interface TTSSettings {
  enabled: boolean
  voiceName: string | null
  rate: number
  pitch: number
}

export interface GenealogyNode {
    name: string;
    id: string;
    type?: StrainType;
    children?: GenealogyNode[];
}

// Redux State Interfaces
export interface SimulationState {
  plants: EntityState<Plant>
  plantSlots: (string | null)[]
  selectedPlantId: string | null
  devSpeedMultiplier: number
}

export interface UserStrainsState extends EntityState<Strain> {}

export interface BreedingState {
  collectedSeeds: Seed[]
  breedingSlots: {
    parentA: string | null
    parentB: string | null
  }
}

export interface KnowledgeProgress {
  [sectionId: string]: string[]
}

export interface SandboxState {
  savedExperiments: Experiment[]
  isLoading: boolean
  error: string | null
}

export interface GenealogyState {
    computedTrees: Record<string, GenealogyNode>;
    isLoading: boolean;
    error: string | null;
}