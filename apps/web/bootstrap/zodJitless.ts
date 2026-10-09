import { z } from 'zod'

// Zod 4 probes `new Function` once to see whether JIT compilation is allowed.
// A strict CSP reports that call as a securitypolicyviolation even though Zod
// catches the throw. jitless skips the probe. The flag is stored on globalThis,
// so one call covers every Zod copy in this realm. Call it before any schema runs.
z.config({ jitless: true })
