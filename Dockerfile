# syntax=docker/dockerfile:1.7

# ── Build stage ─────────────────────────────────────────────────────────
FROM node:25-alpine@sha256:5209bcaca9836eb3448b650396213dbe9d9a34d31840c2ae1f206cb2986a8543 AS build
WORKDIR /app

# Patch OS-level vulnerabilities (e.g. zlib CVEs) before installing deps
RUN apk update && apk upgrade --no-cache

COPY package*.json ./
RUN npm ci

COPY . .

# Build with root base path for Docker (not GH Pages /CannaGuide-2025/)
ENV BUILD_BASE_PATH=/
RUN npm run build

# ── Runtime stage ───────────────────────────────────────────────────────
FROM cgr.dev/chainguard/nginx:latest@sha256:770994a6d14bfd17a34fcf0503e13f5f7c4cf6327b0ec6636f4607cb7dd91afc AS runtime

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY --from=build --chown=65532:65532 /app/dist /usr/share/nginx/html

USER 65532

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["nginx", "-t"]

CMD ["nginx", "-g", "daemon off;"]
