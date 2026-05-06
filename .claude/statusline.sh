#!/usr/bin/env bash
# Claude Code enhanced statusline
# Segments: Model | CWD@Branch | Tokens | Effort | 5h | 7d | Extra | Update

data=$(cat)

# ── helpers ──────────────────────────────────────────────────────────────────

# Return a literal \e[...] ANSI code string (interpreted later by printf %b)
pct_color() {
    local p="${1:-0}"
    if   [[ $p -ge 90 ]]; then echo '\e[31m'        # red
    elif [[ $p -ge 70 ]]; then echo '\e[38;5;208m'  # orange
    elif [[ $p -ge 50 ]]; then echo '\e[33m'         # yellow
    else                        echo '\e[32m'         # green
    fi
}

# Format Unix epoch → relative countdown string (e.g. "2h30m")
countdown() {
    local target="$1" now diff h m
    now=$(date +%s)
    diff=$(( target - now ))
    [[ $diff -le 0 ]] && { printf 'now'; return; }
    h=$(( diff / 3600 ))
    m=$(( (diff % 3600) / 60 ))
    [[ $h -gt 0 ]] && printf '%dh%dm' "$h" "$m" || printf '%dm' "$m"
}

SEP='\e[2m│\e[0m'

# ── JSON extraction ──────────────────────────────────────────────────────────

jq_r() { echo "$data" | jq -r "$1"; }

model=$(     jq_r '.model.display_name // "local"')
cwd_raw=$(   jq_r '.cwd // ""')
ctx_pct=$(   jq_r '(.context_window.used_percentage // 0) | floor')
ctx_size=$(  jq_r '.context_window.context_window_size // 0')
ctx_tokens=$(jq_r '.context_window.total_input_tokens // 0')
effort=$(    jq_r '.effort.level // ""')
r5_pct=$(    jq_r 'if .rate_limits.five_hour.used_percentage  != null then (.rate_limits.five_hour.used_percentage  | floor | tostring) else "" end')
r5_reset=$(  jq_r '.rate_limits.five_hour.resets_at  // 0')
r7_pct=$(    jq_r 'if .rate_limits.seven_day.used_percentage != null then (.rate_limits.seven_day.used_percentage | floor | tostring) else "" end')
r7_reset=$(  jq_r '.rate_limits.seven_day.resets_at // 0')
extra=$(     jq_r 'if .rate_limits.extra.used_percentage != null then (.rate_limits.extra.used_percentage | floor | tostring) else "" end')
version=$(   jq_r '.version // ""')

# ── CWD @ Branch (+tracked ?untracked) ───────────────────────────────────────

dir="${cwd_raw:-$(pwd)}"
folder=$(basename "$dir")
branch=$(git -C "$dir" branch --show-current 2>/dev/null || true)

loc="\e[36m${folder}"
if [[ -n "$branch" ]]; then
    loc+="@${branch}"
    if porcelain=$(git -C "$dir" status --porcelain 2>/dev/null); then
        n_changed=0; n_untracked=0
        while IFS= read -r line; do
            [[ -z "$line" ]] && continue
            if [[ "$line" == '?? '* ]]; then
                n_untracked=$(( n_untracked + 1 ))
            else
                n_changed=$(( n_changed + 1 ))
            fi
        done <<< "$porcelain"
        [[ $n_changed   -gt 0 ]] && loc+=" \e[0m\e[32m+${n_changed}"
        [[ $n_untracked -gt 0 ]] && loc+=" \e[0m\e[90m?${n_untracked}"
    fi
fi
loc+='\e[0m'

# ── version update check (24 h cache at /tmp/.claude-code-ver) ───────────────

update_seg=''
if [[ -n "$version" ]]; then
    cache="/tmp/.claude-code-ver"
    now_ts=$(date +%s)
    latest=''
    if [[ -f "$cache" ]]; then
        cached_ts=$(sed -n '1p' "$cache" 2>/dev/null || true)
        if [[ -n "$cached_ts" ]] && (( now_ts - cached_ts < 86400 )); then
            latest=$(sed -n '2p' "$cache" 2>/dev/null || true)
        fi
    fi
    if [[ -z "$latest" ]]; then
        latest=$(curl -sf --max-time 2 \
            'https://registry.npmjs.org/@anthropic-ai/claude-code/latest' \
            2>/dev/null | jq -r '.version // ""')
        [[ -n "$latest" ]] && printf '%s\n%s\n' "$now_ts" "$latest" > "$cache"
    fi
    [[ -n "$latest" && "$latest" != "$version" ]] && \
        update_seg=" $SEP \e[33m↑ ${latest}\e[0m"
fi

# ── rate-limit helper (appends to global $out) ───────────────────────────────

append_rate() {
    local label="$1" pct="$2" epoch="${3:-0}"
    [[ -z "$pct" ]] && return
    local c; c=$(pct_color "$pct")
    local t=''
    [[ "$epoch" -gt 0 ]] && t=" \e[2m$(countdown "$epoch")\e[0m"
    out+=" $SEP \e[2m${label}\e[0m:${c}${pct}%\e[0m${t}"
}

# ── assemble & print ──────────────────────────────────────────────────────────

# Model (bold blue)
out="\e[1m\e[34m${model}\e[0m"

# CWD@Branch
out+=" $SEP $loc"

# Tokens: pct% (used_k/total_k)
tc=$(pct_color "${ctx_pct:-0}")
if [[ "${ctx_size:-0}" -gt 0 ]]; then
    used_k=$(awk "BEGIN{printf \"%.1f\", ${ctx_tokens:-0}/1000}")
    total_k=$(awk "BEGIN{printf \"%.0f\", ${ctx_size:-0}/1000}")
    out+=" $SEP ${tc}${ctx_pct:-0}%\e[0m \e[2m${used_k}k/${total_k}k\e[0m"
else
    out+=" $SEP ${tc}${ctx_pct:-0}%\e[0m"
fi

# Effort level (magenta): low / med / high / xhigh / max
if [[ -n "$effort" ]]; then
    label="$effort"
    [[ "$effort" == "medium" ]] && label="med"
    out+=" $SEP \e[35m${label}\e[0m"
fi

# Rate limits
append_rate "5h" "$r5_pct" "$r5_reset"
append_rate "7d" "$r7_pct" "$r7_reset"

# Extra credits (if plan exposes the field)
if [[ -n "$extra" ]]; then
    ec=$(pct_color "$extra")
    out+=" $SEP \e[2mextra\e[0m:${ec}${extra}%\e[0m"
fi

# Update available
out+="$update_seg"

printf '%b\n' "$out"
