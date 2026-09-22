#!/usr/bin/env bash
# Boot the vite dev server, capture screenshots, tear the server down again.
#
# Everything happens inside one invocation on purpose: a long-lived background
# dev server does not survive a session reconnect, and a half-dead server leaves
# the next run talking to nothing. The trap guarantees teardown.
#
# Usage:  scripts/_devshot.sh --shot name:path:selector [--shot ...] [--viewport WxH]
set -u
cd "$(dirname "$0")/.."

PORT="${PORT:-5199}"
LOG="/tmp/vite-$PORT.log"

# --host 127.0.0.1 is deliberate: vite's default `localhost` can bind to ::1 only
# on Windows, and then an IPv4 readiness probe never sees the server even though
# it is up. Pinning both sides to 127.0.0.1 removes the ambiguity.
# An orphan from an earlier run would make the --strictPort start below fail with
# a confusing "Port ... is already in use" that reads like the script is broken.
# Say so plainly instead, and name the PID.
stale=$(netstat -ano 2>/dev/null | grep LISTENING | grep ":$PORT " | awk '{print $NF}' | sort -u | tr '\n' ' ')
if [ -n "$stale" ]; then
  echo "port $PORT is already held by pid(s): $stale"
  echo "that is a leaked dev server from an earlier run; clear it with:"
  echo "  MSYS_NO_PATHCONV=1 taskkill /PID <pid> /T /F"
  exit 1
fi

npm run dev -- --port "$PORT" --strictPort --host 127.0.0.1 >"$LOG" 2>&1 &
VITE_PID=$!
cleanup() {
  # bash's builtin kill understands the MSYS pid that `$!` returns. taskkill does
  # NOT - it wants a WINDOWS pid, so `taskkill /PID $VITE_PID` addresses an
  # unrelated process. Measured 2026-09-22: with /T it killed the calling shell.
  kill "$VITE_PID" 2>/dev/null
  # npm exits but vite outlives it and keeps holding the port, which is what made
  # the next --strictPort start fail. Sweep whoever is ACTUALLY listening: netstat
  # reports a real Windows pid, which taskkill does accept, and by this point the
  # pre-check above guarantees that listener is ours.
  for pid in $(netstat -ano 2>/dev/null | grep LISTENING | grep ":$PORT " | awk '{print $NF}' | sort -u); do
    MSYS_NO_PATHCONV=1 taskkill /PID "$pid" /F >/dev/null 2>&1
  done
  wait "$VITE_PID" 2>/dev/null
}
trap cleanup EXIT

# Wait for a real 200. --noproxy matters: a proxy env var makes curl report 502
# for localhost, which reads exactly like "server is broken" when it is fine.
ready=0
last=""
for _ in $(seq 1 80); do
  last=$(curl -s -o /dev/null -w '%{http_code}' --noproxy '*' --max-time 2 "http://127.0.0.1:$PORT/" 2>/dev/null)
  if [ "$last" = "200" ]; then ready=1; break; fi
  sleep 0.5
done

if [ "$ready" != "1" ]; then
  echo "dev server never became ready on $PORT (last http_code=$last); log:"
  tail -20 "$LOG"
  exit 1
fi

NODE_PATH="${NODE_PATH:-C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules}"
export NODE_PATH

# `--run <script>` swaps the action: boot the server, run that script against it,
# tear down. Used for browser probes that need real layout but no screenshot.
if [ "${1:-}" = "--run" ]; then
  shift
  node "$@" --base "http://127.0.0.1:$PORT" || exit $?
  exit 0
fi

node scripts/_shot.cjs --base "http://127.0.0.1:$PORT" "$@"
