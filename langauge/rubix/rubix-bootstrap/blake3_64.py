"""
Truncated BLAKE3-64 (8 bytes) hashing for EIA Symbol Contracts
and Universal Hologram verification per docs/main.md:106, 211.
"""

from typing import Sequence, Union
import blake3

from hologram import SymbolContract, UniversalHologramHeader


def blake3_64(data: bytes) -> int:
    """
    Compute truncated 8-byte BLAKE3 hash of raw bytes.
    Returns an unsigned 64-bit integer (little-endian representation).
    """
    digest_8b = blake3.blake3(data).digest(length=8)
    return int.from_bytes(digest_8b, byteorder="little")


def compute_contract_root(contracts: Union[Sequence[SymbolContract], bytes, bytearray, memoryview]) -> int:
    """
    Compute the BLAKE3-64 contract root over the serialized SymbolContract array
    or raw symbol table bytes.
    """
    if isinstance(contracts, (bytes, bytearray, memoryview)):
        return blake3_64(bytes(contracts))
    table_bytes = b"".join(c.to_bytes() for c in contracts)
    return blake3_64(table_bytes)


def verify_contract_root(
    header: UniversalHologramHeader,
    contracts: Union[Sequence[SymbolContract], bytes, bytearray, memoryview],
) -> bool:
    """
    Verify that the header's blake3_contract_root matches the computed hash
    of the symbol table, and that symbol_count matches.
    """
    if isinstance(contracts, (bytes, bytearray, memoryview)):
        if len(contracts) % SymbolContract.SIZE != 0:
            return False
        if header.symbol_count != len(contracts) // SymbolContract.SIZE:
            return False
        return header.blake3_contract_root == blake3_64(bytes(contracts))

    if header.symbol_count != len(contracts):
        return False
    return header.blake3_contract_root == compute_contract_root(contracts)