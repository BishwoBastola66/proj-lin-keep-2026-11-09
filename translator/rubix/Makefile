# ==============================================================================
# Rubix Compiler — Native Independent Compiler
# Pure Rubix Architecture: .bix -> Machine Code Bytes -> Native Execution
# Zero GCC, zero Clang, zero LLVM, zero Python, zero external toolchains.
# ==============================================================================

.PHONY: all test stage2 rubix clean

all: test

rubix:
	@echo "==> Building standalone rubix native compiler binary..."
	./bin/rubix compile compiler/main.bix -o scratch/rubix.elf
	@cp scratch/rubix.elf bin/rubix.elf
	@chmod +x bin/rubix.elf
	@echo "==> Successfully built rubix binary"

stage2:
	@echo "==> Rebuilding bin/rubix_stage2 using pure Rubix..."
	./bin/rubix compile compiler/main.bix -o scratch/stage2.bin
	@cp scratch/stage2.bin bin/rubix_stage2
	@chmod +x bin/rubix_stage2
	@echo "==> Rebuilt bin/rubix_stage2 successfully"

test:
	@echo "==> Running full Rubix unified verification suite..."
	@./scripts/test.sh

clean:
	@echo "==> Cleaning temporary artifacts..."
	@rm -f *.bin *.o *.s *.a scratch/*.bin scratch/*.css scratch/*.elf
