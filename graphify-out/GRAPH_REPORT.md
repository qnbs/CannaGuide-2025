# Graph Report - CannaGuide-2025 (2026-05-05)

## Corpus Check

- 940 files · ~1,250,465 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 3355 nodes · 4892 edges · 73 communities detected
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 1183 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 22|Community 22]]
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
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 114|Community 114]]
- [[_COMMUNITY_Community 122|Community 122]]
- [[_COMMUNITY_Community 132|Community 132]]
- [[_COMMUNITY_Community 135|Community 135]]
- [[_COMMUNITY_Community 139|Community 139]]
- [[_COMMUNITY_Community 142|Community 142]]
- [[_COMMUNITY_Community 144|Community 144]]
- [[_COMMUNITY_Community 166|Community 166]]

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
- `onwarn()` --calls--> `warn()` [INFERRED]
  apps/web/vite.config.ts → scripts/check-commit-identity.mjs
- `set()` --calls--> `main()` [INFERRED]
  apps/web/workers/hydroForecastWorker.test.ts → scripts/check-i18n-keys-usage.mjs
- `set()` --calls--> `detectCycles()` [INFERRED]
  apps/web/workers/hydroForecastWorker.test.ts → scripts/generate-service-map.mjs

## Communities

### Community 0 - "Community 0"

Cohesion: 0.01
Nodes (100): getDynamicLoadingMessages(), handleSaveDiagnosisResponse(), handleSaveResponse(), mapAiErrorMessage(), ChemotypeService, dominantKey(), formatSyncDate(), handleCopyEncryptionKey() (+92 more)

### Community 1 - "Community 1"

Cohesion: 0.02
Nodes (97): exportAnalyticsCsv(), computeVpd(), simulateEcDrift(), simulateLightSpectrum(), simulateTranspiration(), simulateVpd(), svp(), vpdStatus() (+89 more)

### Community 2 - "Community 2"

Cohesion: 0.02
Nodes (48): AiDiagnosticsModalContainer(), AnalyticsEngine, estimateMilestoneForPlant(), AtomicsChannel, getPerformanceMemory(), normalizeName(), run(), canUseSharedArrayBuffer() (+40 more)

### Community 3 - "Community 3"

Cohesion: 0.02
Nodes (125): checkStorageQuota(), getConnectionInfo(), getDeviceMemoryGB(), getEffectiveDeviceMemoryGB(), getGpuAdapterDescription(), getGpuAdapterInfo(), isHighEndTablet(), isMobileDevice() (+117 more)

### Community 4 - "Community 4"

Cohesion: 0.03
Nodes (80): getBatteryManager(), classifyLeafImage(), classifyPlantImage(), classifySeverity(), enrichWithKnowledge(), fallbackDiagnosis(), sanitizeText(), withTimeout() (+72 more)

### Community 5 - "Community 5"

Cohesion: 0.06
Nodes (23): acquireSlot(), resolveRagContext(), createCompactPlantSnapshot(), createLocalizedPrompt(), formatPlantContextForPrompt(), GeminiService, getEducationalUseOnlyInstruction(), getLocalAiService() (+15 more)

### Community 6 - "Community 6"

Cohesion: 0.04
Nodes (35): extractEntries(), mergeIntoFile(), readExistingKeys(), isFiniteNumber(), isGenealogyStateCorrupt(), isValidCachedTreeRoot(), resolveLayoutOrientation(), resolveSelectedStrainId() (+27 more)

### Community 7 - "Community 7"

Cohesion: 0.07
Nodes (8): PlantSimulationService, daysMs(), simulate(), buildFinalPreloadStatus(), formatReportDetails(), waitForRetryBackoff(), secureRandom(), applyAction()

### Community 8 - "Community 8"

Cohesion: 0.05
Nodes (54): buildHeaders(), fetchByPostalCode(), fetchEndpoint(), getApiKey(), isCansativaAvailable(), normalizeMenuItem(), normalizePartner(), normalizeProduct() (+46 more)

### Community 9 - "Community 9"

