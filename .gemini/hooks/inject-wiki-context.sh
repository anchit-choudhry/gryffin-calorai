#!/usr/bin/env bash
# UserPromptSubmit hook: automatically inject relevant project-knowledge wiki sections
# into Gemini's context based on keywords in the user's prompt.
# Uses exit 2 + JSON to prepend context without blocking the request.
set -uo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
WIKI="$ROOT/project-knowledge/wiki"
LOG="$ROOT/project-knowledge/log.md"

PROMPT=$(python3 -c "
import json, os, sys
d = json.loads(os.environ.get('GEMINI_USER_PROMPT_SUBMIT', '{}'))
print(d.get('prompt', '').lower())
" 2>/dev/null || echo "")

if [[ -z "$PROMPT" ]]; then
  exit 0
fi

# Read systems.md once; all section extractions pipe from this variable.
SYSTEMS=$(cat "$WIKI/systems.md" 2>/dev/null || echo "")

CONTEXT_PARTS=()

# Extracts an awk range from $SYSTEMS and appends to CONTEXT_PARTS if non-empty.
# Args: $1=label  $2=awk-start-pattern  $3=awk-end-pattern  $4=max-lines
append_wiki_section() {
  local label="$1" start="$2" end="$3" max="$4"
  local section
  section=$(echo "$SYSTEMS" | awk "/^$start/,/^$end/" | head -"${max}")
  if [[ -n "$section" ]]; then
    CONTEXT_PARTS+=("## Wiki: $label (auto-loaded)\n\n$section")
  fi
}

# Backend / Java / Flyway / Spring / Maven keywords
BACKEND_PAT='backend|java|flyway|spring|maven|migration|sql|v[0-9]+__|off_product|encrypted_blob|checkstyle|mvn|pom\.xml|controller|service|repository|entity|dto'
if [[ "$PROMPT" =~ $BACKEND_PAT ]]; then
  append_wiki_section "Backend Architecture" "## 2\. Backend" "## [0-9]+\." 80
fi

# Architecture decisions (D-number references, rationale, known schema decisions)
DECISION_PAT='d[0-9]+|decision|architectural|rationale|why did|why was|trade.?off|d3[0-5]|immutable|tsvector|coalesce|upsert'
if [[ "$PROMPT" =~ $DECISION_PAT ]]; then
  DECISIONS_TAIL=$(tail -60 "$WIKI/decisions.md" 2>/dev/null)
  if [[ -n "$DECISIONS_TAIL" ]]; then
    CONTEXT_PARTS+=("## Wiki: Recent Decisions (auto-loaded, D31-D35)\n\n$DECISIONS_TAIL")
  fi
fi

# Release / version / changelog / roadmap keywords
RELEASE_PAT='release|version|v0\.[0-9]+|changelog|roadmap|what.s new|what was shipped|what did we ship|milestone'
if [[ "$PROMPT" =~ $RELEASE_PAT ]]; then
  RECENT_LOG=$(grep -A 8 "^## \[2026" "$LOG" 2>/dev/null | tail -40)
  if [[ -n "$RECENT_LOG" ]]; then
    CONTEXT_PARTS+=("## Wiki: Recent Log Entries (auto-loaded)\n\n$RECENT_LOG")
  fi
fi

# State / Zustand / Dexie / slice / store keywords
STATE_PAT='zustand|slice|store|appstate|dexie|indexeddb|schema|compound.ind|dbservice'
if [[ "$PROMPT" =~ $STATE_PAT ]]; then
  STATE_SECTION=$(echo "$SYSTEMS" | awk '/^### State Management/,/^### (Custom Hooks|API Client|Form Validation)/' | head -60)
  DB_SECTION=$(echo "$SYSTEMS" | awk '/^### Database \(Dexie/,/^### Custom Hooks/' | head -40)
  STATE_DB_COMBINED=""
  [[ -n "$STATE_SECTION" ]] && STATE_DB_COMBINED+="$STATE_SECTION"$'\n\n'
  [[ -n "$DB_SECTION" ]] && STATE_DB_COMBINED+="$DB_SECTION"
  if [[ -n "$STATE_DB_COMBINED" ]]; then
    CONTEXT_PARTS+=("## Wiki: State + DB Layer (auto-loaded)\n\n$STATE_DB_COMBINED")
  fi
fi

# Test / coverage / vitest / testing keywords
TEST_PAT='test|vitest|coverage|spec|failing test|test file|\.test\.|tdd'
if [[ "$PROMPT" =~ $TEST_PAT ]]; then
  append_wiki_section "Testing Layer" "## 5\. Testing" "## [0-9]+\." 30
fi

# Design / UI / tailwind / component / animation keywords
DESIGN_PAT='design|tailwind|component|animation|motion|oklch|accent|almanac|persimmon|serif|editorial|a11y|accessibility|aria'
if [[ "$PROMPT" =~ $DESIGN_PAT ]]; then
  append_wiki_section "Design System" "### Design System" "---" 60
fi

if [[ ${#CONTEXT_PARTS[@]} -eq 0 ]]; then
  exit 0
fi

# Join all context blocks
JOINED=$(printf '%s\n\n---\n\n' "${CONTEXT_PARTS[@]}")

python3 -c "
import json, sys
context = sys.argv[1]
print(json.dumps({'type': 'text', 'text': context}))
" "$JOINED"

exit 2
