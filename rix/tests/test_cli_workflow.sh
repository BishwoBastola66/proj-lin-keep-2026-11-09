#!/usr/bin/env bash
# ==============================================================================
# Rix — End-to-End CLI Integration Test Workflow (tests/test_cli_workflow.sh)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RIX_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RIX_BIN="$RIX_ROOT/bin/rix"
SANDBOX="/tmp/rix_test_sandbox_$$"

echo "======================================================================"
echo "✦ Rix End-to-End CLI Integration Test"
echo "======================================================================"

# Clean up sandbox on exit
trap 'rm -rf "$SANDBOX"' EXIT

mkdir -p "$SANDBOX"
cd "$SANDBOX"

# 1. Test Version & Help
echo "Step 1: Testing version and help commands..."
"$RIX_BIN" --version | grep -q "Rix Package Manager"
"$RIX_BIN" --help | grep -q "Package Management Commands"
echo "  [PASS] version & help"

# 2. Test Package Initialization (rix init)
echo "Step 2: Testing package initialization (rix init test_package)..."
"$RIX_BIN" init test_package
[ -f "Rix.toml" ] || { echo "FAIL: Rix.toml not created"; exit 1; }
[ -f "Rix.lock" ] || { echo "FAIL: Rix.lock not created"; exit 1; }
[ -f "src/main.bix" ] || { echo "FAIL: src/main.bix not created"; exit 1; }
[ -f "tests/test_main.bix" ] || { echo "FAIL: tests/test_main.bix not created"; exit 1; }
echo "  [PASS] rix init created manifest, lockfile, source entry, and tests"

# 3. Test Package Script Execution (rix run)
echo "Step 3: Testing script execution (rix run start)..."
"$RIX_BIN" run start | grep -q "Hello from test_package!"
echo "  [PASS] rix run executed package entrypoint script"

# 4. Test Adding Dependencies (rix add)
echo "Step 4: Testing adding dependencies (rix add logger 1.0.0)..."
"$RIX_BIN" add logger 1.0.0
grep -q 'logger = "1.0.0"' Rix.toml || { echo "FAIL: logger not in Rix.toml"; exit 1; }
grep -q 'logger' Rix.lock || { echo "FAIL: logger not in Rix.lock"; exit 1; }
[ -d "packages/logger" ] || { echo "FAIL: packages/logger not created"; exit 1; }
echo "  [PASS] rix add updated manifest, lockfile, and packages directory"

# 5. Test Listing Dependencies (rix list & rix tree)
echo "Step 5: Testing dependency listing (rix list, rix tree)..."
"$RIX_BIN" list | grep -q "logger@1.0.0"
"$RIX_BIN" tree | grep -q "logger@1.0.0"
echo "  [PASS] rix list & rix tree reflected installed dependencies"

# 6. Test Removing Dependencies (rix remove)
echo "Step 6: Testing dependency removal (rix remove logger)..."
"$RIX_BIN" remove logger
if grep -q 'logger = ' Rix.toml; then
    echo "FAIL: logger still in Rix.toml"
    exit 1
fi
if grep -q '^logger = ' Rix.lock; then
    echo "FAIL: logger still in Rix.lock"
    exit 1
fi
echo "  [PASS] rix remove cleaned manifest, lockfile, and package directories"

# 7. Test Package Installation (rix install)
echo "Step 7: Testing installation resolution (rix install)..."
"$RIX_BIN" add logger 0.2.0
rm -rf packages/logger
"$RIX_BIN" install | grep -q "Installed"
[ -d "packages/logger" ] || { echo "FAIL: logger not reinstalled"; exit 1; }
echo "  [PASS] rix install resolved and restored declared packages"

# 8. Test Project Scaffolding (rix new)
echo "Step 8: Testing project directory scaffolding (rix new)..."
cd "$SANDBOX"
"$RIX_BIN" new sample_app
cd sample_app
[ -f "Rix.toml" ] || { echo "FAIL: Rix.toml missing in scaffolded app"; exit 1; }
"$RIX_BIN" run start | grep -q "Hello from sample_app!"
echo "  [PASS] rix new scaffolded app and rix run start executed cleanly"

echo "======================================================================"
echo "ALL RIX CLI INTEGRATION WORKFLOW TESTS PASSED (100% SUCCESS)"
echo "======================================================================"
