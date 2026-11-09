"""
Unit and Integration Test Suite for Rubix Bootstrap and EIA Binary Emission.
"""

import os
from hologram import UniversalHologramHeader, SymbolContract, MAGIC_EIAH, CC_SYSV, ISA_X86_64
from blake3_64 import blake3_64, compute_contract_root, verify_contract_root
from reloc import RelocEntry, build_reloc_section, parse_reloc_section, patch_hole
from upbp import assemble_upbp, OFFSET_PAYLOAD
from emitter import emit_binary, parse_eia_binary
from bootstrap import compile_rubix_source, run_hardcoded_example


def test_hologram_roundtrip():
    header = UniversalHologramHeader(
        magic=MAGIC_EIAH,
        version_major=2,
        version_minor=0,
        target_isa=ISA_X86_64,
        symbol_count=1,
        hole_count=1,
        is_valid=1,
        capability_req_mask=0,
        symbol_table_offset=0x460,
        hole_table_offset=0x490,
        blake3_contract_root=0x1234567890ABCDEF,
        reserved_zero=0,
    )
    b = header.to_bytes()
    assert len(b) == 96
    unpacked = UniversalHologramHeader.from_bytes(b)
    assert unpacked == header

    sym = SymbolContract(
        symbol_id=42,
        type_sig_hash=100,
        flags=1,
        calling_convention=CC_SYSV,
        physical_offset=0x4A0,
        hole_list_offset=4,
    )
    sb = sym.to_bytes()
    assert len(sb) == 48
    unpacked_sym = SymbolContract.from_bytes(sb)
    assert unpacked_sym == sym


def test_blake3_tamper_detection():
    syms = [
        SymbolContract(symbol_id=1, type_sig_hash=10, flags=1, calling_convention=1, physical_offset=0x100, hole_list_offset=0),
        SymbolContract(symbol_id=2, type_sig_hash=20, flags=3, calling_convention=1, physical_offset=0x200, hole_list_offset=0),
    ]
    root = compute_contract_root(syms)
    header = UniversalHologramHeader(
        symbol_count=2,
        blake3_contract_root=root,
    )
    assert verify_contract_root(header, syms) is True

    # Tamper with contract
    syms[0].physical_offset = 0x999
    assert verify_contract_root(header, syms) is False


def test_reloc_and_patching():
    entries = [
        RelocEntry(instruction_offset=3, field_hash=0x12345678, symbol_id=1),
    ]
    sec = build_reloc_section(entries)
    parsed = parse_reloc_section(sec)
    assert parsed == entries

    code = bytearray(b"\x48\x01\xb7\x00\x00\x00\x00\xc3")
    patch_hole(code, entries[0], 0x18)
    assert code == bytearray(b"\x48\x01\xb7\x18\x00\x00\x00\xc3")


def test_emitter_and_bootstrap():
    binary = run_hardcoded_example()
    assert len(binary) > OFFSET_PAYLOAD
    parsed = parse_eia_binary(binary)
    assert parsed["is_verified"] is True
    assert parsed["header"].symbol_count == 1
    assert parsed["header"].hole_count == 1
    assert parsed["symbol_contracts"][0].hole_list_offset == 4
    assert len(parsed["code_bytes"]) == 8


if __name__ == "__main__":
    test_hologram_roundtrip()
    print("test_hologram_roundtrip: OK")
    test_blake3_tamper_detection()
    print("test_blake3_tamper_detection: OK")
    test_reloc_and_patching()
    print("test_reloc_and_patching: OK")
    test_emitter_and_bootstrap()
    print("test_emitter_and_bootstrap: OK")
    print("\n[+] All EIA bootstrap tests passed successfully!")