Cohesion: 0.06
Nodes (55): buildProviderMessages(), callAnthropic(), callOpenAiCompatible(), clearProviderApiKey(), generateTextWithProvider(), getActiveProviderConfig(), getActiveProviderId(), getMaskedProviderApiKey() (+47 more)

### Community 10 - "Community 10"

Cohesion: 0.04
Nodes (40): navigateToAnalytics(), expectNoCrashPatterns(), applyAdaptiveMode(), detectBatteryRecovered(), detectCriticalBattery(), detectEcoCondition(), isCriticalBattery(), isEcoMode() (+32 more)

### Community 11 - "Community 11"

Cohesion: 0.04
Nodes (21): DiagnosisResult(), handleCapture(), handleGetDiagnosis(), t(), genotypeLabel(), getSafeNumericValue(), sym(), crossStrains() (+13 more)

### Community 12 - "Community 12"

Cohesion: 0.06
Nodes (48): brotliSync(), getJsFiles(), isExempt(), isMainChunk(), main(), compareText(), escapeField(), formatTime() (+40 more)

### Community 13 - "Community 13"

Cohesion: 0.07
Nodes (26): base64ToUint8Array(), CrdtError, CrdtService, reportCrdtError(), uint8ArrayToBase64(), checkLoopDetector(), destroyCrdtSyncBridge(), enqueueBridgeWrite() (+18 more)

### Community 14 - "Community 14"

Cohesion: 0.07
Nodes (55): buildAdviceStreamPrompt(), buildDiagnosisStreamPrompt(), buildMentorStreamPrompt(), parseAiStreamResult(), parseMentorStreamResult(), analyzeCo2(), analyzeEc(), analyzeLightHours() (+47 more)

### Community 15 - "Community 15"

Cohesion: 0.1
Nodes (23): formatPlantLine(), LocalAiFallbackService, safe(), handleAnalyze(), LocalAiService, buildMentorPrompt(), formatJsonPrompt(), handleDeepDive() (+15 more)

### Community 16 - "Community 16"

Cohesion: 0.05
Nodes (32): animate(), createPlant(), disposeSceneResources(), handleContextRestored(), handleVisibility(), startAnimation(), render(), createAtmosphereParticles() (+24 more)

### Community 17 - "Community 17"

Cohesion: 0.07
Nodes (39): detectMimeTypeFromBase64(), normalizeImageDataUrl(), createGenealogyMigrationState(), createSnapshotDiff(), deepMergeSettings(), ensureEntityAdapterShape(), ensureGenealogyShape(), ensureLegacyCannabinoidProfile() (+31 more)

### Community 18 - "Community 18"

Cohesion: 0.08
Nodes (26): async(), handleCheckNow(), handleCopyBatchLink(), handleEnable(), composeBatchMessage(), getDaysToHarvest(), getEnabledBatchReminders(), getRelevantReminders() (+18 more)

### Community 19 - "Community 19"

Cohesion: 0.08
Nodes (31): getSafeStrainType(), isValidRange(), onSubmit(), parseCommaSeparatedTokens(), t(), validate(), resolveDiscoveredToStrain(), mergeStrainCatalogForUpdate() (+23 more)

### Community 20 - "Community 20"

Cohesion: 0.09
Nodes (23): handleCapture(), handleRetake(), startCamera(), toDataUrl(), rawImageToDataUrl(), sendProgress(), addSectionHeader(), buildDiagnosisRows() (+15 more)

### Community 21 - "Community 21"

Cohesion: 0.15
Nodes (11): airflowToLevel(), mediumToVPDMedium(), stageToGrowthStage(), VPDSimulationService, calculateVPD(), estimateTranspiration(), getDynamicLeafOffset(), getTargetVPD() (+3 more)

### Community 22 - "Community 22"

Cohesion: 0.11
Nodes (6): speakNatural(), TTSService, debouncedPersist(), getVoiceTelemetrySnapshot(), loadPersistedEvents(), recordVoiceEvent()

### Community 24 - "Community 24"

Cohesion: 0.21
Nodes (7): cleanedCanonicalName(), collapseNodes(), GeneticsService, parseParentNames(), splitCrossGenetics(), stripParentheticalSuffix(), uniqueById()

### Community 25 - "Community 25"

