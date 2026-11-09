# ==============================================================================
# Rubix Compiler & Sovereign 12-Architecture Substrate
# Pure Rubix Architecture: .bix -> Machine Code Bytes -> Native Execution
# Zero GCC, zero Clang, zero LLVM, zero Rust, zero Python, zero external toolchains.
# ==============================================================================

.PHONY: all test rubix stage2 run clean

all: test

rubix:
	@echo "==> Building standalone rubix native compiler binary..."
	./bin/rubix compile src/compiler/main.bix -o scratch/rubix.elf
	@cp scratch/rubix.elf bin/rubix.elf
	@cp scratch/rubix.elf bin/rubix
	@chmod +x bin/rubix bin/rubix.elf
	@echo "==> Successfully built rubix binary"

stage2:
	@echo "==> Rebuilding bin/rubix_stage2 using pure Rubix..."
	./bin/rubix compile src/compiler/main.bix -o scratch/stage2.bin
	@cp scratch/stage2.bin bin/rubix_stage2
	@chmod +x bin/rubix_stage2
	@echo "==> Rebuilt bin/rubix_stage2 successfully"

test:
	@echo "==> Running full 12-Architecture verification suite..."
	@./bin/rubix run tests/test_all_architectures.bix

orderbook:
	@echo "==> Running CXL Persistent Spacetime Orderbook Example..."
	@./bin/rubix run examples/spacetime_orderbook.bix

clean:
	@echo "==> Cleaning temporary artifacts..."
	@rm -f scratch/*.elf scratch/*.bin
