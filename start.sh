#!/usr/bin/env bash
# WORMHOLE start: install dependencies, build dist/ when needed, serve it.
# - Source and built output stay inside this project dir (dist/).
# - OPENCODE_WEB_DIR / RUNNER_TEMP are only for worker metadata (stamps,
#   deployment-output.json), never for source or build output.
# - Runs in the FOREGROUND on PORT (default 3000); the controller launcher
#   (runtime scripts/start-project.sh) owns the tmux app-server session.
# - Writes $OPENCODE_WEB_DIR/deployment-output.json {project, directory}.
# Every command is individually timed (bash `time -p`).
set -euo pipefail
time -p cd "$(dirname "$0")"
time -p node "${RUNTIME_DIR:?}/scripts/default-start.mjs"
