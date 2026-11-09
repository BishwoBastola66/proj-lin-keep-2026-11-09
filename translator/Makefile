# ==============================================================================
# Rubix Top-Level Project Makefile
# Directs commands to the pure Rubix compiler toolchain.
# ==============================================================================

.PHONY: all test rubix stage2 clean

all: test

rubix:
	@$(MAKE) -C rubix rubix

stage2:
	@$(MAKE) -C rubix stage2

test:
	@$(MAKE) -C rubix test

clean:
	@$(MAKE) -C rubix clean
