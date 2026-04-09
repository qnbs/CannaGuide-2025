# Equipment & Knowledge Calculators API Reference

> Pure-formula calculator services for grow room environment optimization.
> All inputs validated with Zod schemas. No side effects, no network calls.

**Source files:**

| Module                | Path                                                        |
| --------------------- | ----------------------------------------------------------- |
| Equipment Calculators | `apps/web/services/equipmentCalculatorService.ts`           |
| Knowledge Calculators | `apps/web/services/knowledgeCalculatorService.ts`           |
| Calculator Hub UI     | `apps/web/components/views/knowledge/CalculatorHubView.tsx` |

---

## Equipment Calculators

### CO2 Enrichment

```typescript
calculateCo2(input: Co2Input): Co2Result
```

**Schema:**

```typescript
Co2InputSchema = z.object({
    roomVolume: z.number().min(0.1), // cubic meters
    currentPpm: z.number().min(0), // current CO2 ppm
    targetPpm: z.number().min(0), // desired CO2 ppm
    ach: z.number().min(0), // air changes per hour
})
```

**Result:**

```typescript
interface Co2Result {
    initialBoostLiters: number // Liters of CO2 for initial boost
    maintenanceRatePerHour: number // Liters/hour to maintain target
    initialBoostGrams: number // Grams (liters * CO2_DENSITY_G_PER_L)
    status: 'enrichment' | 'ambient' | 'excess'
}
```

**Constants:** `CO2_DENSITY_G_PER_L = 1.96`, `AMBIENT_CO2_PPM = 400`

---

### Humidity Deficit (HD)

```typescript
calculateHumidityDeficit(
    input: HumidityDeficitInput,
    stage?: HdGrowthStage,
): HumidityDeficitResult
```

Uses the Buck equation for saturation vapor pressure (SVP).

**Schema:**

```typescript
HumidityDeficitInputSchema = z.object({
    tempC: z.number().min(-40).max(60), // Temperature in Celsius
    rhPercent: z.number().min(0).max(100), // Relative humidity %
})
```

**Growth Stages:** `'seedling' | 'vegetative' | 'earlyFlower' | 'lateFlower'`

**Result:**

```typescript
interface HumidityDeficitResult {
    ahSat: number // Absolute humidity at saturation (g/m3)
    ahActual: number // Actual absolute humidity (g/m3)
    hd: number // Humidity deficit (g/m3)
    svpKpa: number // Saturation vapor pressure (kPa)
    status: 'low' | 'optimal' | 'high'
    optimalRange: HdStageRange // { min, max } for selected stage
}
```

**Optimal Ranges:**

| Stage       | Min (g/m3) | Max (g/m3) |
| ----------- | ---------- | ---------- |
| seedling    | 5          | 10         |
| vegetative  | 5          | 10         |
| earlyFlower | 4          | 8          |
| lateFlower  | 3          | 6          |

**Helper Functions:**

```typescript
svpBuck(tempC: number): number           // Buck SVP in kPa
svpToAhSat(svpKpa: number, tempC: number): number  // SVP to AH (g/m3)
```

---

### Light Hanging Height

```typescript
calculateLightHanging(input: LightHangingInput): LightHangingResult
```

**Schema:**

```typescript
LightHangingInputSchema = z.object({
    wattage: z.number().min(1),
    lightType: z.enum(['led', 'hps', 'cmh', 't5']),
    targetPpfd: z.number().min(1), // Target PPFD (umol/m2/s)
})
```

**Result:**

```typescript
interface LightHangingResult {
    recommendedCm: number // Optimal hanging distance
    minCm: number // Minimum safe distance
    maxCm: number // Maximum useful distance
    ppfdAtRecommended: number // PPFD at recommended height
    dli18h: number // DLI assuming 18h photoperiod
    status: 'close' | 'optimal' | 'far'
}
```

**Light Efficiency (umol/J):**

| Type | Efficiency |
| ---- | ---------- |
| LED  | 2.8        |
| HPS  | 1.4        |
| CMH  | 1.9        |
| T5   | 0.8        |

---

### Timer Schedule

```typescript
calculateTimerSchedule(input: TimerScheduleInput): TimerScheduleResult
```

**Schema:**

```typescript
TimerScheduleInputSchema = z.object({
    growthStage: z.enum(['seedling', 'veg', 'flower', 'autoflower']),
    targetDliMolPerM2: z.number().min(0).optional(),
    ppfd: z.number().min(0).optional(),
})
```

**Result:**

```typescript
interface TimerScheduleResult {
    onHours: number
    offHours: number
    dli: number | null
    schedule: string // e.g. "18/6"
    dliStatus: 'low' | 'optimal' | 'high' | 'unknown'
    recommendedDliRange: { min: number; max: number }
}
```

**Stage Defaults:**

| Stage      | On  | Off | DLI Min | DLI Max |
| ---------- | --- | --- | ------- | ------- |
| seedling   | 18h | 6h  | 10      | 20      |
| veg        | 18h | 6h  | 20      | 40      |
| flower     | 12h | 12h | 30      | 55      |
| autoflower | 20h | 4h  | 25      | 45      |

