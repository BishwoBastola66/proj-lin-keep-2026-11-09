"""
Universal Polyglot Binary Packaging (UPBP) per docs/main.md:131-137.

Generates a single polyglot binary executable across:
- Windows (MZ / PE)
- POSIX shell (/bin/sh)
- Linux (ELF64)
- macOS Darwin (Mach-O 64)
- EIA runtime payload (Universal Hologram + native machine code)

Layout (exact offsets):
  0x000 (0):    MZ DOS stub header + PE pointer     → 64 bytes
  0x040 (64):   #!/bin/sh shell script              → 64 bytes
  0x080 (128):  ELF64 header + program headers      → 256 bytes (up to 0x180, padded to 0x1FF)
  0x200 (512):  Mach-O 64 header + load commands    → 512 bytes (up to 0x3FF)
  0x400 (1024): EIA payload (hologram + code)       → starts here
"""

import struct
from typing import Optional

# Offset and size constants
OFFSET_MZ: int = 0x000
OFFSET_SHELL: int = 0x040
OFFSET_ELF: int = 0x080
OFFSET_MACHO: int = 0x200
OFFSET_PAYLOAD: int = 0x400

ENTRY_POINT: int = 0x400

MZ_SIZE: int = 64
SHELL_SIZE: int = 64
ELF_SIZE: int = 256
MACHO_SIZE: int = 512

# ELF Constants
ELF_MAGIC: bytes = b"\x7fELF"
ELFCLASS64: int = 2
ELFDATA2LSB: int = 1
EV_CURRENT: int = 1
ELFOSABI_SYSV: int = 0
ET_EXEC: int = 2
EM_X86_64: int = 62
EM_AARCH64: int = 183
EM_RISCV: int = 243
PT_LOAD: int = 1
PF_X: int = 1
PF_W: int = 2
PF_R: int = 4

# Mach-O Constants
MH_MAGIC_64: int = 0xFEEDFACF
CPU_TYPE_X86_64: int = 0x01000007
CPU_TYPE_ARM64: int = 0x0100000C
CPU_SUBTYPE_ALL: int = 0x00000003
MH_EXECUTE: int = 2
LC_SEGMENT_64: int = 0x19
LC_MAIN: int = 0x80000028
VM_PROT_READ: int = 1
VM_PROT_WRITE: int = 2
VM_PROT_EXECUTE: int = 4


def build_mz_stub(e_lfanew: int = OFFSET_ELF) -> bytes:
    """
    Build 64-byte DOS MZ stub header.
    Offset 0x3C contains e_lfanew pointing to the PE/ELF header (default 0x080).
    """
    dos_header = struct.pack(
        "<2s13H8s2H20sI",
        b"MZ",                     # e_magic
        0x0090,                    # e_cblp (bytes on last page)
        0x0003,                    # e_cp (pages in file)
        0x0000,                    # e_crlc (relocations)
        0x0004,                    # e_cparhdr (size of header in paragraphs = 64 bytes)
        0x0000,                    # e_minalloc
        0xFFFF,                    # e_maxalloc
        0x0000,                    # e_ss
        0x00B8,                    # e_sp
        0x0000,                    # e_csum
        0x0000,                    # e_ip
        0x0000,                    # e_cs
        0x0040,                    # e_lfarlc (offset to relocation table)
        0x0000,                    # e_ovno
        b"\x00" * 8,               # e_res[4]
        0x0000,                    # e_oemid
        0x0000,                    # e_oeminfo
        b"\x00" * 20,              # e_res2[10]
        e_lfanew,                  # e_lfanew (offset to next executable header)
    )
    if len(dos_header) != MZ_SIZE:
        raise ValueError(f"MZ header must be {MZ_SIZE} bytes, got {len(dos_header)}")
    return dos_header


def build_shell_script(script_text: Optional[str] = None) -> bytes:
    """
    Build 64-byte POSIX shell script preamble starting at offset 0x040.
    Executed if invoked via /bin/sh.
    """
    if script_text is None:
        script = b'#!/bin/sh\nexec "$0" "$@"\nexit 1\n'
    else:
        script = script_text.encode("utf-8")

    if len(script) > SHELL_SIZE:
        raise ValueError(f"Shell script exceeds {SHELL_SIZE} bytes ({len(script)} bytes)")

    # Pad to exactly 64 bytes with newlines (treated as no-ops by POSIX shell)
    return script.ljust(SHELL_SIZE, b"\n")


