# ==============================================================================
# Rubix Sovereign Subsystem Makefile
# Pure Rubix Architecture: .bix -> Machine Code Bytes -> Native Execution
# Zero GCC, zero Clang, zero LLVM, zero Rust, zero Python, zero external toolchains.
# ==============================================================================

.PHONY: all test eia polyglot daemon bench verify-all rubix stage2 orderbook fib clean

all: verify-all

rubix:
	@echo "==> Rebuilding standalone rubix native compiler binary..."
	./bin/rubix compile compiler/main.bix -o scratch/rubix.elf
	@cp scratch/rubix.elf bin/rubix.elf
	@cp scratch/rubix.elf bin/rubix
	@chmod +x bin/rubix bin/rubix.elf
	@echo "==> Successfully built rubix binary"

stage2:
	@echo "==> Rebuilding bin/rubix_stage2 using pure Rubix..."
	./bin/rubix compile compiler/main.bix -o scratch/stage2.elf
	@cp scratch/stage2.elf bin/rubix_stage2
	@chmod +x bin/rubix_stage2
	@echo "==> Rebuilt bin/rubix_stage2 successfully"

test:
	@echo "==> Running full 12-Architecture verification suite..."
	@./bin/rubix run tests/test_architectures.bix

polyglot:
	@echo "==> Running Universal Polyglot Binary Packaging (UPBP) verification..."
	@./bin/rubix run tests/test_upbp.bix

daemon:
	@echo "==> Running Resident Compiler Daemon (RAMC) verification..."
	@./bin/rubix run tests/test_daemon.bix

bench:
	@echo "==> Running Performance & Throughput Benchmarks..."
	@./bin/rubix run benchmarks/bench_fib.bix
	@./bin/rubix run benchmarks/bench_loop.bix

eia:
	@echo "==> Running Eternal Interface Architecture (EIA) Master verification..."
	@./bin/rubix run tests/test_eia_complete.bix
	@./bin/rubix run tests/test_eia_schema_evolution.bix

verify-all: test eia polyglot daemon orderbook fib
	@echo "==> ALL RUBIX & EIA SUBSYSTEMS FULLY VERIFIED"

orderbook:
	@echo "==> Running CXL Persistent Spacetime Orderbook Example..."
	@./bin/rubix run examples/spacetime_orderbook.bix

fib:
	@echo "==> Running Recursive Fibonacci Benchmark..."
	@./bin/rubix run examples/fibonacci.bix

clean:
	@echo "==> Cleaning temporary artifacts..."
	@rm -f scratch/*.elf scratch/*.bin
