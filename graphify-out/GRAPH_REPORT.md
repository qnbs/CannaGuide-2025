# Graph Report - CannaGuide-2025 (2026-05-05)

## Corpus Check

- 941 files · ~1,250,813 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 3358 nodes · 4895 edges · 70 communities detected
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 1184 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 119|Community 119]]
- [[_COMMUNITY_Community 129|Community 129]]
- [[_COMMUNITY_Community 132|Community 132]]
- [[_COMMUNITY_Community 136|Community 136]]
- [[_COMMUNITY_Community 139|Community 139]]
- [[_COMMUNITY_Community 141|Community 141]]
- [[_COMMUNITY_Community 163|Community 163]]

## God Nodes (most connected - your core abstractions)

1. `t()` - 91 edges
2. `PlantSimulationService` - 65 edges
3. `set()` - 62 edges
4. `GeminiService` - 62 edges
5. `String()` - 54 edges
6. `getT()` - 46 edges
7. `WorkerBusImpl` - 39 edges
8. `captureLocalAiError()` - 37 edges
9. `localizeStr()` - 37 edges
10. `CrdtService` - 24 edges

## Surprising Connections (you probably didn't know these)

- `set()` --calls--> `extractEntries()` [INFERRED]
  apps/web/workers/hydroForecastWorker.test.ts → scripts/consolidate-locale-strains.mjs
- `set()` --calls--> `parseCSP()` [INFERRED]
  apps/web/workers/hydroForecastWorker.test.ts → scripts/security/check-csp-consistency.mjs
- `String()` --calls--> `normalizeFp()` [INFERRED]
  apps/web/components/views/plants/detailedPlantViewTabs/JournalTab.tsx → scripts/setup-codespaces-signing-local.mjs
- `run()` --calls--> `ok()` [INFERRED]
  apps/desktop/src-tauri/src/lib.rs → scripts/graphify-mcp-doctor.mjs
- `onwarn()` --calls--> `warn()` [INFERRED]
  apps/web/vite.config.ts → scripts/check-commit-identity.mjs

## Communities

### Community 0 - "Community 0"

Cohesion: 0.01
Nodes (146): exportAnalyticsCsv(), computeVpd(), simulateEcDrift(), simulateLightSpectrum(), simulateTranspiration(), simulateVpd(), svp(), vpdStatus() (+138 more)

### Community 1 - "Community 1"

Cohesion: 0.02
Nodes (54): AiDiagnosticsModalContainer(), AnalyticsEngine, estimateMilestoneForPlant(), AtomicsChannel, buildDuplicateCountMap(), buildNormalizedNameMap(), getFileContentAtRef(), getFilesAtRef() (+46 more)

### Community 2 - "Community 2"

Cohesion: 0.02
Nodes (131): checkStorageQuota(), getConnectionInfo(), getDeviceMemoryGB(), getEffectiveDeviceMemoryGB(), getGpuAdapterDescription(), getGpuAdapterInfo(), getPerformanceMemory(), isHighEndTablet() (+123 more)

### Community 3 - "Community 3"

Cohesion: 0.02
Nodes (65): getDynamicLoadingMessages(), handleSaveDiagnosisResponse(), handleSaveResponse(), mapAiErrorMessage(), ChemotypeService, dominantKey(), formatSyncDate(), handleCopyEncryptionKey() (+57 more)

### Community 4 - "Community 4"

Cohesion: 0.02
Nodes (50): CloudTtsService, isRateLimited(), recordRequest(), registerServiceWorker(), addEventListener(), MockWorker, removeEventListener(), playConfirmationSound() (+42 more)

### Community 5 - "Community 5"

Cohesion: 0.04
Nodes (48): acquireSlot(), checkRateLimit(), currentMonthKey(), getAuditLog(), getBudgetUsagePercent(), getMonthlyBudget(), getRemainingRequests(), getTodayUsage() (+40 more)

### Community 6 - "Community 6"

Cohesion: 0.04
Nodes (75): getBatteryManager(), getCacheBreakdown(), buildDiagnosisContent(), classifyLeafImage(), classifyPlantImage(), classifySeverity(), enrichWithKnowledge(), fallbackDiagnosis() (+67 more)