Cohesion: 0.15
Nodes (7): ensureObjectStore(), ensureOfflineActionsStore(), ensureStrainIndexes(), performTx(), replaceStoreAtomically(), runMigrations(), withRetry()

### Community 26 - "Community 26"

Cohesion: 0.23
Nodes (10): countStore(), getDbStats(), getQuotaInfo(), monitorStorageHealth(), openDb(), countStore(), deleteOldest(), openDb() (+2 more)

### Community 27 - "Community 27"

Cohesion: 0.18
Nodes (4): buildBucketKey(), buildRawEntry(), calculateVpd(), groupEntriesByBucket()

### Community 28 - "Community 28"

Cohesion: 0.35
Nodes (12): buildPhotoTimelineMetadata(), clampTimestamp(), extractExifTimestampFromJpeg(), findExifIfdOffset(), formatExifDateString(), isJpegFile(), isJpegView(), parseCandidateExifTag() (+4 more)

### Community 29 - "Community 29"

Cohesion: 0.23
Nodes (6): buildProcessWarnings(), getBurpDebtTone(), getJarHumidityTone(), getMoldRiskTone(), getPostHarvestRecommendations(), getTerpeneRetentionTone()

### Community 30 - "Community 30"

Cohesion: 0.35
Nodes (9): clamp01(), scoreBonus(), scoreCannabinoid(), scoreDataQuality(), scoreDifficulty(), scoreEffects(), scoreFloweringType(), scoreStrain() (+1 more)

### Community 31 - "Community 31"

Cohesion: 0.31
Nodes (9): deleteQueuedAction(), getQueuedActions(), getStoredReminders(), notifyDueReminders(), openDB(), openReminderDB(), replaceReminders(), syncData() (+1 more)

### Community 32 - "Community 32"

Cohesion: 0.18
Nodes (1): MockWorker

### Community 33 - "Community 33"

Cohesion: 0.4
Nodes (8): clearCache(), deleteModel(), getCacheSize(), getModelInfo(), getRootDir(), listModels(), readModel(), writeModel()

### Community 34 - "Community 34"

Cohesion: 0.38
Nodes (7): cacheGet(), cacheSet(), calcGeneticScore(), calcGrowTechScore(), calculateGeneticTrendMatchScore(), calculateGrowTechMatchScore(), scoreOf()

### Community 35 - "Community 35"

Cohesion: 0.22
Nodes (2): resolveApiErrorMessage(), resolveMentorErrorMessage()

### Community 36 - "Community 36"

Cohesion: 0.33
Nodes (7): addEffectScore(), applyCannabinoidContribution(), buildSummary(), deriveSynergies(), deriveTerpeneScores(), EntourageService, getProfileLabel()

### Community 38 - "Community 38"

Cohesion: 0.33
Nodes (7): clearAllCookies(), clearServiceWorkers(), deleteDatabase(), eraseAllData(), eraseSingleDatabase(), exportAllUserData(), readAllFromDatabase()

### Community 39 - "Community 39"

Cohesion: 0.36
Nodes (5): configureSshSigning(), gitSet(), gitUnset(), restoreSshKeyFromSecret(), run()

### Community 40 - "Community 40"

Cohesion: 0.25
Nodes (3): useAsync(), useStorageEstimate(), useYieldPrediction()

### Community 42 - "Community 42"

Cohesion: 0.39
Nodes (5): consentKey(), grantProviderConsent(), hasProviderConsent(), revokeAllConsents(), revokeProviderConsent()

### Community 43 - "Community 43"

Cohesion: 0.39
Nodes (5): emit(), reportWebLlmError(), reportWebLlmProgress(), reportWebLlmReady(), resetWebLlmLoadingState()

### Community 45 - "Community 45"

Cohesion: 0.38
Nodes (4): detectLanguage(), levenshtein(), parseCommand(), processTranscript()

### Community 47 - "Community 47"

Cohesion: 0.38
Nodes (3): calculateHumidityDeficit(), svpBuck(), svpToAhSat()

### Community 48 - "Community 48"

Cohesion: 0.38
Nodes (3): makePlant(), makeSimulationState(), makeStrain()

### Community 49 - "Community 49"

