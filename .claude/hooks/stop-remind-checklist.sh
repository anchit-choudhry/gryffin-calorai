#!/usr/bin/env bash
# Runs when Claude's turn ends (Stop event).
# If any apps/web/src/ TypeScript files were modified this session,
# prints the pre-commit checklist from CLAUDE.md as a reminder.
set -uo pipefail

# Check for modified web source files (staged or unstaged)
MODIFIED=$(git status --short 2>/dev/null | grep -E "apps/web/src/.*\.(ts|tsx)$" || true)

if [[ -z "$MODIFIED" ]]; then
  exit 0
fi

echo ""
echo "Modified web source files detected. Pre-commit checklist (CLAUDE.md):"
echo "  1. pnpm lint:fix        - ESLint + Prettier (required before commit)"
echo "  2. pnpm test            - All tests must pass (2594+ tests, 90% coverage threshold)"
echo "  3. pnpm build           - Production build must succeed with no errors"
echo ""

exit 0