### Community 7 - "Community 7"

Cohesion: 0.04
Nodes (38): extractEntries(), mergeIntoFile(), readExistingKeys(), isFiniteNumber(), isGenealogyStateCorrupt(), isValidCachedTreeRoot(), resolveLayoutOrientation(), resolveSelectedStrainId() (+30 more)

### Community 8 - "Community 8"

Cohesion: 0.07
Nodes (8): PlantSimulationService, daysMs(), simulate(), buildFinalPreloadStatus(), formatReportDetails(), waitForRetryBackoff(), secureRandom(), applyAction()

### Community 9 - "Community 9"

Cohesion: 0.05
Nodes (51): buildHeaders(), fetchByPostalCode(), fetchEndpoint(), getApiKey(), isCansativaAvailable(), normalizeMenuItem(), normalizePartner(), normalizeProduct() (+43 more)

### Community 10 - "Community 10"

Cohesion: 0.04
Nodes (21): DiagnosisResult(), handleCapture(), handleGetDiagnosis(), t(), genotypeLabel(), getSafeNumericValue(), sym(), crossStrains() (+13 more)

### Community 11 - "Community 11"

Cohesion: 0.07
Nodes (26): base64ToUint8Array(), CrdtError, CrdtService, reportCrdtError(), uint8ArrayToBase64(), checkLoopDetector(), destroyCrdtSyncBridge(), enqueueBridgeWrite() (+18 more)

### Community 12 - "Community 12"

Cohesion: 0.07
Nodes (55): buildAdviceStreamPrompt(), buildDiagnosisStreamPrompt(), buildMentorStreamPrompt(), parseAiStreamResult(), parseMentorStreamResult(), analyzeCo2(), analyzeEc(), analyzeLightHours() (+47 more)

### Community 13 - "Community 13"

Cohesion: 0.04
Nodes (35): navigateToAnalytics(), expectNoCrashPatterns(), ok(), bootFreshAppPastOnboarding(), bootFreshAppWithLegalGates(), closeOnboardingIfVisible(), expectNoCrashPatterns(), expectShellVisible() (+27 more)

### Community 14 - "Community 14"

Cohesion: 0.08
Nodes (28): formatPlantLine(), LocalAiFallbackService, safe(), handleAnalyze(), collectStats(), formatDate(), generateAiSummary(), generateHeuristicSummary() (+20 more)

### Community 15 - "Community 15"

Cohesion: 0.05
Nodes (31): animate(), createPlant(), disposeSceneResources(), handleContextRestored(), handleVisibility(), startAnimation(), render(), createAtmosphereParticles() (+23 more)

### Community 16 - "Community 16"

Cohesion: 0.07
Nodes (39): detectMimeTypeFromBase64(), normalizeImageDataUrl(), createGenealogyMigrationState(), createSnapshotDiff(), deepMergeSettings(), ensureEntityAdapterShape(), ensureGenealogyShape(), ensureLegacyCannabinoidProfile() (+31 more)

### Community 17 - "Community 17"

Cohesion: 0.08
Nodes (26): async(), handleCheckNow(), handleCopyBatchLink(), handleEnable(), composeBatchMessage(), getDaysToHarvest(), getEnabledBatchReminders(), getRelevantReminders() (+18 more)

### Community 18 - "Community 18"

Cohesion: 0.08
Nodes (31): getSafeStrainType(), isValidRange(), onSubmit(), parseCommaSeparatedTokens(), t(), validate(), resolveDiscoveredToStrain(), mergeStrainCatalogForUpdate() (+23 more)

### Community 19 - "Community 19"

Cohesion: 0.1
Nodes (32): buildProviderMessages(), callAnthropic(), callOpenAiCompatible(), clearProviderApiKey(), generateTextWithProvider(), getActiveProviderConfig(), getActiveProviderId(), getMaskedProviderApiKey() (+24 more)

### Community 20 - "Community 20"

Cohesion: 0.08
Nodes (24): handleCapture(), handleRetake(), startCamera(), toDataUrl(), getWebGLSupportError(), rawImageToDataUrl(), sendProgress(), addSectionHeader() (+16 more)

