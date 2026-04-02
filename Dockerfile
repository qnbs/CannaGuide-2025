# syntax=docker/dockerfile:1.7

# ── Build stage ─────────────────────────────────────────────────────────
FROM node:20-alpine@sha256:b88333c42c23fbd91596ebd7fd10de239cedab9617de04142dde7315e3bc0afa AS build
WORKDIR /app

# Patch OS-level vulnerabilities (e.g. zlib CVEs) before installing deps
RUN apk update && apk upgrade --no-cache

# Copy all package manifests for workspace resolution, then install
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/desktop/package.json apps/desktop/package.json
COPY packages/ai-core/package.json packages/ai-core/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci --ignore-scripts

COPY . .

# Build with root base path for Docker (not GH Pages /CannaGuide-2025/)
ENV BUILD_BASE_PATH=/
RUN npm run build

# ── Runtime stage ───────────────────────────────────────────────────────
FROM cgr.dev/chainguard/nginx:latest@sha256:770994a6d14bfd17a34fcf0503e13f5f7c4cf6327b0ec6636f4607cb7dd91afc AS runtime

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY --from=build --chown=65532:65532 /app/apps/web/dist /usr/share/nginx/html

USER 65532

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["/usr/sbin/nginx", "-t"]

# Chainguard nginx has ENTRYPOINT ["/usr/sbin/nginx"] — CMD provides args only
CMD ["-g", "daemon off;"]
