#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 || ! -f ${1:-} || ! ${2:-} =~ ^[0-9]+$ ]]; then
    echo "Usage: bash scripts/check-appimage-permissions.sh <AppImage> <SquashFS byte offset>" >&2
    exit 2
fi

# Inspect the packaged modes before extraction can change them.
image=$(realpath -- "$1")
LC_ALL=C unsquashfs -lln -o "$2" "$image" | awk '
    $6 == "squashfs-root" { root = 1 }
    $6 == "squashfs-root/AppRun" && $1 ~ /^-/ { launcher = 1 }
    $1 ~ /^[-d]/ {
        mode = $1
        needs_exec = substr(mode, 1, 1) == "d" || substr(mode, 2) ~ /[xst]/ ||
            $6 ~ /^squashfs-root\/AppRun(\.wrapped)?$/
        if (substr(mode, 8, 1) != "r" || (needs_exec && substr(mode, 10, 1) !~ /[xt]/)) {
            print "[FAIL] AppImage entry is inaccessible to an unprivileged user: " $0
            failed = 1
        }
    }
    END {
        if (!root || !launcher) {
            print "[FAIL] AppImage listing is missing the root or AppRun"
            failed = 1
        }
        if (!failed) print "[OK] AppImage entries are accessible to an unprivileged user"
        exit failed
    }
'