Cohesion: 0.43
Nodes (6): buildVEvent(), downloadICalFile(), escapeICalText(), foldLine(), formatICalDate(), generateICalString()

### Community 50 - "Community 50"

Cohesion: 0.62
Nodes (6): getChangedFiles(), hasRef(), main(), resolveBaseRef(), runGit(), tryRunGit()

### Community 51 - "Community 51"

Cohesion: 0.62
Nodes (6): getChangedFiles(), hasRef(), main(), resolveBaseRef(), runGit(), tryRunGit()

### Community 52 - "Community 52"

Cohesion: 0.6
Nodes (5): useActiveSensorSource(), useCurrentReading(), useSensorConnectionState(), useSensorData(), useSensorHistory()

### Community 54 - "Community 54"

Cohesion: 0.6
Nodes (5): areNotificationsMuted(), findStageChangeEntry(), isWithinQuietHours(), notifyPlantEvents(), showBrowserNotification()

### Community 55 - "Community 55"

Cohesion: 0.33
Nodes (1): ThrowingWorker

### Community 56 - "Community 56"

Cohesion: 0.33
Nodes (2): handleConfirmExport(), onExport()

### Community 59 - "Community 59"

Cohesion: 0.53
Nodes (4): altitudeCorrectionFactor(), barometricPressure(), calculateSVP(), calculateVPD()

### Community 62 - "Community 62"

Cohesion: 0.4
Nodes (1): WorkerBusError

### Community 67 - "Community 67"

Cohesion: 0.5
Nodes (2): isFavorite(), t()

### Community 74 - "Community 74"

Cohesion: 0.4
Nodes (2): createIndexedDbLruCache(), makeCache()

### Community 84 - "Community 84"

Cohesion: 0.5
Nodes (2): useEventListener(), useOnlineStatus()

### Community 86 - "Community 86"

Cohesion: 0.67
Nodes (2): clamp(), weightedMovingAverage()

### Community 91 - "Community 91"

Cohesion: 0.5
Nodes (2): createDefaultGrow(), getInitialState()

### Community 95 - "Community 95"

Cohesion: 0.67
Nodes (2): cn(), t()

### Community 99 - "Community 99"

Cohesion: 0.67
Nodes (2): formatValue(), metricUnit()

### Community 103 - "Community 103"

Cohesion: 0.67
Nodes (2): applyFormat(), handleContentChange()

### Community 105 - "Community 105"

Cohesion: 0.5
Nodes (1): ScenarioService

### Community 107 - "Community 107"

Cohesion: 0.5
Nodes (1): MockJsPDF

### Community 108 - "Community 108"

Cohesion: 0.5
Nodes (1): MockJSZip

### Community 111 - "Community 111"

Cohesion: 0.67
Nodes (2): makeGrowPlant(), makePlant()

### Community 114 - "Community 114"

Cohesion: 1.0
Nodes (2): generateReading(), isDayPhase()

### Community 122 - "Community 122"

Cohesion: 1.0
Nodes (2): openDB(), performTx()

### Community 132 - "Community 132"

Cohesion: 1.0
Nodes (2): estimateEta(), formatTime()

### Community 135 - "Community 135"

Cohesion: 1.0
Nodes (2): makeDataView(), mockCharacteristic()

### Community 139 - "Community 139"

Cohesion: 0.67
Nodes (1): MockJsPDF

### Community 142 - "Community 142"

Cohesion: 1.0
Nodes (2): makeDeps(), makeTimer()

### Community 144 - "Community 144"

Cohesion: 1.0
Nodes (2): loadConfig(), main()

### Community 166 - "Community 166"

Cohesion: 1.0
Nodes (1): MLCEngine

## Knowledge Gaps

