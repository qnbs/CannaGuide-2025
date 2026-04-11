/**
 * Single source of truth for security headers.
 * Used by vite.config.ts (dev/preview server) and referenced by netlify.toml + docker/nginx.conf.
 *
 * When changing these values, also update:
 *   - netlify.toml  → [[headers]] for = "/*"
 *   - docker/nginx.conf → add_header directives
 *   - public/_headers (if used)
 */

const CSP_DIRECTIVES: readonly string[] = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://api.x.ai https://api.anthropic.com https://huggingface.co https://cdn-lfs.huggingface.co https://cdn-lfs.hf.co https://huggingfaceusercontent.com https://cdn.jsdelivr.net https://api.elevenlabs.io",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
]

export const CSP = `${CSP_DIRECTIVES.join('; ')};`

// Relaxed CSP for Vite dev server -- allows inline scripts required by HMR preamble
export const DEV_CSP = `${CSP_DIRECTIVES.map((d) =>
    d.startsWith('script-src') ? d.replace("'self'", "'self' 'unsafe-inline'") : d,
).join('; ')};`

export const PERMISSIONS_POLICY = [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=(self)',
    'bluetooth=(self)',
    'camera=(self)',
    'display-capture=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'geolocation=()',
    'magnetometer=()',
    'microphone=(self)',
    'midi=()',
    'payment=()',
    'picture-in-picture=(self)',
    'publickey-credentials-get=()',
    'screen-wake-lock=(self)',
    'usb=()',
    'xr-spatial-tracking=()',
    'gyroscope=()',
].join(', ')

/**
 * W-03: Cross-Origin Embedder Policy.
 * `credentialless` enables SharedArrayBuffer without breaking CDN-hosted
 * resources (AI models, ONNX WASM, Sentry). Preferred over `require-corp`
 * which would break third-party fetches. See ADR-0009.
 *
 * GitHub Pages does not support custom HTTP headers -- SAB is only
 * available on Netlify/Vercel/Cloudflare Pages deployments.
 */
export const COEP = 'credentialless'

/**
 * HTTP Strict Transport Security.
 * All deployment targets serve over HTTPS. HSTS instructs browsers to
 * always use HTTPS for subsequent requests (1 year, include subdomains).
 */
export const HSTS = 'max-age=31536000; includeSubDomains'

/**
 * Referrer-Policy.
 * `same-origin` sends the full referrer for same-origin requests and no
 * referrer for cross-origin requests. Strictest practical policy --
 * prevents leaking paths to AI providers and CDN hosts.
 */
export const REFERRER_POLICY = 'same-origin'
