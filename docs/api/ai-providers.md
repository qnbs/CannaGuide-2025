# AI Providers API Reference

> Multi-provider BYOK (Bring Your Own Key) AI abstraction with
> AES-256-GCM key encryption at rest, key rotation tracking,
> and unified text generation routing.

**Source files:**

| Module           | Path                                     |
| ---------------- | ---------------------------------------- |
| Provider Service | `apps/web/services/aiProviderService.ts` |
| Provider Configs | `packages/ai-core/src/providers.ts`      |
| Key Encryption   | `apps/web/services/cryptoService.ts`     |

---

## Providers

Four cloud AI providers are supported. Users bring their own API keys
(BYOK model -- no server-side key management).

| Provider      | ID          | Default Text Model       | Default JSON Model       | Deep Dive Model          |
| ------------- | ----------- | ------------------------ | ------------------------ | ------------------------ |
| Google Gemini | `gemini`    | gemini-2.5-flash         | gemini-2.5-flash         | gemini-2.5-pro           |
| OpenAI        | `openai`    | gpt-4o-mini              | gpt-4o-mini              | gpt-4o                   |
| xAI (Grok)    | `xai`       | grok-3-mini-fast         | grok-3-mini-fast         | grok-3                   |
| Anthropic     | `anthropic` | claude-sonnet-4-20250514 | claude-sonnet-4-20250514 | claude-sonnet-4-20250514 |

---

## PROVIDER_CONFIGS

```typescript
import { PROVIDER_CONFIGS } from '@cannaguide/ai-core'
```

```typescript
type AiProvider = 'gemini' | 'openai' | 'xai' | 'anthropic'

interface AiProviderConfig {
    id: AiProvider
    label: string
    keyPattern: RegExp // Regex for key format validation
    placeholder: string // UI placeholder (e.g. "AIza...")
    keyStorageKey: string // IndexedDB encryption key name
    getKeyUrl: string // URL to obtain an API key
    models: {
        text: string
        json: string
        image?: string // Only Gemini has image gen
        deepDive?: string
    }
    pricing?: {
        inputPer1MTokens: number // USD per 1M input tokens
        outputPer1MTokens: number // USD per 1M output tokens
        updatedAt: string // ISO date of last price check
    }
}
```

### Key Patterns

| Provider  | Pattern                         | Example      |
| --------- | ------------------------------- | ------------ |
| Gemini    | `/^AIza[0-9A-Za-z_-]{20,}$/`    | `AIza...`    |
| OpenAI    | `/^sk-[A-Za-z0-9_-]{20,}$/`     | `sk-...`     |
| xAI       | `/^xai-[A-Za-z0-9_-]{20,}$/`    | `xai-...`    |
| Anthropic | `/^sk-ant-[A-Za-z0-9_-]{20,}$/` | `sk-ant-...` |

### Pricing (as of 2025-06-01)

| Provider  | Input ($/1M tokens) | Output ($/1M tokens) |
| --------- | ------------------- | -------------------- |
| Gemini    | 0.15                | 0.60                 |
| OpenAI    | 0.15                | 0.60                 |
| xAI       | 0.30                | 0.50                 |
| Anthropic | 3.00                | 15.00                |

---

## aiProviderService

### Provider Selection

```typescript
getActiveProviderId(): AiProvider
setActiveProviderId(provider: AiProvider): void
getActiveProviderConfig(): AiProviderConfig
getAllProviders(): AiProviderConfig[]
getProviderConfig(id: AiProvider): AiProviderConfig
```

Active provider is stored in `localStorage` under key
`'cg.ai.activeProvider'`. Defaults to `'gemini'`.

### Key Management

```typescript
async getProviderApiKey(provider: AiProvider): Promise<string | null>
async setProviderApiKey(provider: AiProvider, apiKey: string): Promise<void>
async clearProviderApiKey(provider: AiProvider): Promise<void>
async clearAllProviderApiKeys(): Promise<void>
async getMaskedProviderApiKey(provider: AiProvider): Promise<string | null>
```

Keys are encrypted with AES-256-GCM via `cryptoService` before
storage. `getMaskedProviderApiKey()` returns a masked representation
(e.g. `AIza...XYZ`) without exposing the full key.

### Key Validation

```typescript
isValidProviderKeyFormat(provider: AiProvider, apiKey: string): boolean
```

Validates against the provider's `keyPattern` regex. Does not make
network calls -- format check only.

### Key Rotation

```typescript
getProviderKeyMetadata(provider: AiProvider): AiProviderKeyMetadata | null
isProviderKeyRotationDue(provider: AiProvider): boolean
```

```typescript
interface AiProviderKeyMetadata {
    updatedAt: number // Timestamp of last key update
}

const KEY_ROTATION_WINDOW_MS = 90 * 24 * 60 * 60 * 1000 // 90 days
```

`isProviderKeyRotationDue()` returns `true` when the key has not been
updated within the rotation window.

### Text Generation

```typescript
async generateTextWithProvider(
    provider: AiProvider,
    systemPrompt: string,
    userPrompt: string,
    jsonMode: boolean,
    maxTokens: number,
): Promise<string>
```

Routes to provider-specific API:

- **Gemini:** Uses `geminiService` directly (Google AI SDK)
- **OpenAI / xAI:** OpenAI-compatible chat completions endpoint
  (`/v1/chat/completions`). xAI shares the same format at
  `api.x.ai/v1`.
- **Anthropic:** Uses the Messages API (`/v1/messages`) with
  system prompt in dedicated field.

JSON mode sets `response_format: { type: 'json_object' }` for
OpenAI-compatible providers.

**Rate limit handling:** Reads `Retry-After` header on 429 responses.
Falls back to 60s default.

---

## Integration Points

### AI Facade

Components never call `aiProviderService` directly. The
`aiFacade.aiService` routes all AI requests through the active
provider:

```typescript
import { aiService } from '@/services/aiFacade'

// This internally calls aiProviderService.generateTextWithProvider()
const result = await aiService.getPlantAdvice(plant, question)
```

### Rate Limiter

`aiRateLimiter.ts` enforces a 15 req/min sliding window across all
providers. Provider-specific rate limits (429 Retry-After) are handled
within `aiProviderService`.

### Cost Tracking

`aiRateLimiter.ts` also tracks token usage via `reportActualUsage()`
for monthly budget monitoring.

---

## Security

- API keys encrypted at rest with AES-256-GCM (`cryptoService.ts`)
- Keys never logged or sent to telemetry
- `isLocalOnlyMode()` guard prevents all outbound API calls when enabled
- Input sanitized with DOMPurify before AI transmission
- 30+ regex patterns block prompt injection attempts
