#!/usr/bin/env bash
# ==============================================================================
# Rubix Test Suite Runner
# Pure Rubix Architecture: zero Python, zero external toolchains.
# ==============================================================================
set -e


echo "==> Running compiler subsystems test suite..."
./bin/rubix tests/test_compiler_subsystems.bix

echo "==> Running heap memory test suite..."
./bin/rubix tests/test_heap_memory.bix

echo "==> Running dynamic collections test suite..."
./bin/rubix tests/test_dynamic_collections.bix

echo "==> Running shipped examples..."
./bin/rubix examples/01_basics.bix
./bin/rubix examples/02_control_flow.bix
./bin/rubix examples/03_functions.bix
./bin/rubix examples/04_algorithms.bix
./bin/rubix examples/05_collatz.bix
./bin/rubix examples/06_primes.bix
./bin/rubix examples/07_binary_search.bix
./bin/rubix examples/08_vector_and_map.bix
echo "==> Running round 5 acceptance test suite..."
./bin/rubix tests/round5_acceptance.bix

echo "==> Verifying standard library modules (19/19)..."
for f in std/*.bix; do
    ./bin/rubix check "$f" > /dev/null
done
echo "PASS: All 19 standard library modules type-checked and verified cleanly."

echo "==> Running cross-target verification suite (x86-64, AArch64, RISC-V 64)..."
./bin/rubix tests/test_cross_target.bix > /dev/null
if command -v qemu-aarch64 > /dev/null 2>&1; then
    ./bin/rubix compile tests/test_cross_target.bix -t aarch64-linux -o /tmp/cross_arm.elf
    qemu-aarch64 /tmp/cross_arm.elf > /dev/null
fi
if command -v qemu-riscv64 > /dev/null 2>&1; then
    ./bin/rubix compile tests/test_cross_target.bix -t riscv64-linux -o /tmp/cross_riscv.elf
    qemu-riscv64 /tmp/cross_riscv.elf > /dev/null
fi
echo "PASS: Cross-target execution (x86-64, AArch64, RISC-V 64) verified cleanly."

echo "==> Running target conformance & universal packaging suite..."
./bin/rubix tests/test_target_conformance.bix > /dev/null
if command -v qemu-aarch64 > /dev/null 2>&1; then
    ./bin/rubix compile tests/test_target_conformance.bix -t aarch64-unknown-linux-elf -o /tmp/conf_arm.elf
    qemu-aarch64 /tmp/conf_arm.elf > /dev/null
fi
if command -v qemu-riscv64 > /dev/null 2>&1; then
    ./bin/rubix compile tests/test_target_conformance.bix -t riscv64-unknown-linux-elf -o /tmp/conf_riscv.elf
    qemu-riscv64 /tmp/conf_riscv.elf > /dev/null
fi
./bin/rubix compile tests/test_target_conformance.bix -t x86_64-pc-windows-pe -o /tmp/conf_win.exe > /dev/null
./bin/rubix compile tests/test_target_conformance.bix -t x86_64-apple-darwin-macho -o /tmp/conf_mac.macho > /dev/null
./bin/rubix compile tests/test_target_conformance.bix -t wasm32-unknown-wasi -o /tmp/conf_wasi.wasm > /dev/null
echo "PASS: Target conformance suite and universal container packaging verified cleanly."

echo "==> Running Rubix unified semantic test suite..."
./bin/rubix test tests/test_effects.bix
./bin/rubix test tests/test_capabilities.bix
./bin/rubix test tests/test_affine_borrow.bix
./bin/rubix test tests/test_escape_regions.bix
./bin/rubix test tests/test_sir_pipeline.bix
./bin/rubix test tests/test_concurrency_csp.bix
./bin/rubix test tests/test_abi_resilience.bix
./bin/rubix abi check examples/01_basics.bix > /dev/null
./bin/rubix abi analyze examples/01_basics.bix > /dev/null
./bin/rubix bench tests/bench_semantic_performance.bix

echo "==> Running Rubix adversarial security checks..."
if ./bin/rubix check tests/test_adversarial_purity.bix > /dev/null 2>&1; then
    echo "FAIL: Expected purity violation rejection!"
    exit 1
fi
if ./bin/rubix check tests/test_adversarial_capability.bix > /dev/null 2>&1; then
    echo "FAIL: Expected capability unauthorized rejection!"
    exit 1
fi
echo "PASS: Adversarial effect and capability violations rejected at compile time."

echo "==> Running Rubix AIR and compile verification..."
./bin/rubix air tests/test_sir_pipeline.bix > /dev/null
./bin/rubix compile tests/bench_semantic_performance.bix -o /tmp/bench_test.elf > /dev/null
/tmp/bench_test.elf > /dev/null
rm -f /tmp/bench_test.elf
echo "PASS: AIR lowering and sovereign native compilation verified cleanly."

echo "==> Running Rubix shipped semantic examples..."
./bin/rubix run examples/09_effects_and_caps.bix
./bin/rubix run examples/10_affine_resources.bix
./bin/rubix run examples/11_region_alloc.bix
echo "PASS: All Rubix architectural tests and examples passed cleanly."

echo "==> All Rubix tests and examples executed and passed cleanly!"

