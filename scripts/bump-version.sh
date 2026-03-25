#!/usr/bin/env bash
#
# Bump the SDK version across all files.
# Usage: ./scripts/bump-version.sh 0.2.0

set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 0.2.0"
    exit 1
fi

VERSION="$1"

# Validate semver format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: version must be semver (e.g. 0.2.0), got: $VERSION"
    exit 1
fi

ROOT="$(git rev-parse --show-toplevel)"

echo "Bumping version to $VERSION"

# JS — package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" "$ROOT/js/package.json"
echo "  Updated js/package.json"

# JS — index.js runtime export
sed -i "s/export const version = \".*\"/export const version = \"$VERSION\"/" "$ROOT/js/src/index.js"
echo "  Updated js/src/index.js"

# Python — pyproject.toml
sed -i "s/^version = \".*\"/version = \"$VERSION\"/" "$ROOT/python/pyproject.toml"
echo "  Updated python/pyproject.toml"

# Python — __init__.py
sed -i "s/__version__ = \".*\"/__version__ = \"$VERSION\"/" "$ROOT/python/platform_feedback/__init__.py"
echo "  Updated python/platform_feedback/__init__.py"

echo ""
echo "Done. Verify with: git diff"
