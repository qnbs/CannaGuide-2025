#!/usr/bin/env bash
# Cursor Cloud VM startup: ensure Node 24+ and refresh pnpm deps.
# Invoked as a single command from the environment update_script (not line-by-line).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f package.json ]; then
    echo "[cursor-cloud-update] package.json not found in ${REPO_ROOT}" >&2
    exit 1
fi

node_major() {
    node -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null || echo 0
}

ensure_node_24() {
    if command -v node >/dev/null 2>&1 && [ "$(node_major)" -ge 24 ]; then
        return 0
    fi

    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    if [ ! -s "$NVM_DIR/nvm.sh" ]; then
        echo "[cursor-cloud-update] Installing nvm..."
        export PROFILE=/dev/null
        NVM_INSTALL_SHA256="2d8359a64a3cb07c02389ad88ceecd43f2fa469c06104f92f98df5b6f315275f"
        curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh -o /tmp/nvm-install.sh
        echo "${NVM_INSTALL_SHA256}  /tmp/nvm-install.sh" | sha256sum -c -
        bash /tmp/nvm-install.sh
    fi
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"

    nvm install 24
    nvm use 24
    nvm alias default 24

    # VM images expose /exec-daemon/node (v22) ahead of nvm on PATH.
    # nvm which current still resolves to /exec-daemon/node when it is on PATH;
    # pin the explicit Node 24 binary directory instead.
    NVM_NODE_BIN="$(dirname "$(nvm which 24)")"
    export PATH="${NVM_NODE_BIN}:${PATH}"
}

ensure_node_24

if [ "$(node_major)" -lt 24 ]; then
    echo "[cursor-cloud-update] Node.js >= 24 required (got $(node -v))" >&2
    exit 1
fi

# Persist Node 24 on PATH for later agent shells (~/.bashrc lacks the AGENTS.md prepend).
BASHRC_MARK="# cursor-cloud-update: Node 24 PATH"
if [ -f "$HOME/.bashrc" ] && ! grep -qF "$BASHRC_MARK" "$HOME/.bashrc"; then
    cat >>"$HOME/.bashrc" <<'EOF'

# cursor-cloud-update: Node 24 PATH (prepended over /exec-daemon/node v22)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
if [ -d "$NVM_DIR/versions/node" ]; then
  export PATH="$NVM_DIR/versions/node/$(ls "$NVM_DIR/versions/node" | sort -V | tail -1)/bin:$PATH"
fi
EOF
fi

corepack enable
corepack prepare pnpm@10.33.0 --activate 2>/dev/null || true

node "${REPO_ROOT}/scripts/check-pnpm-lockfile.mjs"

CI=1 HUSKY=0 pnpm install --frozen-lockfile

echo "[cursor-cloud-update] OK — node $(node -v), pnpm $(pnpm -v)"