### Community 21 - "Community 21"

Cohesion: 0.14
Nodes (11): airflowToLevel(), mediumToVPDMedium(), stageToGrowthStage(), VPDSimulationService, calculateVPD(), estimateTranspiration(), getDynamicLeafOffset(), getTargetVPD() (+3 more)

### Community 23 - "Community 23"

Cohesion: 0.21
Nodes (7): cleanedCanonicalName(), collapseNodes(), GeneticsService, parseParentNames(), splitCrossGenetics(), stripParentheticalSuffix(), uniqueById()

### Community 24 - "Community 24"

Cohesion: 0.15
Nodes (7): ensureObjectStore(), ensureOfflineActionsStore(), ensureStrainIndexes(), performTx(), replaceStoreAtomically(), runMigrations(), withRetry()

### Community 25 - "Community 25"

Cohesion: 0.18
Nodes (4): buildBucketKey(), buildRawEntry(), calculateVpd(), groupEntriesByBucket()

### Community 26 - "Community 26"

Cohesion: 0.35
Nodes (12): buildPhotoTimelineMetadata(), clampTimestamp(), extractExifTimestampFromJpeg(), findExifIfdOffset(), formatExifDateString(), isJpegFile(), isJpegView(), parseCandidateExifTag() (+4 more)

### Community 27 - "Community 27"

Cohesion: 0.17
Nodes (1): addPenaltyFactor()

### Community 28 - "Community 28"

Cohesion: 0.35
Nodes (9): clamp01(), scoreBonus(), scoreCannabinoid(), scoreDataQuality(), scoreDifficulty(), scoreEffects(), scoreFloweringType(), scoreStrain() (+1 more)

### Community 29 - "Community 29"

Cohesion: 0.31
Nodes (9): deleteQueuedAction(), getQueuedActions(), getStoredReminders(), notifyDueReminders(), openDB(), openReminderDB(), replaceReminders(), syncData() (+1 more)

### Community 30 - "Community 30"

Cohesion: 0.18
Nodes (1): MockWorker

### Community 31 - "Community 31"

Cohesion: 0.4
Nodes (8): clearCache(), deleteModel(), getCacheSize(), getModelInfo(), getRootDir(), listModels(), readModel(), writeModel()

### Community 32 - "Community 32"

Cohesion: 0.38
Nodes (7): cacheGet(), cacheSet(), calcGeneticScore(), calcGrowTechScore(), calculateGeneticTrendMatchScore(), calculateGrowTechMatchScore(), scoreOf()

### Community 33 - "Community 33"

Cohesion: 0.33
Nodes (7): addEffectScore(), applyCannabinoidContribution(), buildSummary(), deriveSynergies(), deriveTerpeneScores(), EntourageService, getProfileLabel()

### Community 35 - "Community 35"

Cohesion: 0.36
Nodes (5): configureSshSigning(), gitSet(), gitUnset(), restoreSshKeyFromSecret(), run()

### Community 36 - "Community 36"

Cohesion: 0.25
Nodes (3): useAsync(), useStorageEstimate(), useYieldPrediction()

### Community 38 - "Community 38"

Cohesion: 0.39
Nodes (5): consentKey(), grantProviderConsent(), hasProviderConsent(), revokeAllConsents(), revokeProviderConsent()

### Community 39 - "Community 39"

Cohesion: 0.39
Nodes (5): emit(), reportWebLlmError(), reportWebLlmProgress(), reportWebLlmReady(), resetWebLlmLoadingState()

### Community 40 - "Community 40"

Cohesion: 0.43
Nodes (7): ensurePubFromPrivate(), fingerprintFromPubContent(), fingerprintFromPubPath(), gitEmail(), gitGlobal(), normalizeFp(), run()

### Community 42 - "Community 42"

Cohesion: 0.38
Nodes (4): detectLanguage(), levenshtein(), parseCommand(), processTranscript()

### Community 44 - "Community 44"

Cohesion: 0.38
Nodes (3): calculateHumidityDeficit(), svpBuck(), svpToAhSat()

### Community 45 - "Community 45"

