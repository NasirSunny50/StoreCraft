#!/usr/bin/env bash
# Start StoreCraft locally: DB + app + admin. Usage: ./start.sh [--fresh] [--no-seed]
cd "$(dirname "$0")" || exit 1
exec node scripts/dev-up.mjs "$@"
