# @cannaguide/ai-core — Changelog

## 0.2.0 (2026-03-20)

### Changed

- Build now emits `.d.ts` declarations to `dist/` (was `tsc --noEmit` no-op)
- `types` export points to `dist/index.d.ts` for proper IDE resolution
- Added `files` field to control package contents
- Added `clean` script

## 0.1.0 (2025-12-01)

### Added

- Initial extraction from monolith: shared AI types, provider config, Zod schemas
- `AIResponse`, `PlantDiagnosisResponse`, `StructuredGrowTips`, `DeepDiveGuide`
- `AiProvider` union type & `AiProviderConfig` interface
- Zod validation schemas for all response types
