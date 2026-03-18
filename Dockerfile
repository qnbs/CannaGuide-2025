# syntax=docker/dockerfile:1.7

# ── Build stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build with root base path for Docker (not GH Pages /CannaGuide-2025/)
ENV BUILD_BASE_PATH=/
RUN npm run build

# ── Runtime stage ───────────────────────────────────────────────────────
FROM cgr.dev/chainguard/nginx:latest AS runtime

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY --from=build --chown=65532:65532 /app/dist /usr/share/nginx/html

USER 65532

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
