#!/bin/bash -eu
# ClusterFuzzLite build script for CannaGuide 2025
# Compiles JavaScript fuzz targets using Jazzer.js

cd "$SRC/cannaguide"
corepack enable && pnpm install --frozen-lockfile --ignore-scripts
compile_javascript_fuzzer cannaguide .clusterfuzzlite/fuzz_url_service.js fuzz_url_service
