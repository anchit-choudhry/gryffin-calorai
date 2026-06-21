#!/usr/bin/env bash
# cron-refresh-off.sh - monthly cron wrapper for refresh-off-products.sh
#
# Sources apps/backend/.env for DB credentials, then delegates to the main
# import script. Logs timestamped output to a rolling monthly log file.
#
# Usage:
#   bash apps/backend/scripts/cron-refresh-off.sh /data/off.parquet
#
# Cron example - 1st of each month at 02:00 UTC:
#   0 2 1 * * /path/to/apps/backend/scripts/cron-refresh-off.sh /data/off.parquet \
#             >> /var/log/off-refresh/cron.log 2>&1
#
# Environment overrides:
#   OFF_LOG_DIR   - directory for monthly log files (default: /tmp/off-refresh-logs)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARQUET_FILE="${1:?Usage: $0 path/to/off.parquet}"
LOG_DIR="${OFF_LOG_DIR:-/tmp/off-refresh-logs}"
LOG_FILE="${LOG_DIR}/off-refresh-$(date -u +%Y%m).log"
ENV_FILE="${SCRIPT_DIR}/../.env"
RUN_LOG="/tmp/off-cron-run-$$.log"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date -u +%FT%TZ)] $*" | tee -a "$LOG_FILE"
}

log "========================================="
log "cron-refresh-off.sh starting"
log "  PARQUET : $PARQUET_FILE"
log "  LOG     : $LOG_FILE"
log "========================================="

# Source .env if present so this wrapper can be called directly by cron without
# requiring the operator to set DB credentials in the cron environment.
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  log "Loaded env from $ENV_FILE"
else
  log "WARNING: $ENV_FILE not found - expecting DB credentials already in environment"
fi

# Run the import script; capture stdout+stderr so we can both stream to the log
# and detect the exit code independently of pipefail.
trap 'rm -f "$RUN_LOG"' EXIT

"${SCRIPT_DIR}/refresh-off-products.sh" "$PARQUET_FILE" >"$RUN_LOG" 2>&1
EXIT_CODE=$?

# Append the captured output to the monthly log with timestamps stripped
# (the inner script already prepends its own timestamps).
tee -a "$LOG_FILE" < "$RUN_LOG"

if [[ $EXIT_CODE -eq 0 ]]; then
  log "OFF refresh completed successfully"
else
  log "ERROR: OFF refresh failed with exit code $EXIT_CODE"
  exit "$EXIT_CODE"
fi
