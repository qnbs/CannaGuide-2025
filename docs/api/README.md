# API Reference

Developer reference documentation for CannaGuide 2025 service APIs.

## Documents

| Document                                                 | Scope                                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [ai-facade.md](ai-facade.md)                             | Public AI entry point -- `aiService`, `aiProviderService`, `localAIInfrastructure`, mode helpers |
| [rag-pipeline.md](rag-pipeline.md)                       | RAG retrieval pipeline -- `growLogRagService`, `ragEmbeddingCacheService`                        |
| [local-ai-infrastructure.md](local-ai-infrastructure.md) | Cache, telemetry, preload orchestration -- `LocalAIInfrastructure` class                         |

## Related Docs

- [Worker Bus API](../worker-bus.md) -- Promise-based Web Worker dispatcher (9 workers, priority queue, backpressure)
- [Local AI Developer Guide](../local-ai-developer-guide.md) -- Runtime selection, streaming, WebLLM diagnostics, GPU management
- [Architecture Overview](../ARCHITECTURE.md) -- High-level stack, directory structure, data flow
- [Service Dependency Graph](../architecture/service-dependencies.md) -- Auto-generated Mermaid flowchart (104 services)

## Convention

All AI capabilities must be imported from `aiFacade.ts` -- never from individual service files.

```typescript
// Correct
import { aiService, localAIInfrastructure } from '@/services/aiFacade'

// Wrong -- bypasses facade
import { aiService } from '@/services/aiService'
```
