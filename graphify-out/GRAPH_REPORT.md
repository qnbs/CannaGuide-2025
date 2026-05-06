# Graph Report - CannaGuide-2025 (2026-05-06)

## Corpus Check

- 951 files · ~1,259,822 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 3394 nodes · 4941 edges · 72 communities detected
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 1198 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 34|Community 34]]
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
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 113|Community 113]]
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
3. `set()` - 63 edges
4. `GeminiService` - 62 edges
5. `String()` - 55 edges
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
- `get_native_capabilities()` --calls--> `ok()` [INFERRED]
  apps/desktop/src-tauri/src/lib.rs → scripts/mdc-context-e2e.mjs
- `open_log_dir()` --calls--> `ok()` [INFERRED]
  apps/desktop/src-tauri/src/lib.rs → scripts/mdc-context-e2e.mjs

## Communities

### Community 0 - "Community 0"

Cohesion: 0.02
Nodes (133): exportAnalyticsCsv(), computeVpd(), simulateEcDrift(), simulateLightSpectrum(), simulateTranspiration(), simulateVpd(), svp(), vpdStatus() (+125 more)

### Community 1 - "Community 1"

Cohesion: 0.02
Nodes (60): AiDiagnosticsModalContainer(), AnalyticsEngine, estimateMilestoneForPlant(), AtomicsChannel, fetchEndpoint(), normalizeName(), run(), canUseSharedArrayBuffer() (+52 more)

### Community 2 - "Community 2"

Cohesion: 0.02
Nodes (130): checkStorageQuota(), getConnectionInfo(), getDeviceMemoryGB(), getEffectiveDeviceMemoryGB(), getGpuAdapterDescription(), getGpuAdapterInfo(), getPerformanceMemory(), isHighEndTablet() (+122 more)

### Community 3 - "Community 3"

Cohesion: 0.03
Nodes (54): getDynamicLoadingMessages(), acquireSlot(), mapAiErrorMessage(), ChemotypeService, dominantKey(), handleExport(), handleImport(), CommunityShareService (+46 more)

### Community 4 - "Community 4"

Cohesion: 0.02
Nodes (51): CloudTtsService, isRateLimited(), recordRequest(), executeInWorker(), registerServiceWorker(), addEventListener(), MockWorker, removeEventListener() (+43 more)

### Community 5 - "Community 5"

Cohesion: 0.03
Nodes (71): buildHeaders(), fetchByPostalCode(), getApiKey(), isCansativaAvailable(), normalizeMenuItem(), normalizePartner(), normalizeProduct(), buildStrainLookupPrompt() (+63 more)

### Community 6 - "Community 6"

Cohesion: 0.04
Nodes (69): getBatteryManager(), getCacheBreakdown(), dispatchEmbedding(), embedBatch(), embedText(), extractEmbedding(), isEmbeddingModelReady(), normalize() (+61 more)

### Community 7 - "Community 7"

Cohesion: 0.04
Nodes (38): extractEntries(), mergeIntoFile(), readExistingKeys(), isFiniteNumber(), isGenealogyStateCorrupt(), isValidCachedTreeRoot(), resolveLayoutOrientation(), resolveSelectedStrainId() (+30 more)

### Community 8 - "Community 8"

Cohesion: 0.03
Nodes (48): handleSaveDiagnosisResponse(), handleSaveResponse(), formatSyncDate(), handleCopyEncryptionKey(), handleGenerateEncryptionKey(), handlePullConfirm(), handlePush(), handleToggleSync() (+40 more)

### Community 9 - "Community 9"

Cohesion: 0.07
Nodes (8): PlantSimulationService, daysMs(), simulate(), buildFinalPreloadStatus(), formatReportDetails(), waitForRetryBackoff(), secureRandom(), applyAction()

### Community 10 - "Community 10"

Cohesion: 0.06
Nodes (32): base64ToUint8Array(), CrdtError, CrdtService, reportCrdtError(), uint8ArrayToBase64(), checkLoopDetector(), destroyCrdtSyncBridge(), enqueueBridgeWrite() (+24 more)

### Community 11 - "Community 11"

Cohesion: 0.06
Nodes (54): buildProviderMessages(), callAnthropic(), callOpenAiCompatible(), clearProviderApiKey(), generateTextWithProvider(), getActiveProviderConfig(), getActiveProviderId(), getMaskedProviderApiKey() (+46 more)

### Community 12 - "Community 12"

Cohesion: 0.07
Nodes (55): buildAdviceStreamPrompt(), buildDiagnosisStreamPrompt(), buildMentorStreamPrompt(), parseAiStreamResult(), parseMentorStreamResult(), analyzeCo2(), analyzeEc(), analyzeLightHours() (+47 more)

### Community 13 - "Community 13"

Cohesion: 0.08
Nodes (28): formatPlantLine(), LocalAiFallbackService, safe(), handleAnalyze(), collectStats(), formatDate(), generateAiSummary(), generateHeuristicSummary() (+20 more)

### Community 14 - "Community 14"

