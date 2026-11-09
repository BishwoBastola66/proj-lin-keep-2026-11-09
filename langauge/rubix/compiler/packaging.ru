/// Universal Polyglot Binary Packaging (UPBP)
/// Per docs/main.md:131-137, 187-189
///
/// Encodes multi-OS container preamble executable across:
///   - Windows (MZ / PE)
///   - POSIX Shell (/bin/sh)
///   - Linux (ELF64)
///   - macOS Darwin (Mach-O 64)
///   - EIA Runtime Payload (Universal Hologram + native machine code)

use std::eia::runtime::{dvam_create, DvamMapping};

/// Header layout offset constants
const OFFSET_MZ: u64 = 0x000;
const OFFSET_SHELL: u64 = 0x040;
const OFFSET_ELF: u64 = 0x080;
const OFFSET_MACHO: u64 = 0x200;
const OFFSET_PAYLOAD: u64 = 0x400;

const ENTRY_POINT: u64 = 0x400;

const MZ_SIZE: u64 = 64;
const SHELL_SIZE: u64 = 64;
const ELF_SIZE: u64 = 256;
const MACHO_SIZE: u64 = 512;

/// ELF64 Header Constants
const ELF_MAGIC_0: u8 = 0x7F;
const ELF_MAGIC_1: u8 = 0x45; // 'E'
const ELF_MAGIC_2: u8 = 0x4C; // 'L'
const ELF_MAGIC_3: u8 = 0x46; // 'F'
const ELFCLASS64: u8 = 2;
const ELFDATA2LSB: u8 = 1;
const EV_CURRENT: u32 = 1;
const ELFOSABI_SYSV: u8 = 0;
const ET_EXEC: u16 = 2;
const EM_X86_64: u16 = 62;
const EM_AARCH64: u16 = 183;
const EM_RISCV: u16 = 243;
const PT_LOAD: u32 = 1;
const PF_X: u32 = 1;
const PF_W: u32 = 2;
const PF_R: u32 = 4;

/// Mach-O Constants
const MH_MAGIC_64: u32 = 0xFEEDFACF;
const CPU_TYPE_X86_64: u32 = 0x01000007;
const CPU_TYPE_ARM64: u32 = 0x0100000C;
const CPU_SUBTYPE_ALL: u32 = 0x00000003;
const MH_EXECUTE: u32 = 2;
const LC_SEGMENT_64: u32 = 0x19;
const LC_MAIN: u32 = 0x80000028;
const VM_PROT_READ: u32 = 1;
const VM_PROT_WRITE: u32 = 2;
const VM_PROT_EXECUTE: u32 = 4;

/// Low-level memory write helpers
fn write_u16_le(buf: *mut u8, offset: u64, val: u16) {
    *(buf + offset) = (val & 0xFF) as u8;
    *(buf + offset + 1) = ((val >> 8) & 0xFF) as u8;
}

fn write_u32_le(buf: *mut u8, offset: u64, val: u32) {
    *(buf + offset) = (val & 0xFF) as u8;
    *(buf + offset + 1) = ((val >> 8) & 0xFF) as u8;
    *(buf + offset + 2) = ((val >> 16) & 0xFF) as u8;
    *(buf + offset + 3) = ((val >> 24) & 0xFF) as u8;
}

fn write_u64_le(buf: *mut u8, offset: u64, val: u64) {
    write_u32_le(buf, offset, (val & 0xFFFFFFFF) as u32);
    write_u32_le(buf, offset + 4, ((val >> 32) & 0xFFFFFFFF) as u32);
}

fn copy_bytes(dst: *mut u8, dst_offset: u64, src: *const u8, count: u64) {
    for i in 0..count {
        *(dst + dst_offset + i) = *(src + i);
    }
}

/// Build 64-byte DOS MZ stub header
/// Offset 0x3C points to the next executable header (default: 0x080)
pub fn build_mz_stub(e_lfanew: u32) -> [u8; 64] {
    let mut stub: [u8; 64] = [0; 64];
    let ptr = &mut stub as *mut u8;

    // 'MZ' magic signature
    *(ptr + 0) = 0x4D; // 'M'
    *(ptr + 1) = 0x5A; // 'Z'
    write_u16_le(ptr, 2, 0x0090);  // e_cblp
    write_u16_le(ptr, 4, 0x0003);  // e_cp
    write_u16_le(ptr, 6, 0x0000);  // e_crlc
    write_u16_le(ptr, 8, 0x0004);  // e_cparhdr (64 bytes / 16)
    write_u16_le(ptr, 10, 0x0000); // e_minalloc
    write_u16_le(ptr, 12, 0xFFFF); // e_maxalloc
    write_u16_le(ptr, 14, 0x0000); // e_ss
    write_u16_le(ptr, 16, 0x00B8); // e_sp
    write_u16_le(ptr, 18, 0x0000); // e_csum
    write_u16_le(ptr, 20, 0x0000); // e_ip
    write_u16_le(ptr, 22, 0x0000); // e_cs
    write_u16_le(ptr, 24, 0x0040); // e_lfarlc
    write_u16_le(ptr, 26, 0x0000); // e_ovno

    // Offset 0x3C: e_lfanew (points to ELF header at 0x080)
    write_u32_le(ptr, 0x3C, e_lfanew);

    stub
}