---

## Knowledge Calculators

### Terpene Entourage Effect

```typescript
calculateTerpeneEntourage(input: TerpeneEntourageInput): TerpeneEntourageResult
```

**Schema:**

```typescript
TerpeneEntourageInputSchema = z.object({
    terpenes: z
        .array(
            z.object({
                name: z.string(),
                percent: z.number().min(0).max(100),
            }),
        )
        .min(1),
    thc: z.number().min(0).max(100),
    cbd: z.number().min(0).max(100),
    cbg: z.number().min(0).max(100),
})
```

**Result:**

```typescript
interface TerpeneEntourageResult {
    entourageScore: number // 0-100 composite score
    dominantTerpene: string
    synergyPairs: TerpeneSynergyPair[]
    profileType: 'relaxing' | 'energizing' | 'balanced' | 'medicinal'
    diversityIndex: number // Shannon diversity
}

interface TerpeneSynergyPair {
    a: string
    b: string
    strength: 'low' | 'medium' | 'high'
}
```

**Known Terpenes (12):** Myrcene, Limonene, Caryophyllene, Linalool,
Pinene, Terpinolene, Humulene, Ocimene, Bisabolol, Nerolidol,
Valencene, Geraniol.

---

### Transpiration Rate

```typescript
calculateTranspiration(input: TranspirationInput): TranspirationResult
```

**Schema:**

```typescript
TranspirationInputSchema = z.object({
    vpd: z.number().min(0), // kPa
    gsmmol: z.number().min(0), // Stomatal conductance (mmol/m2/s)
    lai: z.number().min(0), // Leaf Area Index
    hoursPerDay: z.number().min(0).max(24).optional(), // default: 18
})
```

**Result:**

```typescript
interface TranspirationResult {
    leafRate: number // mmol/m2/s
    canopyRate: number // mmol/m2/s (leaf * LAI)
    dailyWaterMlPerM2: number // ml/m2/day
    status: 'low' | 'optimal' | 'high'
}
```

---

### EC/TDS Conversion

```typescript
calculateEcTds(input: EcTdsInput): EcTdsResult
```

**Schema:**

```typescript
EcTdsInputSchema = z.object({
    ecMs: z.number().min(0).optional(),
    tds500: z.number().min(0).optional(),
    tds640: z.number().min(0).optional(),
    tds700: z.number().min(0).optional(),
    phReadings: z.array(z.number()).optional(), // For drift analysis
})
```

Provide any one of `ecMs`, `tds500`, `tds640`, or `tds700` and the
service computes all conversions.

**Result:**

```typescript
interface EcTdsResult {
    ecMs: number
    tds500: number // EC * 500
    tds640: number // EC * 640
    tds700: number // EC * 700
    phDrift?: PhDriftResult
}

interface PhDriftResult {
    slopePerDay: number
    projectedDay7: number
    trend: 'rising' | 'stable' | 'falling'
}
```

`phDrift` is computed when `phReadings` has 2+ values using linear
regression to project 7-day pH trend.

---

### Light Spectrum Analysis

```typescript
calculateLightSpectrum(input: LightSpectrumInput): LightSpectrumResult
```

**Schema:**

```typescript
LightSpectrumInputSchema = z.object({
    ppfd: z.number().min(0),
    redPercent: z.number().min(0).max(100),
    bluePercent: z.number().min(0).max(100),
    hoursPerDay: z.number().min(0).max(24),
    stage: z.enum(['seedling', 'veg', 'flower', 'lateFlower']).optional(),
})
```

**Result:**

```typescript
interface LightSpectrumResult {
    dli: number // Daily Light Integral (mol/m2/d)
    photosyntheticEfficiency: number // 0-1 efficiency estimate
    terpeneBoostPercent: number // UV-A/blue spectrum terpene benefit
    recommendedRatio: string // e.g. "6:1 Red:Blue"
    ratioGap: number // Deviation from optimal ratio
    status: 'suboptimal' | 'good' | 'optimal'
}
```

**Optimal Red:Blue Ratios by Stage:**

| Stage      | Ratio |
| ---------- | ----- |
| seedling   | 2:1   |
| veg        | 3:1   |
| flower     | 6:1   |
| lateFlower | 8:1   |

---

### Cannabinoid Ratio

```typescript
calculateCannabinoidRatio(input: CannabinoidRatioInput): CannabinoidRatioResult
```

**Schema:**

```typescript
CannabinoidRatioInputSchema = z.object({
    thc: z.number().min(0).max(100),
    cbd: z.number().min(0).max(100),
    cbg: z.number().min(0).max(100),
})
```

**Result:**

```typescript
interface CannabinoidRatioResult {
    ratioLabel: string // e.g. "20:1 THC:CBD"
    profileType: 'thcDominant' | 'cbdDominant' | 'balanced' | 'cbgForward'
    entourageNote: string // Human-readable entourage observation
    thcPct: number
    cbdPct: number
    cbgPct: number
    harmonyScore: number // 0-100 balance measure
}
```
