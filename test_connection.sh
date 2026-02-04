#!/bin/bash
cd turfsheet-app
npm run dev > /tmp/dev-server.log 2>&1 &
DEV_PID=$!
echo "Dev server PID: $DEV_PID"
/bin/bash -c "sleep 8"
curl -I http://localhost:5173 2>&1 | head -5
kill $DEV_PID 2>/dev/null || true
