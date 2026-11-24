#!/bin/bash
set -e
cd "$(dirname "$0")/.."
zip -r ../silica-host.zip . -x "*.git*" -x "*node_modules*"
echo "Created silica-host.zip"
