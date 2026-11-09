"""
EIA Relocation Section (.eia_reloc) and 32-bit Displacement Hole Management
per docs/main.md:11, 113-118.

Layout of .eia_reloc:
  Count:   u32 (4 bytes, little-endian)
  Entries: RelocEntry[] (12 bytes each: instruction_offset, field_hash, symbol_id)
"""

from dataclasses import dataclass
import struct
from typing import ClassVar, Sequence, List

RELOC_FMT: str = "<III"
RELOC_SIZE: int = 12

HEADER_FMT: str = "<I"
HEADER_SIZE: int = 4


@dataclass
class RelocEntry:
    """
    A single 12-byte relocation displacement hole entry.
    """

    FORMAT: ClassVar[str] = RELOC_FMT
    SIZE: ClassVar[int] = RELOC_SIZE

    instruction_offset: int = 0  # Offset in code buffer where the 32-bit hole resides
    field_hash: int = 0          # Invariant hash of struct field name
    symbol_id: int = 0           # Associated symbol contract ID

    def to_bytes(self) -> bytes:
        """Serialize entry to 12 bytes (<III, little-endian)."""
        return struct.pack(
            self.FORMAT,
            self.instruction_offset,
            self.field_hash,
            self.symbol_id,
        )

    @classmethod
    def from_bytes(cls, data: bytes, offset: int = 0) -> "RelocEntry":
        """Deserialize entry from 12 bytes at offset."""
        if len(data) - offset < cls.SIZE:
            raise ValueError(
                f"Data too short for RelocEntry: expected at least {cls.SIZE} bytes at offset {offset}, got {len(data) - offset}"
            )
        values = struct.unpack_from(cls.FORMAT, data, offset)
        return cls(*values)


def build_reloc_section(entries: Sequence[RelocEntry]) -> bytes:
    """
    Build the .eia_reloc section binary bytes.
    Layout:
      0x00..0x03: u32 entry count (little-endian)
      0x04..    : array of 12-byte RelocEntry records
    """
    header = struct.pack(HEADER_FMT, len(entries))
    body = b"".join(entry.to_bytes() for entry in entries)
    return header + body


def parse_reloc_section(data: bytes, offset: int = 0) -> List[RelocEntry]:
    """
    Parse .eia_reloc section binary bytes into a list of RelocEntry objects.
    """
    if len(data) - offset < HEADER_SIZE:
        raise ValueError(
            f"Data too short for reloc section header: expected at least {HEADER_SIZE} bytes, got {len(data) - offset}"
        )
    (count,) = struct.unpack_from(HEADER_FMT, data, offset)
    expected_size = HEADER_SIZE + count * RELOC_SIZE
    if len(data) - offset < expected_size:
        raise ValueError(
            f"Data too short for {count} reloc entries: expected {expected_size} bytes, got {len(data) - offset}"
        )

    entries: List[RelocEntry] = []
    curr = offset + HEADER_SIZE
    for _ in range(count):
        entries.append(RelocEntry.from_bytes(data, curr))
        curr += RELOC_SIZE
    return entries


def patch_hole(code_buf: bytearray, entry: RelocEntry, displacement: int) -> None:
    """
    In-memory JIT displacement hole patcher (docs/main.md:113-118).
    Writes 32-bit resolved displacement into code_buf at entry.instruction_offset.
    """
    if entry.instruction_offset + 4 > len(code_buf):
        raise IndexError(
            f"Hole offset {entry.instruction_offset} out of bounds for buffer of size {len(code_buf)}"
        )
    struct.pack_into("<I", code_buf, entry.instruction_offset, displacement & 0xFFFFFFFF)