Cohesion: 0.05
Nodes (32): animate(), createPlant(), disposeSceneResources(), handleContextRestored(), handleVisibility(), startAnimation(), render(), createAtmosphereParticles() (+24 more)

### Community 15 - "Community 15"

Cohesion: 0.05
Nodes (31): navigateToAnalytics(), expectNoCrashPatterns(), ok(), bootFreshAppPastOnboarding(), bootFreshAppWithLegalGates(), closeOnboardingIfVisible(), expectNoCrashPatterns(), expectShellVisible() (+23 more)

### Community 16 - "Community 16"

Cohesion: 0.07
Nodes (39): detectMimeTypeFromBase64(), normalizeImageDataUrl(), createGenealogyMigrationState(), createSnapshotDiff(), deepMergeSettings(), ensureEntityAdapterShape(), ensureGenealogyShape(), ensureLegacyCannabinoidProfile() (+31 more)

### Community 17 - "Community 17"

Cohesion: 0.05
Nodes (18): DiagnosisResult(), handleCapture(), handleGetDiagnosis(), t(), genotypeLabel(), getSafeNumericValue(), sym(), crossStrains() (+10 more)

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

Cohesion: 0.14
Nodes (12): resolveRagContext(), isTopicRelevant(), sanitizeForPrompt(), buildChunkEmbeddingKey(), GrowLogRagService, normalizeTokenScore(), scoreChunk(), tokenize() (+4 more)

### Community 23 - "Community 23"

Cohesion: 0.15
Nodes (7): ensureObjectStore(), ensureOfflineActionsStore(), ensureStrainIndexes(), performTx(), replaceStoreAtomically(), runMigrations(), withRetry()

### Community 24 - "Community 24"

Cohesion: 0.18
Nodes (4): buildBucketKey(), buildRawEntry(), calculateVpd(), groupEntriesByBucket()

### Community 25 - "Community 25"

Cohesion: 0.35
Nodes (12): buildPhotoTimelineMetadata(), clampTimestamp(), extractExifTimestampFromJpeg(), findExifIfdOffset(), formatExifDateString(), isJpegFile(), isJpegView(), parseCandidateExifTag() (+4 more)

### Community 26 - "Community 26"

Cohesion: 0.27
Nodes (9): deleteQueuedAction(), getQueuedActions(), getStoredReminders(), notifyDueReminders(), openDB(), openReminderDB(), replaceReminders(), syncData() (+1 more)

### Community 27 - "Community 27"

Cohesion: 0.23
Nodes (6): buildProcessWarnings(), getBurpDebtTone(), getJarHumidityTone(), getMoldRiskTone(), getPostHarvestRecommendations(), getTerpeneRetentionTone()

### Community 28 - "Community 28"

Cohesion: 0.17
Nodes (1): addPenaltyFactor()

### Community 29 - "Community 29"

Cohesion: 0.35
Nodes (9): clamp01(), scoreBonus(), scoreCannabinoid(), scoreDataQuality(), scoreDifficulty(), scoreEffects(), scoreFloweringType(), scoreStrain() (+1 more)

### Community 30 - "Community 30"

Cohesion: 0.18
Nodes (1): MockWorker

### Community 31 - "Community 31"

Cohesion: 0.18
Nodes (2): extractFromSecurityHeaders(), parseCSP()

### Community 32 - "Community 32"

Cohesion: 0.4
Nodes (8): clearCache(), deleteModel(), getCacheSize(), getModelInfo(), getRootDir(), listModels(), readModel(), writeModel()

### Community 33 - "Community 33"

Cohesion: 0.22
Nodes (2): resolveApiErrorMessage(), resolveMentorErrorMessage()

### Community 34 - "Community 34"

Cohesion: 0.33
Nodes (7): addEffectScore(), applyCannabinoidContribution(), buildSummary(), deriveSynergies(), deriveTerpeneScores(), EntourageService, getProfileLabel()

### Community 36 - "Community 36"

Cohesion: 0.36
Nodes (5): configureSshSigning(), gitSet(), gitUnset(), restoreSshKeyFromSecret(), run()

### Community 38 - "Community 38"

Cohesion: 0.25
Nodes (3): useAsync(), useStorageEstimate(), useYieldPrediction()

### Community 39 - "Community 39"

Cohesion: 0.39
Nodes (5): consentKey(), grantProviderConsent(), hasProviderConsent(), revokeAllConsents(), revokeProviderConsent()

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

### Community 80 - "Community 80"

Cohesion: 0.7
Nodes (4): addResult(), checkCommandVersion(), readGitConfig(), run()

### Community 83 - "Community 83"

Cohesion: 0.5
Nodes (2): useEventListener(), useOnlineStatus()

### Community 85 - "Community 85"

Cohesion: 0.67
Nodes (2): clamp(), weightedMovingAverage()

### Community 90 - "Community 90"

Cohesion: 0.5
Nodes (2): createDefaultGrow(), getInitialState()

### Community 94 - "Community 94"

Cohesion: 0.67
Nodes (2): cn(), t()

