#!/bin/bash
# ==========================================================================
# DPR Compliance Analysis System - Root Workspace Launcher (macOS / Linux)
# ==========================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/DPR_new-main/DPR_new-main"
bash quick_start.sh