def build_elf64_headers(
    payload_size: int = 0,
    entry_point: int = ENTRY_POINT,
    target_isa: int = 1,
) -> bytes:
    """
    Build 256-byte ELF64 header block starting at offset 0x080.
    Contains Elf64_Ehdr (64B) and Elf64_Phdr (56B) with PT_LOAD for payload at 0x400.
    """
    # Map ISA bitmask to ELF e_machine
    if target_isa == 2:
        e_machine = EM_AARCH64
    elif target_isa == 4:
        e_machine = EM_RISCV
    else:
        e_machine = EM_X86_64

    # 1. Elf64_Ehdr (64 bytes)
    # Ident: 16 bytes
    e_ident = struct.pack(
        "<4s5B7s",
        ELF_MAGIC,
        ELFCLASS64,
        ELFDATA2LSB,
        EV_CURRENT,
        ELFOSABI_SYSV,
        0,                         # EI_ABIVERSION
        b"\x00" * 7,               # EI_PAD
    )

    ehdr_size = 64
    phdr_size = 56
    phdr_offset = OFFSET_ELF + ehdr_size  # 0x080 + 64 = 0x0C0 in file

    ehdr = struct.pack(
        "<16sHHIQQQIHHHHHH",
        e_ident,
        ET_EXEC,                   # e_type
        e_machine,                 # e_machine
        EV_CURRENT,                # e_version
        entry_point,               # e_entry (0x400)
        phdr_offset,               # e_phoff (file offset to program header)
        0,                         # e_shoff (no section headers)
        0,                         # e_flags
        ehdr_size,                 # e_ehsize (64)
        phdr_size,                 # e_phentsize (56)
        1,                         # e_phnum (1 PT_LOAD header)
        64,                        # e_shentsize
        0,                         # e_shnum
        0,                         # e_shstrndx
    )
    assert len(ehdr) == 64

    # 2. Elf64_Phdr (56 bytes) - PT_LOAD for payload at 0x400
    p_flags = PF_R | PF_W | PF_X  # RWX payload permissions
    phdr = struct.pack(
        "<IIQQQQQQ",
        PT_LOAD,                   # p_type
        p_flags,                   # p_flags
        OFFSET_PAYLOAD,            # p_offset (0x400)
        entry_point,               # p_vaddr
        entry_point,               # p_paddr
        payload_size,              # p_filesz
        payload_size,              # p_memsz
        0x1000,                    # p_align (4096)
    )
    assert len(phdr) == 56

    combined = ehdr + phdr
    if len(combined) > ELF_SIZE:
        raise ValueError(f"ELF headers exceed {ELF_SIZE} bytes ({len(combined)} bytes)")

    # Pad to exactly 256 bytes
    return combined.ljust(ELF_SIZE, b"\x00")


def build_macho64_headers(
    payload_size: int = 0,
    entry_point: int = ENTRY_POINT,
    target_isa: int = 1,
) -> bytes:
    """
    Build 512-byte Mach-O 64-bit header block starting at offset 0x200.
    Contains mach_header_64 (32B), LC_SEGMENT_64 (72B), and LC_MAIN (24B).
    """
    # Map ISA bitmask to Mach-O cputype
    if target_isa == 2:
        cputype = CPU_TYPE_ARM64
        cpusubtype = 0
    else:
        cputype = CPU_TYPE_X86_64
        cpusubtype = CPU_SUBTYPE_ALL

    # Load commands:
    # 1. LC_SEGMENT_64 (72 bytes)
    seg_cmd = struct.pack(
        "<II16sQQQQIIII",
        LC_SEGMENT_64,             # cmd
        72,                        # cmdsize
        b"__TEXT\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00",  # segname
        entry_point,               # vmaddr
        payload_size,              # vmsize
        OFFSET_PAYLOAD,            # fileoff (0x400)
        payload_size,              # filesize
        VM_PROT_READ | VM_PROT_WRITE | VM_PROT_EXECUTE,  # maxprot
        VM_PROT_READ | VM_PROT_WRITE | VM_PROT_EXECUTE,  # initprot
        0,                         # nsects
        0,                         # flags
    )
    assert len(seg_cmd) == 72

    # 2. LC_MAIN (24 bytes)
    main_cmd = struct.pack(
        "<IIQQ",
        LC_MAIN,                   # cmd
        24,                        # cmdsize
        entry_point,               # entryoff (0x400)
        0,                         # stacksize
    )
    assert len(main_cmd) == 24

    ncmds = 2
    sizeofcmds = len(seg_cmd) + len(main_cmd)  # 96 bytes

    # mach_header_64 (32 bytes)
    mhdr = struct.pack(
        "<7II",
        MH_MAGIC_64,               # magic (0xFEEDFACF)
        cputype,                   # cputype
        cpusubtype,                # cpusubtype
        MH_EXECUTE,                # filetype
        ncmds,                     # ncmds
        sizeofcmds,                # sizeofcmds
        0,                         # flags
        0,                         # reserved
    )
    assert len(mhdr) == 32

    combined = mhdr + seg_cmd + main_cmd
    if len(combined) > MACHO_SIZE:
        raise ValueError(f"Mach-O headers exceed {MACHO_SIZE} bytes ({len(combined)} bytes)")

    # Pad to exactly 512 bytes
    return combined.ljust(MACHO_SIZE, b"\x00")


def assemble_upbp(
    hologram_bytes: bytes = b"",
    code_bytes: bytes = b"",
    target_isa: int = 1,
) -> bytes:
    """
    Assemble Universal Polyglot Binary Package (UPBP).
    Combines:
      - MZ stub at 0x000 (64B)
      - POSIX shell script at 0x040 (64B)
      - ELF64 headers at 0x080 (256B, padded to 0x1FF)
      - Mach-O 64 headers at 0x200 (512B)
      - EIA payload (hologram + code) at 0x400
    """
    payload = hologram_bytes + code_bytes
    payload_size = len(payload)

    mz_stub = build_mz_stub(e_lfanew=OFFSET_ELF)
    assert len(mz_stub) == MZ_SIZE

    shell_script = build_shell_script()
    assert len(shell_script) == SHELL_SIZE

    elf_headers = build_elf64_headers(
        payload_size=payload_size,
        entry_point=ENTRY_POINT,
        target_isa=target_isa,
    )
    assert len(elf_headers) == ELF_SIZE

    # Pad between end of ELF (0x180) and start of Mach-O (0x200)
    elf_to_macho_pad = b"\x00" * (OFFSET_MACHO - (OFFSET_ELF + ELF_SIZE))
    assert len(elf_to_macho_pad) == 128

    macho_headers = build_macho64_headers(
        payload_size=payload_size,
        entry_point=ENTRY_POINT,
        target_isa=target_isa,
    )
    assert len(macho_headers) == MACHO_SIZE

    header_block = mz_stub + shell_script + elf_headers + elf_to_macho_pad + macho_headers
    assert len(header_block) == OFFSET_PAYLOAD

    return header_block + payload
