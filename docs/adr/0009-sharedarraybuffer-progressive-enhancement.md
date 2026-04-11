# ADR-0009: SharedArrayBuffer Progressive Enhancement

**Date:** 2025-07-09
**Status:** Accepted
**Supersedes:** Parts of ADR-0008 (SAB rejection)

## Context

ADR-0008 rejected SharedArrayBuffer (SAB) due to:

1. GitHub Pages does not support custom HTTP headers (no COOP/COEP)
2. COEP `require-corp` breaks CDN-hosted AI models and Sentry

The WorkerBus needs zero-copy data transfer for high-frequency
worker communication (VPD sensors, voice waveforms, hydro forecasts).

## Decision

Adopt **progressive enhancement** for SharedArrayBuffer:

1. **COEP `credentialless`** instead of `require-corp` -- avoids breaking
   CDN resources while enabling SAB on supported platforms
2. **Runtime feature detection** via `self.crossOriginIsolated` and
   `typeof SharedArrayBuffer !== 'undefined'`
3. **Automatic fallback** to regular `ArrayBuffer` + `Transferable`
   when SAB is unavailable (GitHub Pages, older browsers)

### Header deployment:

- Netlify, Vercel, Cloudflare Pages: COOP `same-origin` + COEP `credentialless`
- GitHub Pages: No custom headers -- falls back to MessageChannel/Transferable
- Vite dev/preview: Both headers present for local development

### Code architecture:

- `utils/crossOriginIsolation.ts`: Detection utilities
- `utils/sharedBufferPool.ts`: SAB/AB pool with `acquire()`/`release()`
- `utils/atomicsChannel.ts`: Lock-free communication channel (Atomics.wait/notify)
- `utils/lockFreeRingBuffer.ts`: SPSC ring buffer on SAB

All consumers check `canUseSharedArrayBuffer()` before using SAB features.

## Consequences

- SAB is available on ~85% of deployments (Netlify/Vercel/Cloudflare)
- GitHub Pages deployment works without SAB (ArrayBuffer fallback)
- `credentialless` COEP allows CDN resources without `crossorigin` attribute
- Zero-copy sensor data transfer reduces GC pressure on supported platforms
- Lock-free ring buffers enable sub-millisecond worker communication

## Risks

- `credentialless` is not supported in Safari < 15.2 (fallback handles this)
- Future CDN changes may require CORS headers (monitor)
