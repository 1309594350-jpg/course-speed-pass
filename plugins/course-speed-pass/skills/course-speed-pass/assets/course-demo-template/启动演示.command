#!/bin/zsh
set -e

cd "$(dirname "$0")"

node scripts/server.mjs &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT INT TERM

sleep 1
open "http://127.0.0.1:4173"
wait "$server_pid"
