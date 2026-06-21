#!/usr/bin/env bash
# Plays a brief system sound when Gemini sends a Notification event.
# Useful when Gemini is running a long task (test suite, build) in the background.
# Uses afplay (macOS built-in) - silently no-ops on non-macOS systems.
set -uo pipefail

if command -v afplay &>/dev/null; then
  afplay /System/Library/Sounds/Glass.aiff &
fi

exit 0
