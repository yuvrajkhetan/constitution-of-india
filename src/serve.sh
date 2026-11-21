#!/bin/bash
cd "$(dirname "$0")"
for port in 8765 8766; do curl -s -o /dev/null localhost:$port/preview.html || (setsid nohup python3 gzserve.py site $port >/dev/null 2>&1 &); done
sleep 1