Cohesion: 0.38
Nodes (3): makePlant(), makeSimulationState(), makeStrain()

### Community 46 - "Community 46"

Cohesion: 0.43
Nodes (6): buildVEvent(), downloadICalFile(), escapeICalText(), foldLine(), formatICalDate(), generateICalString()

### Community 47 - "Community 47"

Cohesion: 0.29
Nodes (1): MockWorker

### Community 48 - "Community 48"

Cohesion: 0.62
Nodes (6): getChangedFiles(), hasRef(), main(), resolveBaseRef(), runGit(), tryRunGit()

### Community 49 - "Community 49"

Cohesion: 0.62
Nodes (6): getChangedFiles(), hasRef(), main(), resolveBaseRef(), runGit(), tryRunGit()

### Community 50 - "Community 50"

Cohesion: 0.6
Nodes (5): useActiveSensorSource(), useCurrentReading(), useSensorConnectionState(), useSensorData(), useSensorHistory()

### Community 52 - "Community 52"

Cohesion: 0.6
Nodes (5): areNotificationsMuted(), findStageChangeEntry(), isWithinQuietHours(), notifyPlantEvents(), showBrowserNotification()

### Community 53 - "Community 53"

Cohesion: 0.33
Nodes (1): ThrowingWorker

### Community 56 - "Community 56"

Cohesion: 0.53
Nodes (4): altitudeCorrectionFactor(), barometricPressure(), calculateSVP(), calculateVPD()

### Community 59 - "Community 59"

Cohesion: 0.4
Nodes (1): WorkerBusError

### Community 64 - "Community 64"

Cohesion: 0.5
Nodes (2): isFavorite(), t()

### Community 71 - "Community 71"

Cohesion: 0.4
Nodes (2): createIndexedDbLruCache(), makeCache()

### Community 81 - "Community 81"

Cohesion: 0.5
Nodes (2): useEventListener(), useOnlineStatus()

### Community 83 - "Community 83"

Cohesion: 0.67
Nodes (2): clamp(), weightedMovingAverage()

### Community 88 - "Community 88"

Cohesion: 0.5
Nodes (2): createDefaultGrow(), getInitialState()

### Community 92 - "Community 92"

Cohesion: 0.67
Nodes (2): cn(), t()

### Community 96 - "Community 96"

Cohesion: 0.67
Nodes (2): formatValue(), metricUnit()

### Community 100 - "Community 100"

Cohesion: 0.67
Nodes (2): applyFormat(), handleContentChange()

### Community 102 - "Community 102"

Cohesion: 0.5
Nodes (1): ScenarioService

### Community 104 - "Community 104"

Cohesion: 0.5
Nodes (1): MockJsPDF

### Community 105 - "Community 105"

Cohesion: 0.5
Nodes (1): MockJSZip

### Community 108 - "Community 108"

Cohesion: 0.67
Nodes (2): makeGrowPlant(), makePlant()

### Community 111 - "Community 111"

Cohesion: 1.0
Nodes (2): generateReading(), isDayPhase()

### Community 119 - "Community 119"

Cohesion: 1.0
Nodes (2): openDB(), performTx()

### Community 129 - "Community 129"

Cohesion: 1.0
Nodes (2): estimateEta(), formatTime()

### Community 132 - "Community 132"

Cohesion: 1.0
Nodes (2): makeDataView(), mockCharacteristic()

### Community 136 - "Community 136"

Cohesion: 0.67
Nodes (1): MockJsPDF

### Community 139 - "Community 139"

Cohesion: 1.0
Nodes (2): makeDeps(), makeTimer()

### Community 141 - "Community 141"

Cohesion: 1.0
Nodes (2): loadConfig(), main()

### Community 163 - "Community 163"

Cohesion: 1.0
Nodes (1): MLCEngine

## Knowledge Gaps

