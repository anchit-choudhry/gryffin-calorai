#!/usr/bin/env bash
# Runs Prettier + ESLint --fix on the edited file if it is a .ts/.tsx file inside apps/web/src/.
# Silent on success; prints errors on failure but always exits 0 (lint errors don't block the edit).
set -uo pipefail

FILE_PATH=$(python3 -c "
import json, os
d = json.loads(os.environ.get('GEMINI_TOOL_INPUT', '{}'))
print(d.get('file_path', ''))
" 2>/dev/null || echo "")

# Only act on TypeScript files inside the web app source tree
if [[ -z "$FILE_PATH" ]] || [[ "$FILE_PATH" != *"/apps/web/src/"* ]]; then
  exit 0
fi
if [[ "$FILE_PATH" != *.ts ]] && [[ "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

# Resolve the apps/web root from the absolute file path
WEB_DIR="${FILE_PATH%%/apps/web/src/*}/apps/web"

if [[ ! -d "$WEB_DIR" ]]; then
  exit 0
fi

cd "$WEB_DIR"
pnpm exec prettier --write "$FILE_PATH" 2>&1
pnpm exec eslint --fix "$FILE_PATH" --config eslint.config.js 2>&1

exit 0
