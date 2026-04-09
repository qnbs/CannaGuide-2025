# API Reference

Developer reference documentation for CannaGuide 2025 service APIs.

## Documents

| Document                                                 | Scope                                                                                                             |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [ai-facade.md](ai-facade.md)                             | Public AI entry point -- `aiService`, `aiProviderService`, `localAIInfrastructure`, mode helpers                  |
| [ai-providers.md](ai-providers.md)                       | Multi-provider BYOK abstraction -- key management, encryption, rotation, generation routing                       |
| [crdt-sync.md](crdt-sync.md)                             | CRDT/Yjs sync layer -- crdtService, crdtSyncBridge, adapters, Gist transport, conflict resolution                 |
| [equipment-calculators.md](equipment-calculators.md)     | Equipment + Knowledge calculators -- CO2, HD, light, timer, terpene, transpiration, EC/TDS, spectrum, cannabinoid |
| [local-ai-infrastructure.md](local-ai-infrastructure.md) | Cache, telemetry, preload orchestration -- `LocalAIInfrastructure` class                                          |
| [proactive-coach.md](proactive-coach.md)                 | Smart Coach -- threshold monitoring, stage overrides, AI advice, useAlertsStore                                   |
| [rag-pipeline.md](rag-pipeline.md)                       | RAG retrieval pipeline -- `growLogRagService`, `ragEmbeddingCacheService`                                         |
| [worker-bus.md](worker-bus.md)                           | WorkerBus -- dispatch, priority queue, rate limiting, cross-worker channels, telemetry export                     |

## Related Docs

- [Worker Bus Guide](../worker-bus.md) -- Developer guide for WorkerBus patterns and usage
- [Local AI Developer Guide](../local-ai-developer-guide.md) -- Runtime selection, streaming, WebLLM diagnostics, GPU management
- [Architecture Overview](../ARCHITECTURE.md) -- High-level stack, directory structure, data flow
- [Service Dependency Graph](../architecture/service-dependencies.md) -- Auto-generated Mermaid flowchart (108 services)

## Convention

All AI capabilities must be imported from `aiFacade.ts` -- never from individual service files.

```typescript
// Correct
import { aiService, localAIInfrastructure } from '@/services/aiFacade'

// Wrong -- bypasses facade
import { aiService } from '@/services/aiService'
```
