// ---------------------------------------------------------------------------
// calculatorTypes.ts -- Consolidated Calculator Type Exports
//
// Re-exports all Zod schemas, input types, and result types from the
// individual calculator service modules. Provides a single import point
// for components and tests that need multiple calculator types.
//
// Also exports the shared UnitSystem type used across calculators.
// ---------------------------------------------------------------------------

// Shared
export type { UnitSystem } from '@/utils/unitConversion'

// Equipment Calculator types
export {
    Co2InputSchema,
    HumidityDeficitInputSchema,
    LightHangingInputSchema,
    TimerScheduleInputSchema,
    HD_OPTIMAL_RANGES,
    LIGHT_EFFICIENCY,
} from '@/services/equipmentCalculatorService'

export type {
    Co2Input,
    Co2Result,
    HumidityDeficitInput,
    HumidityDeficitResult,
    HdGrowthStage,
    HdStageRange,
    LightHangingInput,
    LightHangingResult,
    LightType,
    TimerScheduleInput,
    TimerScheduleResult,
    TimerGrowthStage,
} from '@/services/equipmentCalculatorService'

// Knowledge Calculator types
export {
    TerpeneEntourageInputSchema,
    TranspirationInputSchema,
    EcTdsInputSchema,
    LightSpectrumInputSchema,
    CannabinoidRatioInputSchema,
} from '@/services/knowledgeCalculatorService'

export type {
    TerpeneEntourageInput,
    TerpeneEntourageResult,
    TerpeneSynergyPair,
    KnownTerpeneName,
    TranspirationInput,
    TranspirationResult,
    EcTdsInput,
    EcTdsResult,
    PhDriftResult,
    LightSpectrumInput,
    LightSpectrumResult,
    CannabinoidRatioInput,
    CannabinoidRatioResult,
} from '@/services/knowledgeCalculatorService'
