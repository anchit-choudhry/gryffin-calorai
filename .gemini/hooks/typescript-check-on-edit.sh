#!/usr/bin/env bash
# Runs tsc --noEmit after editing a .ts/.tsx file inside apps/web/src/.
# Reports type errors inline but always exits 0 so the edit is never blocked.
# Runs in the background - type errors appear in the next tool response.
set -uo pipefail

FILE_PATH=$(python3 -c "
import json, os
d = json.loads(os.environ.get('GEMINI_TOOL_INPUT', '{}'))
print(d.get('file_path', ''))
" 2>/dev/null || echo "")

if [[ -z "$FILE_PATH" ]] || [[ "$FILE_PATH" != *"/apps/web/src/"* ]]; then
  exit 0
fi
if [[ "$FILE_PATH" != *.ts ]] && [[ "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

WEB_DIR="${FILE_PATH%%/apps/web/src/*}/apps/web"

if [[ ! -d "$WEB_DIR" ]]; then
  exit 0
fi

cd "$WEB_DIR"

OUTPUT=$(pnpm exec tsc --noEmit 2>&1) || true

if [[ -n "$OUTPUT" ]]; then
  echo "=== TypeScript errors ==="
  echo "$OUTPUT" | head -40
fi

exit 0
