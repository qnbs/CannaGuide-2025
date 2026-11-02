# CannaGuide 2025 Dev Container
# Codespaces-optimized: system deps baked in, source cloned after build
# Security: layer-minimized, cache-cleaned, scannable by Grype/Trivy

FROM mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e

LABEL org.opencontainers.image.title="CannaGuide 2025 Dev Container"
LABEL org.opencontainers.image.source="https://github.com/qnbs/CannaGuide-2025"

ENV DEBIAN_FRONTEND=noninteractive \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    VITE_ESP32_URL=http://localhost:3001 \
    UV_VERSION=0.8.10

# System packages in one RUN layer + cache cleanup
# gh CLI requires official GitHub apt repo (not in default Ubuntu repos)
# Versions are pinned: ripgrep from noble universe, jq and ca-certificates
# from noble-updates, gh from the GitHub CLI stable repo (2026-11-02).
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
        -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
        > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        ripgrep=14.1.0-1 \
        gh=2.103.3 \
        jq=1.7.1-3ubuntu0.24.04.2 \
        ca-certificates=20260816ubuntu0.24.04.1 \
    && curl -LsSf "https://github.com/astral-sh/uv/releases/download/${UV_VERSION}/uv-x86_64-unknown-linux-gnu.tar.gz" \
        -o /tmp/uv.tar.gz \
    && tar -xzf /tmp/uv.tar.gz -C /tmp \
    && install /tmp/uv-x86_64-unknown-linux-gnu/uv /usr/local/bin/uv \
    && rm -rf /tmp/uv.tar.gz /tmp/uv-x86_64-unknown-linux-gnu \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /workspaces/CannaGuide-2025
