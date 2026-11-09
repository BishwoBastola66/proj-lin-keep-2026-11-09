"""
EIA Binary Emitter per docs/main.md:93-137.

Combines:
  1. Universal Hologram Header (96B)
  2. Symbol Contracts (48B × N)
  3. Relocation Table (.eia_reloc, 4B count + 12B × H)
  4. Machine Code Bytes
  5. UPBP Multi-OS Polyglot Container (MZ + Shell + ELF + Mach-O)

Payload layout at 0x400:
  0x400:      UniversalHologramHeader (96B)
  0x460:      SymbolContract[] (48B × symbol_count)
  0x460+48N:  .eia_reloc section (4B count + 12B × hole_count)
  ...:        code bytes (patched at runtime by ARLL-Agent)
"""

from typing import Sequence, Optional, Dict, Any, List

from hologram import (
    UniversalHologramHeader,
    SymbolContract,
    MAGIC_EIAH,
)
from blake3_64 import compute_contract_root, verify_contract_root
from upbp import assemble_upbp, OFFSET_PAYLOAD
from reloc import (
    RelocEntry,
    build_reloc_section,
    parse_reloc_section,
    HEADER_SIZE as RELOC_HEADER_SIZE,
)


def emit_binary(
    symbol_contracts: Optional[Sequence[SymbolContract]] = None,
    code_bytes: bytes = b"",
    reloc_entries: Optional[Sequence[RelocEntry]] = None,
    target_isa: int = 1,
    capability_req_mask: int = 0,
) -> bytes:
    """
    Emit a complete UPBP + EIA executable binary.

    Args:
        symbol_contracts: List of SymbolContract records (48 bytes each).
        code_bytes: Raw machine code bytes.
        reloc_entries: List of RelocEntry relocation displacement holes.
        target_isa: ISA bitmask (1 = x86-64, 2 = ARM64, 4 = RISC-V).
        capability_req_mask: Required CCNS/CHERI capability bits.

    Returns:
        Complete polyglot executable bytes.
    """
    symbols: List[SymbolContract] = list(symbol_contracts or [])
    relocs: List[RelocEntry] = list(reloc_entries or [])

    symbol_count = len(symbols)
    hole_count = len(relocs)

    # Calculate offsets in payload
    offset_header = OFFSET_PAYLOAD  # 0x400
    offset_symbols = offset_header + UniversalHologramHeader.SIZE  # 0x460
    offset_reloc = offset_symbols + symbol_count * SymbolContract.SIZE  # 0x460 + 48N

    # 1. Compute BLAKE3-64 contract root over the symbol contracts
    contract_root = compute_contract_root(symbols)

    # 2. Build UniversalHologramHeader
    header = UniversalHologramHeader(
        magic=MAGIC_EIAH,
        version_major=2,
        version_minor=0,
        target_isa=target_isa,
        symbol_count=symbol_count,
        hole_count=hole_count,
        is_valid=1,
        capability_req_mask=capability_req_mask,
        symbol_table_offset=offset_symbols,
        hole_table_offset=offset_reloc,
        blake3_contract_root=contract_root,
        reserved_zero=0,
    )

    # 3. Serialize sections
    header_bytes = header.to_bytes()
    assert len(header_bytes) == UniversalHologramHeader.SIZE  # 96 bytes

    symbol_table_bytes = b"".join(sym.to_bytes() for sym in symbols)
    assert len(symbol_table_bytes) == symbol_count * SymbolContract.SIZE

    reloc_bytes = build_reloc_section(relocs)
    assert len(reloc_bytes) == RELOC_HEADER_SIZE + hole_count * RelocEntry.SIZE

    # 4. Assemble payload
    payload = header_bytes + symbol_table_bytes + reloc_bytes + code_bytes

    # 5. Package into UPBP polyglot container
    return assemble_upbp(
        hologram_bytes=payload,
        code_bytes=b"",
        target_isa=target_isa,
    )


def parse_eia_binary(data: bytes) -> Dict[str, Any]:
    """
    Helper function to parse and validate an emitted EIA binary.

    Returns:
        Dictionary containing:
          - 'header': UniversalHologramHeader
          - 'symbol_contracts': List[SymbolContract]
          - 'reloc_entries': List[RelocEntry]
          - 'code_bytes': bytes
          - 'is_verified': bool
    """
    if len(data) < OFFSET_PAYLOAD + UniversalHologramHeader.SIZE:
        raise ValueError("Binary too small to contain UniversalHologramHeader")

    header = UniversalHologramHeader.from_bytes(data, OFFSET_PAYLOAD)

    symbols: List[SymbolContract] = []
    sym_offset = header.symbol_table_offset
    for _ in range(header.symbol_count):
        symbols.append(SymbolContract.from_bytes(data, sym_offset))
        sym_offset += SymbolContract.SIZE

    relocs: List[RelocEntry] = []
    reloc_section_size = 0
    if header.hole_table_offset < len(data):
        relocs = parse_reloc_section(data, header.hole_table_offset)
        reloc_section_size = RELOC_HEADER_SIZE + len(relocs) * RelocEntry.SIZE

    code_start = header.hole_table_offset + reloc_section_size
    code_bytes = data[code_start:]

    is_verified = verify_contract_root(header, symbols)

    return {
        "header": header,
        "symbol_contracts": symbols,
        "reloc_entries": relocs,
        "code_bytes": code_bytes,
        "is_verified": is_verified,
    }
