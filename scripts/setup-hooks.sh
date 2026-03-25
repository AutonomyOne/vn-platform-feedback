#!/usr/bin/env bash
#
# Installs git hooks for this repo.
# Run once after cloning: ./scripts/setup-hooks.sh

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$ROOT/.git/hooks"

cp "$ROOT/scripts/pre-push" "$HOOKS_DIR/pre-push"
chmod +x "$HOOKS_DIR/pre-push"

echo "Installed pre-push hook."
