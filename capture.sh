#!/usr/bin/env bash
# WORMHOLE capture: screenshot CAPTURE_URL (exact URL) at desktop + mobile sizes.
# - Reads CAPTURE_URL and CAPTURE_DIR from the environment.
# - Writes final-desktop.png and final-mobile.png into CAPTURE_DIR only
#   (capture output stays outside the source tree).
# - Closes its own browser; leaves the app server running.
# - Exit 75: temporary navigation/browser infrastructure failure.
#   Exit 1: script or rendering defect.
# Every command is individually timed (bash `time -p`).
set -euo pipefail
time -p cd "$(dirname "$0")"
time -p node "${RUNTIME_DIR:?}/scripts/default-capture.mjs"