- **2 isolated node(s):** `AppInfo`, `MLCEngine`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 27`** (12 nodes): `predictiveAnalyticsService.ts`, `addPenaltyFactor()`, `buildHumidityAlert()`, `buildPhAlert()`, `buildTemperatureAlert()`, `buildVpdAlert()`, `describeYieldImpact()`, `getAlertPenalty()`, `getHumidityPenalty()`, `getIdealRange()`, `getTemperaturePenalty()`, `getVpdPenalty()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (11 nodes): `workerBus.test.ts`, `autoRespond()`, `autoRespondError()`, `MockWorker`, `.addEventListener()`, `.emitError()`, `.postMessage()`, `.removeEventListener()`, `.respond()`, `.respondError()`, `.terminate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (7 nodes): `workerPool.sab.test.ts`, `createMockFactory()`, `MockWorker`, `.addEventListener()`, `.postMessage()`, `.removeEventListener()`, `.terminate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (6 nodes): `simulationSlice.test.ts`, `createTestStore()`, `daysMs()`, `ThrowingWorker`, `.postMessage()`, `.terminate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (5 nodes): `workerBus.types.ts`, `WorkerBusError`, `.constructor()`, `workerErr()`, `workerOk()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (5 nodes): `StrainListItem.tsx`, `getSafeStrainType()`, `handleActionClick()`, `isFavorite()`, `t()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (5 nodes): `indexedDbLruCache.test.ts`, `indexedDbLruCache.ts`, `createIndexedDbLruCache()`, `makeCache()`, `makeEntry()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (4 nodes): `useEventListener.ts`, `useOnlineStatus.ts`, `useEventListener()`, `useOnlineStatus()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (4 nodes): `hydroForecastWorker.ts`, `clamp()`, `isTrustedWorkerMessage()`, `weightedMovingAverage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (4 nodes): `growsSlice.test.ts`, `growsSlice.ts`, `createDefaultGrow()`, `getInitialState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (4 nodes): `StrainLookupSection.tsx`, `cn()`, `handler()`, `t()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (4 nodes): `ProactiveAlertBanner.tsx`, `formatValue()`, `metricUnit()`, `t()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 100`** (4 nodes): `EditResponseModal.tsx`, `applyFormat()`, `handleContentChange()`, `handleSave()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 102`** (4 nodes): `scenarioService.ts`, `ScenarioService`, `.getAllScenarios()`, `.getScenarioById()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (4 nodes): `exportService.test.ts`, `MockJsPDF`, `.constructor()`, `style()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 105`** (4 nodes): `backupService.test.ts`, `MockJSZip`, `.file()`, `.generateAsync()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (4 nodes): `growLogRagService.test.ts`, `makeGrowPlant()`, `makePlant()`, `makeVec()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 111`** (3 nodes): `server.mjs`, `generateReading()`, `isDayPhase()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (3 nodes): `indexedDBStorage.ts`, `openDB()`, `performTx()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (3 nodes): `ModelLoadingProgress.tsx`, `estimateEta()`, `formatTime()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (3 nodes): `webBluetoothSensorService.test.ts`, `makeDataView()`, `mockCharacteristic()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (3 nodes): `equipmentPlanExportService.test.ts`, `MockJsPDF`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (3 nodes): `webLlmService.test.ts`, `makeDeps()`, `makeTimer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (3 nodes): `loadConfig()`, `main()`, `lint-scopes.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 163`** (2 nodes): `optional-deps.d.ts`, `MLCEngine`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `Community 3` to `Community 0`, `Community 4`, `Community 5`, `Community 6`, `Community 11`, `Community 14`, `Community 15`, `Community 20`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `set()` connect `Community 1` to `Community 32`, `Community 0`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 11`, `Community 15`, `Community 17`, `Community 25`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `String()` connect `Community 0` to `Community 32`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 40`, `Community 9`, `Community 11`, `Community 20`, `Community 26`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 90 inferred relationships involving `t()` (e.g. with `mapAiErrorMessage()` and `handleTestVoice()`) actually correct?**
  _`t()` has 90 INFERRED edges - model-reasoned connections that need verification._
- **Are the 61 inferred relationships involving `set()` (e.g. with `updateMeasuredSize()` and `attachElementObserver()`) actually correct?**
  _`set()` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Are the 46 inferred relationships involving `String()` (e.g. with `checkOnboardingSync()` and `handleGenerateEncryptionKey()`) actually correct?**
  _`String()` has 46 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AppInfo`, `MLCEngine` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
