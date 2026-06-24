#!/usr/bin/env bash
# Auto-rebuild when a src/*.ts file is written or edited.
# Receives PostToolUse JSON on stdin.
input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // ""')

if [[ "$file" == */src/*.ts ]]; then
  cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || dirname "$0")/../.." 2>/dev/null
  npm run build 2>&1
fi