/// Build 64-byte POSIX shell script preamble
/// Executed if invoked via /bin/sh
pub fn build_shell_script() -> [u8; 64] {
    let mut script: [u8; 64] = [0x0A; 64]; // Fill with '\n' (0x0A)
    let ptr = &mut script as *mut u8;

    let text = b"#!/bin/sh\nexec \"$0\" \"$@\"\nexit 1\n";
    let len = 33;
    copy_bytes(ptr, 0, text as *const u8, len);

    script
}

/// Build 256-byte ELF64 header block starting at offset 0x080
pub fn build_elf64_headers(payload_size: u64, entry_point: u64, target_isa: u32) -> [u8; 256] {
    let mut elf: [u8; 256] = [0; 256];
    let ptr = &mut elf as *mut u8;

    let e_machine = if target_isa == 2 {
        EM_AARCH64
    } else if target_isa == 4 {
        EM_RISCV
    } else {
        EM_X86_64
    };

    // 1. Elf64_Ehdr (64 bytes)
    *(ptr + 0) = ELF_MAGIC_0;
    *(ptr + 1) = ELF_MAGIC_1;
    *(ptr + 2) = ELF_MAGIC_2;
    *(ptr + 3) = ELF_MAGIC_3;
    *(ptr + 4) = ELFCLASS64;
    *(ptr + 5) = ELFDATA2LSB;
    *(ptr + 6) = 1; // EV_CURRENT
    *(ptr + 7) = ELFOSABI_SYSV;

    write_u16_le(ptr, 16, ET_EXEC);                 // e_type
    write_u16_le(ptr, 18, e_machine);               // e_machine
    write_u32_le(ptr, 20, EV_CURRENT);              // e_version
    write_u64_le(ptr, 24, entry_point);             // e_entry (0x400)
    write_u64_le(ptr, 32, OFFSET_ELF + 64);         // e_phoff (0x0C0 in file)
    write_u64_le(ptr, 40, 0);                       // e_shoff
    write_u32_le(ptr, 48, 0);                       // e_flags
    write_u16_le(ptr, 52, 64);                      // e_ehsize
    write_u16_le(ptr, 54, 56);                      // e_phentsize
    write_u16_le(ptr, 56, 1);                       // e_phnum (1 PT_LOAD)
    write_u16_le(ptr, 58, 64);                      // e_shentsize
    write_u16_le(ptr, 60, 0);                       // e_shnum
    write_u16_le(ptr, 62, 0);                       // e_shstrndx

    // 2. Elf64_Phdr (56 bytes at offset 64)
    let phdr_ptr = ptr + 64;
    write_u32_le(phdr_ptr, 0, PT_LOAD);             // p_type
    write_u32_le(phdr_ptr, 4, PF_R | PF_W | PF_X);  // p_flags
    write_u64_le(phdr_ptr, 8, OFFSET_PAYLOAD);      // p_offset (0x400)
    write_u64_le(phdr_ptr, 16, entry_point);        // p_vaddr
    write_u64_le(phdr_ptr, 24, entry_point);        // p_paddr
    write_u64_le(phdr_ptr, 32, payload_size);       // p_filesz
    write_u64_le(phdr_ptr, 40, payload_size);       // p_memsz
    write_u64_le(phdr_ptr, 48, 0x1000);             // p_align (4096)

    elf
}

