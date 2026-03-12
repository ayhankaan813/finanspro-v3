#!/bin/bash
# Pre-compile frequently used pages after dev server starts
# This runs in the background so the terminal is immediately available

PORT=${1:-3000}
MAX_WAIT=30

# Wait for the server to be ready
for i in $(seq 1 $MAX_WAIT); do
  if curl -s -o /dev/null http://localhost:$PORT 2>/dev/null; then
    break
  fi
  sleep 1
done

# Pre-warm the most used pages (in parallel)
echo "[warmup] Pre-compiling pages..."
curl -s -o /dev/null http://localhost:$PORT/dashboard &
curl -s -o /dev/null http://localhost:$PORT/transactions &
curl -s -o /dev/null http://localhost:$PORT/sites &
curl -s -o /dev/null http://localhost:$PORT/financiers &
curl -s -o /dev/null http://localhost:$PORT/partners &
wait
curl -s -o /dev/null http://localhost:$PORT/reports/kasa-raporu &
curl -s -o /dev/null http://localhost:$PORT/reports/reconciliation &
curl -s -o /dev/null http://localhost:$PORT/reports/analysis &
curl -s -o /dev/null http://localhost:$PORT/organization &
curl -s -o /dev/null http://localhost:$PORT/external-parties &
wait
echo "[warmup] All pages pre-compiled!"
