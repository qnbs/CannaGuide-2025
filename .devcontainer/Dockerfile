# CannaGuide 2025 Dev Container
# Codespaces-optimized: system deps baked in, source cloned after build
# Security: layer-minimized, cache-cleaned, scannable by Grype/Trivy

FROM mcr.microsoft.com/playwright:v1.58.0-noble

LABEL org.opencontainers.image.title="CannaGuide 2025 Dev Container"
LABEL org.opencontainers.image.source="https://github.com/qnbs/CannaGuide-2025"

ENV DEBIAN_FRONTEND=noninteractive \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    VITE_ESP32_URL=http://localhost:3001 \
    VITE_TAURI_MOCK_URL=http://localhost:3002

# System packages in one RUN layer + cache cleanup
# gh CLI requires official GitHub apt repo (not in default Ubuntu repos)
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
        -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
        > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends ripgrep gh jq \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /workspaces/CannaGuide-2025