- **2 isolated node(s):** `AppInfo`, `MLCEngine`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 32`** (11 nodes): `workerBus.test.ts`, `autoRespond()`, `autoRespondError()`, `MockWorker`, `.addEventListener()`, `.emitError()`, `.postMessage()`, `.removeEventListener()`, `.respond()`, `.respondError()`, `.terminate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (10 nodes): `MentorChatView.tsx`, `enqueueMeasureVersionUpdate()`, `handleClear()`, `handleKeyPress()`, `removeEmptyModelPlaceholders()`, `replaceMessageContent()`, `resolveApiErrorMessage()`, `resolveMentorErrorMessage()`, `scheduleStreamMessageUpdate()`, `scrollToBottom()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (6 nodes): `simulationSlice.test.ts`, `createTestStore()`, `daysMs()`, `ThrowingWorker`, `.postMessage()`, `.terminate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (6 nodes): `DataExportModal.tsx`, `SavedSetupsView.tsx`, `handleClose()`, `handleConfirmExport()`, `handleSave()`, `onExport()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (5 nodes): `workerBus.types.ts`, `WorkerBusError`, `.constructor()`, `workerErr()`, `workerOk()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (5 nodes): `StrainListItem.tsx`, `getSafeStrainType()`, `handleActionClick()`, `isFavorite()`, `t()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (5 nodes): `indexedDbLruCache.test.ts`, `indexedDbLruCache.ts`, `createIndexedDbLruCache()`, `makeCache()`, `makeEntry()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (4 nodes): `useEventListener.ts`, `useOnlineStatus.ts`, `useEventListener()`, `useOnlineStatus()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (4 nodes): `hydroForecastWorker.ts`, `clamp()`, `isTrustedWorkerMessage()`, `weightedMovingAverage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 91`** (4 nodes): `growsSlice.test.ts`, `growsSlice.ts`, `createDefaultGrow()`, `getInitialState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 95`** (4 nodes): `StrainLookupSection.tsx`, `cn()`, `handler()`, `t()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 99`** (4 nodes): `ProactiveAlertBanner.tsx`, `formatValue()`, `metricUnit()`, `t()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 103`** (4 nodes): `EditResponseModal.tsx`, `applyFormat()`, `handleContentChange()`, `handleSave()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 105`** (4 nodes): `scenarioService.ts`, `ScenarioService`, `.getAllScenarios()`, `.getScenarioById()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 107`** (4 nodes): `exportService.test.ts`, `MockJsPDF`, `.constructor()`, `style()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (4 nodes): `backupService.test.ts`, `MockJSZip`, `.file()`, `.generateAsync()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 111`** (4 nodes): `growLogRagService.test.ts`, `makeGrowPlant()`, `makePlant()`, `makeVec()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (3 nodes): `server.mjs`, `generateReading()`, `isDayPhase()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 122`** (3 nodes): `indexedDBStorage.ts`, `openDB()`, `performTx()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (3 nodes): `ModelLoadingProgress.tsx`, `estimateEta()`, `formatTime()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (3 nodes): `webBluetoothSensorService.test.ts`, `makeDataView()`, `mockCharacteristic()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (3 nodes): `equipmentPlanExportService.test.ts`, `MockJsPDF`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 142`** (3 nodes): `webLlmService.test.ts`, `makeDeps()`, `makeTimer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 144`** (3 nodes): `loadConfig()`, `main()`, `lint-scopes.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 166`** (2 nodes): `optional-deps.d.ts`, `MLCEngine`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `Community 0` to `Community 35`, `Community 4`, `Community 5`, `Community 12`, `Community 13`, `Community 15`, `Community 16`, `Community 20`, `Community 29`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `set()` connect `Community 2` to `Community 1`, `Community 34`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 13`, `Community 16`, `Community 18`, `Community 22`, `Community 27`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `String()` connect `Community 12` to `Community 0`, `Community 1`, `Community 34`, `Community 2`, `Community 3`, `Community 8`, `Community 9`, `Community 13`, `Community 20`, `Community 28`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 90 inferred relationships involving `t()` (e.g. with `mapAiErrorMessage()` and `handleTestVoice()`) actually correct?**
  _`t()` has 90 INFERRED edges - model-reasoned connections that need verification._
- **Are the 61 inferred relationships involving `set()` (e.g. with `updateMeasuredSize()` and `attachElementObserver()`) actually correct?**
  _`set()` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Are the 46 inferred relationships involving `String()` (e.g. with `checkOnboardingSync()` and `handleGenerateEncryptionKey()`) actually correct?**
  _`String()` has 46 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AppInfo`, `MLCEngine` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