### Community 98 - "Community 98"

Cohesion: 0.67
Nodes (2): formatValue(), metricUnit()

### Community 102 - "Community 102"

Cohesion: 0.67
Nodes (2): applyFormat(), handleContentChange()

### Community 104 - "Community 104"

Cohesion: 0.5
Nodes (1): ScenarioService

### Community 106 - "Community 106"

Cohesion: 0.5
Nodes (1): MockJsPDF

### Community 107 - "Community 107"

Cohesion: 0.5
Nodes (1): MockJSZip

### Community 110 - "Community 110"

Cohesion: 0.67
Nodes (2): makeGrowPlant(), makePlant()

### Community 113 - "Community 113"

Cohesion: 1.0
Nodes (2): generateReading(), isDayPhase()

### Community 114 - "Community 114"

Cohesion: 0.67
Nodes (1): FeatureDisabledError

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

- **3 isolated node(s):** `AppInfo`, `NativeCapabilities`, `MLCEngine`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 28`** (12 nodes): `predictiveAnalyticsService.ts`, `addPenaltyFactor()`, `buildHumidityAlert()`, `buildPhAlert()`, `buildTemperatureAlert()`, `buildVpdAlert()`, `describeYieldImpact()`, `getAlertPenalty()`, `getHumidityPenalty()`, `getIdealRange()`, `getTemperaturePenalty()`, `getVpdPenalty()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (11 nodes): `workerBus.test.ts`, `autoRespond()`, `autoRespondError()`, `MockWorker`, `.addEventListener()`, `.emitError()`, `.postMessage()`, `.removeEventListener()`, `.respond()`, `.respondError()`, `.terminate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (11 nodes): `extractFromIndexHtml()`, `extractFromNetlify()`, `extractFromPublicHeaders()`, `extractFromSecurityHeaders()`, `extractFromVercel()`, `extractReferrerPolicyFromNetlify()`, `extractReferrerPolicyFromPublicHeaders()`, `extractReferrerPolicyFromSecurityHeaders()`, `extractReferrerPolicyFromVercel()`, `parseCSP()`, `check-csp-consistency.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (10 nodes): `MentorChatView.tsx`, `enqueueMeasureVersionUpdate()`, `handleClear()`, `handleKeyPress()`, `removeEmptyModelPlaceholders()`, `replaceMessageContent()`, `resolveApiErrorMessage()`, `resolveMentorErrorMessage()`, `scheduleStreamMessageUpdate()`, `scrollToBottom()`
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
- **Thin community `Community 83`** (4 nodes): `useEventListener.ts`, `useOnlineStatus.ts`, `useEventListener()`, `useOnlineStatus()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (4 nodes): `hydroForecastWorker.ts`, `clamp()`, `isTrustedWorkerMessage()`, `weightedMovingAverage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (4 nodes): `growsSlice.test.ts`, `growsSlice.ts`, `createDefaultGrow()`, `getInitialState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 94`** (4 nodes): `StrainLookupSection.tsx`, `cn()`, `handler()`, `t()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (4 nodes): `ProactiveAlertBanner.tsx`, `formatValue()`, `metricUnit()`, `t()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 102`** (4 nodes): `EditResponseModal.tsx`, `applyFormat()`, `handleContentChange()`, `handleSave()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (4 nodes): `scenarioService.ts`, `ScenarioService`, `.getAllScenarios()`, `.getScenarioById()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (4 nodes): `exportService.test.ts`, `MockJsPDF`, `.constructor()`, `style()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 107`** (4 nodes): `backupService.test.ts`, `MockJSZip`, `.file()`, `.generateAsync()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 110`** (4 nodes): `growLogRagService.test.ts`, `makeGrowPlant()`, `makePlant()`, `makeVec()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 113`** (3 nodes): `server.mjs`, `generateReading()`, `isDayPhase()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (3 nodes): `featureFlags.ts`, `FeatureDisabledError`, `.constructor()`
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

- **Why does `t()` connect `Community 3` to `Community 0`, `Community 33`, `Community 4`, `Community 8`, `Community 10`, `Community 13`, `Community 14`, `Community 20`, `Community 21`, `Community 27`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `String()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 8`, `Community 40`, `Community 10`, `Community 11`, `Community 20`, `Community 25`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `captureLocalAiError()` connect `Community 6` to `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 7`, `Community 12`, `Community 13`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 90 inferred relationships involving `t()` (e.g. with `mapAiErrorMessage()` and `handleTestVoice()`) actually correct?**
  _`t()` has 90 INFERRED edges - model-reasoned connections that need verification._
- **Are the 62 inferred relationships involving `set()` (e.g. with `updateMeasuredSize()` and `attachElementObserver()`) actually correct?**
  _`set()` has 62 INFERRED edges - model-reasoned connections that need verification._
- **Are the 47 inferred relationships involving `String()` (e.g. with `checkOnboardingSync()` and `handleGenerateEncryptionKey()`) actually correct?**
  _`String()` has 47 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AppInfo`, `NativeCapabilities`, `MLCEngine` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
