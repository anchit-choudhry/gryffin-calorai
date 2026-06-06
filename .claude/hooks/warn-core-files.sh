#!/usr/bin/env bash
# Prints a soft reminder when editing high-impact files whose changes cascade across
# the entire codebase. Does NOT block (exit 0) - informational only.
set -uo pipefail

FILE_PATH=$(python3 -c "
import json, os
d = json.loads(os.environ.get('CLAUDE_TOOL_INPUT', '{}'))
print(d.get('file_path', ''))
" 2>/dev/null || echo "")

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

BASENAME=$(basename "$FILE_PATH")

# Files whose changes ripple across slices, DB, tests, and build
CORE_FILES=(
  "AppState.ts"
  "dbService.ts"
  "index.ts"
  "vite.config.ts"
  "vitest.config.ts"
  "eslint.config.js"
  "tsconfig.json"
)

for CORE in "${CORE_FILES[@]}"; do
  if [[ "$BASENAME" == "$CORE" ]] && [[ "$FILE_PATH" == *"/apps/web/"* ]]; then
    echo "NOTICE: '$BASENAME' is a high-impact file."
    echo "  - AppState.ts / index.ts: all slices + 89+ test files may be affected"
    echo "  - dbService.ts: Dexie schema changes require a version bump and upgrade callback"
    echo "  - vite.config.ts: CSP header and chunk config affect the production build"
    echo "  After editing, run: pnpm test && pnpm build"
    break
  fi
done

exit 0
