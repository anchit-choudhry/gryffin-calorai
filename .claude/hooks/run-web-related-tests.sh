#!/usr/bin/env bash
# After editing a source file in apps/web/src/, run only its paired test file
# instead of the full 1796-test suite. Exits 0 always - test failures are informational.
set -uo pipefail

FILE_PATH=$(python3 -c "
import json, os
d = json.loads(os.environ.get('CLAUDE_TOOL_INPUT', '{}'))
print(d.get('file_path', ''))
" 2>/dev/null || echo "")

if [[ -z "$FILE_PATH" ]] || [[ "$FILE_PATH" != *"/apps/web/src/"* ]]; then
  exit 0
fi

# Only act on non-test TypeScript source files
if [[ "$FILE_PATH" == *.test.ts ]] || [[ "$FILE_PATH" == *.test.tsx ]]; then
  exit 0
fi
if [[ "$FILE_PATH" != *.ts ]] && [[ "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

# Derive the paired test file path
if [[ "$FILE_PATH" == *.tsx ]]; then
  TEST_FILE="${FILE_PATH%.tsx}.test.tsx"
else
  TEST_FILE="${FILE_PATH%.ts}.test.ts"
fi

if [[ ! -f "$TEST_FILE" ]]; then
  exit 0
fi

WEB_DIR="${FILE_PATH%%/apps/web/src/*}/apps/web"

echo "=== Running paired tests: $(basename "$TEST_FILE") ==="
cd "$WEB_DIR"
pnpm exec vitest run "$TEST_FILE" --reporter=verbose 2>&1 | tail -30

exit 0
