#!/usr/bin/env bash
set -euo pipefail

# Tauri CLI 2.11.4 copies this cached launcher into AppDir without changing its
# mode. The GTK plugin then moves it to AppRun.wrapped before squashing.
cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/tauri"
launcher="$cache_dir/AppRun-x86_64"
digest=f30140a43a0a59e46db21bdefdf749b9e9f2c6946e92afabbacf98b8ae73fb4f
url=https://github.com/tauri-apps/binary-releases/releases/download/apprun-old/AppRun-x86_64

verify() {
    printf '%s  %s\n' "$digest" "$1" | sha256sum --check --status
}

mkdir -p "$cache_dir"
if [[ -L "$launcher" ]]; then
    echo "[FAIL] Tauri AppImage launcher cache entry is a symlink" >&2
    exit 1
fi
if [[ -e "$launcher" ]]; then
    if [[ ! -f "$launcher" ]] || ! verify "$launcher"; then
        echo "[FAIL] Tauri AppImage launcher cache entry has an unexpected digest or type" >&2
        exit 1
    fi
    chmod 0755 "$launcher"
else
    temp=$(mktemp "$cache_dir/.AppRun-x86_64.XXXXXX")
    trap 'rm -f -- "$temp"' EXIT
    curl --proto '=https' --fail --silent --show-error --location --max-time 60 -o "$temp" "$url"
    if ! verify "$temp"; then
        echo "[FAIL] Tauri AppImage launcher download digest did not match" >&2
        exit 1
    fi
    chmod 0755 "$temp"
    ln -- "$temp" "$launcher"
fi
echo "[OK] Tauri AppImage launcher digest and mode verified"
