#!/bin/bash
# Read stdin JSON data
data=$(cat)

# Extract data using jq
model=$(echo "$data" | jq -r '.model.display_name // "local"')
used_pct=$(echo "$data" | jq -r '.context_window.used_percentage // 0')
branch=$(git branch --show-current 2>/dev/null || echo "no git")

# Color coding for context usage
if [ "$used_pct" -gt 75 ]; then
    color="\e[31m" # Red
elif [ "$used_pct" -gt 50 ]; then
    color="\e[33m" # Yellow
else
    color="\e[32m" # Green
fi

# Print the status line
printf "\e[1m\e[34m%s\e[0m | %s | %b%d%%\e[0m\n" "$model" "$branch" "$color" "$used_pct"
