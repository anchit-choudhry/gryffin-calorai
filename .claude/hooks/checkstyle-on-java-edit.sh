#!/usr/bin/env bash
# Run Checkstyle when a backend Java file is edited.
set -uo pipefail

FILE_PATH=$(python3 -c "
import json, os
d = json.loads(os.environ.get('CLAUDE_TOOL_INPUT', '{}'))
print(d.get('file_path', ''))
" 2>/dev/null || echo "")

if [[ -z "$FILE_PATH" ]] || [[ "$FILE_PATH" != *"/apps/backend/"* ]] || [[ "$FILE_PATH" != *.java ]]; then
  exit 0
fi

BACKEND_DIR="${FILE_PATH%%/apps/backend/*}/apps/backend"
echo "=== Checkstyle: $(basename "$FILE_PATH") ==="
cd "$BACKEND_DIR"
mvn checkstyle:check -q 2>&1 | grep -E "ERROR|WARNING|violation" | head -20 || true
exit 0
