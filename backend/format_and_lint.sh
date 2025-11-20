#!/usr/bin/env bash
# Convenience script to format and lint the backend Python codebase.
# Usage:
#   pip install -r backend/requirements.txt
#   ./backend/format_and_lint.sh

set -euo pipefail
cd "$(dirname "$0")"

echo "Running ruff format (auto-fix)..."
# ruff can fix simple formatting issues and many lint issues
ruff format . || true 

echo "Running ruff check..."
ruff check .

echo "Format + lint (ruff) completed."