/// Build 512-byte Mach-O 64-bit header block starting at offset 0x200
pub fn build_macho64_headers(payload_size: u64, entry_point: u64, target_isa: u32) -> [u8; 512] {
    let mut macho: [u8; 512] = [0; 512];
    let ptr = &mut macho as *mut u8;

    let cputype = if target_isa == 2 {
        CPU_TYPE_ARM64
    } else {
        CPU_TYPE_X86_64
    };
    let cpusubtype = if target_isa == 2 {
        0
    } else {
        CPU_SUBTYPE_ALL
    };

    let ncmds = 2;
    let sizeofcmds = 72 + 24; // 96 bytes

    // 1. mach_header_64 (32 bytes)
    write_u32_le(ptr, 0, MH_MAGIC_64);     // magic
    write_u32_le(ptr, 4, cputype);         // cputype
    write_u32_le(ptr, 8, cpusubtype);      // cpusubtype
    write_u32_le(ptr, 12, MH_EXECUTE);     // filetype
    write_u32_le(ptr, 16, ncmds);          // ncmds
    write_u32_le(ptr, 20, sizeofcmds);     // sizeofcmds
    write_u32_le(ptr, 24, 0);              // flags
    write_u32_le(ptr, 28, 0);              // reserved

    // 2. LC_SEGMENT_64 (72 bytes at offset 32)
    let seg_ptr = ptr + 32;
    write_u32_le(seg_ptr, 0, LC_SEGMENT_64); // cmd
    write_u32_le(seg_ptr, 4, 72);           // cmdsize
    let segname = b"__TEXT\0\0\0\0\0\0\0\0\0\0";
    copy_bytes(seg_ptr, 8, segname as *const u8, 16);
    write_u64_le(seg_ptr, 24, entry_point);     // vmaddr
    write_u64_le(seg_ptr, 32, payload_size);    // vmsize
    write_u64_le(seg_ptr, 40, OFFSET_PAYLOAD);  // fileoff (0x400)
    write_u64_le(seg_ptr, 48, payload_size);    // filesize
    write_u32_le(seg_ptr, 56, VM_PROT_READ | VM_PROT_WRITE | VM_PROT_EXECUTE); // maxprot
    write_u32_le(seg_ptr, 60, VM_PROT_READ | VM_PROT_WRITE | VM_PROT_EXECUTE); // initprot
    write_u32_le(seg_ptr, 64, 0);               // nsects
    write_u32_le(seg_ptr, 68, 0);               // flags

    // 3. LC_MAIN (24 bytes at offset 32 + 72 = 104)
    let main_ptr = seg_ptr + 72;
    write_u32_le(main_ptr, 0, LC_MAIN);     // cmd
    write_u32_le(main_ptr, 4, 24);          // cmdsize
    write_u64_le(main_ptr, 8, entry_point); // entryoff (0x400)
    write_u64_le(main_ptr, 16, 0);          // stacksize

    macho
}

/// Assemble Universal Polyglot Binary Package (UPBP)
/// Allocates contiguous pages via DVAM (W^X safe) and returns v_write address
pub fn assemble_upbp(
    hologram: *const u8,
    hologram_len: u64,
    code: *const u8,
    code_len: u64,
    target_isa: u32,
) -> *mut u8 {
    let payload_size = hologram_len + code_len;
    let total_size = OFFSET_PAYLOAD + payload_size;

    // Allocate frame via DVAM (W^X dual alias)
    let mut mapping = dvam_create(total_size);
    let v_write = mapping.v_write;

    // 1. MZ stub at 0x000 (64B)
    let mz = build_mz_stub(OFFSET_ELF as u32);
    copy_bytes(v_write, OFFSET_MZ, &mz as *const u8, MZ_SIZE);

    // 2. Shell script at 0x040 (64B)
    let shell = build_shell_script();
    copy_bytes(v_write, OFFSET_SHELL, &shell as *const u8, SHELL_SIZE);

    // 3. ELF64 headers at 0x080 (256B)
    let elf = build_elf64_headers(payload_size, ENTRY_POINT, target_isa);
    copy_bytes(v_write, OFFSET_ELF, &elf as *const u8, ELF_SIZE);

    // 4. Pad 0x180 .. 0x200 with zeroes
    for i in (OFFSET_ELF + ELF_SIZE)..OFFSET_MACHO {
        *(v_write + i) = 0;
    }

    // 5. Mach-O 64 headers at 0x200 (512B)
    let macho = build_macho64_headers(payload_size, ENTRY_POINT, target_isa);
    copy_bytes(v_write, OFFSET_MACHO, &macho as *const u8, MACHO_SIZE);

    // 6. Copy Universal Hologram payload at 0x400
    if hologram_len > 0 {
        copy_bytes(v_write, OFFSET_PAYLOAD, hologram, hologram_len);
    }

    // 7. Copy executable machine code
    if code_len > 0 {
        copy_bytes(v_write, OFFSET_PAYLOAD + hologram_len, code, code_len);
    }

    v_write
}
