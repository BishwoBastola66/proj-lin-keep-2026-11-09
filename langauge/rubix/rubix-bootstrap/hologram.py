"""
Universal Hologram Header (96B) and Symbol Contract (48B) layout
per EIA specification (docs/main.md:93-111, 200-225).
"""

from dataclasses import dataclass
import struct
from typing import ClassVar

# EIA Magic Constant ('EIAH' in little-endian = 0x44484945)
MAGIC_EIAH: int = 0x44484945

# Target ISA Bitmasks
ISA_X86_64: int = 1
ISA_ARM64: int = 2
ISA_RISCV: int = 4

# Capability Mask Bits (CHERI/CCNS)
CAP_FS: int = 1 << 0
CAP_NET: int = 1 << 1
CAP_PROC: int = 1 << 2
CAP_MEM: int = 1 << 3

# SymbolContract Flags
FLAG_EXPORT: int = 1 << 0
FLAG_IMPORT: int = 1 << 1
FLAG_PURE: int = 1 << 2

# Calling Conventions
CC_SYSV: int = 1
CC_WIN64: int = 2
CC_ARM64: int = 3
CC_RISCV: int = 4


@dataclass
class UniversalHologramHeader:
    """
    Universal Hologram Header (96 bytes = 12 × u64, little-endian).
    Invariant semantic descriptor embedded in every EIA binary.
    """

    FORMAT: ClassVar[str] = "<12Q"
    SIZE: ClassVar[int] = 96

    magic: int = MAGIC_EIAH           # 0x00: 'EIAH' = 0x44484945
    version_major: int = 2            # 0x08: 2
    version_minor: int = 0            # 0x10: 0
    target_isa: int = 0               # 0x18: bitmask (x86=1, ARM=2, RV=4)
    symbol_count: int = 0             # 0x20
    hole_count: int = 0               # 0x28
    is_valid: int = 0                 # 0x30: 1 = verified
    capability_req_mask: int = 0      # 0x38
    symbol_table_offset: int = 0      # 0x40
    hole_table_offset: int = 0        # 0x48
    blake3_contract_root: int = 0     # 0x50: truncated 8-byte hash
    reserved_zero: int = 0            # 0x58: must be 0

    def to_bytes(self) -> bytes:
        """Serialize header to 96 bytes (little-endian)."""
        return struct.pack(
            self.FORMAT,
            self.magic,
            self.version_major,
            self.version_minor,
            self.target_isa,
            self.symbol_count,
            self.hole_count,
            self.is_valid,
            self.capability_req_mask,
            self.symbol_table_offset,
            self.hole_table_offset,
            self.blake3_contract_root,
            self.reserved_zero,
        )

    @classmethod
    def from_bytes(cls, data: bytes, offset: int = 0) -> "UniversalHologramHeader":
        """Deserialize header from 96 bytes at specified offset."""
        if len(data) - offset < cls.SIZE:
            raise ValueError(
                f"Data too short for UniversalHologramHeader: "
                f"expected at least {cls.SIZE} bytes at offset {offset}, got {len(data) - offset}"
            )
        values = struct.unpack_from(cls.FORMAT, data, offset)
        return cls(*values)


@dataclass
class SymbolContract:
    """
    EIA Symbol Contract Record (48 bytes = 6 × u64, little-endian).
    Per-entry symbol contract describing interface semantics and relocation.
    """

    FORMAT: ClassVar[str] = "<6Q"
    SIZE: ClassVar[int] = 48

    symbol_id: int = 0                # 0x00: Truncated cryptographic hash of symbol name
    type_sig_hash: int = 0            # 0x08: Invariant type signature hash
    flags: int = 0                    # 0x10: Bit 0: Export, Bit 1: Import, Bit 2: Pure
    calling_convention: int = 0       # 0x18: 1=SysV, 2=Win64, 3=ARM64, 4=RISCV
    physical_offset: int = 0          # 0x20: Resolved physical byte displacement
    hole_list_offset: int = 0         # 0x28: Offset into .eia_reloc (0 = none)

    def to_bytes(self) -> bytes:
        """Serialize symbol contract to 48 bytes (little-endian)."""
        return struct.pack(
            self.FORMAT,
            self.symbol_id,
            self.type_sig_hash,
            self.flags,
            self.calling_convention,
            self.physical_offset,
            self.hole_list_offset,
        )

    @classmethod
    def from_bytes(cls, data: bytes, offset: int = 0) -> "SymbolContract":
        """Deserialize symbol contract from 48 bytes at specified offset."""
        if len(data) - offset < cls.SIZE:
            raise ValueError(
                f"Data too short for SymbolContract: "
                f"expected at least {cls.SIZE} bytes at offset {offset}, got {len(data) - offset}"
            )
        values = struct.unpack_from(cls.FORMAT, data, offset)
        return cls(*values)
