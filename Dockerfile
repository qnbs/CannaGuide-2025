# syntax=docker/dockerfile:1.7

# ── Build stage ─────────────────────────────────────────────────────────
FROM node:20-alpine@sha256:b88333c42c23fbd91596ebd7fd10de239cedab9617de04142dde7315e3bc0afa AS build
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
FROM cgr.dev/chainguard/nginx:latest@sha256:df82184bf05b5c9c0a7b9eee02084b6ff945fa764e89dd91921b1deccc16cff2 AS runtime

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY --from=build --chown=65532:65532 /app/dist /usr/share/nginx/html

USER 65532

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["nginx", "-t"]

CMD ["nginx", "-g", "daemon off;"]
