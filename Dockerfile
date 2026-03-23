# syntax=docker/dockerfile:1.7

# ── Build stage ─────────────────────────────────────────────────────────
FROM node:20-alpine@sha256:b88333c42c23fbd91596ebd7fd10de239cedab9617de04142dde7315e3bc0afa AS build
WORKDIR /app

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

CMD ["nginx", "-g", "daemon off;"]
