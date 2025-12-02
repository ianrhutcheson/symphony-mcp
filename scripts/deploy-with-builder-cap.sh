#!/usr/bin/env bash
set -euo pipefail

# Limit the remote builder size so it stays within org CPU caps.
export FLY_REMOTE_BUILDER_MACHINE_SIZE="${FLY_REMOTE_BUILDER_MACHINE_SIZE:-shared-cpu-1x}"

flyctl deploy --config fly.toml "$@"
