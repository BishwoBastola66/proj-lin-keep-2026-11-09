# The ELF64 ABI Specification and Container Architecture

## 1. The Executable and Linkable Format (ELF)

The **ELF (Executable and Linkable Format)** is the standard binary object format across Linux, FreeBSD, OpenBSD, Solaris, and Android.
It serves a dual purpose:
1. **Link-Time View**: Composed of typed **Sections** (`.text`, `.data`, `.rodata`, `.symtab`, `.rela.text`) inspected by compilers, assemblers, and static linkers.
2. **Execution-Time View**: Composed of **Segments** (`PT_LOAD`, `PT_DYNAMIC`, `PT_INTERP`, `PT_GNU_STACK`) mapped directly into virtual memory pages by the OS kernel `execve` loader.

```
+-------------------------------------------------------------------------------+
|                             ELF64 File Structure                              |
+-------------------------------------------------------------------------------+
|  ELF64 Header (64 bytes): Magic, Machine Architecture, Entry Point Address    |
+-------------------------------------------------------------------------------+
|  Program Header Table (Segments for kernel memory mapping):                   |
|    - PT_LOAD: Executable Code (.text) [Read + Execute]                        |
|    - PT_LOAD: Read-Only Data (.rodata) [Read-Only]                            |
|    - PT_LOAD: Mutable Data (.data, .bss) [Read + Write]                       |
|    - PT_DYNAMIC: Dynamic Linking Tags (for shared libraries)                 |
|    - PT_GNU_STACK: Non-Executable Stack Flag (NX / DEP security)              |
+-------------------------------------------------------------------------------+
|  Sections (.text, .rodata, .data, .dynsym, .dynstr, .hash, etc.)              |
+-------------------------------------------------------------------------------+
|  Section Header Table (Used by linkers and debuggers)                         |
+-------------------------------------------------------------------------------+
```

---

## 2. The ELF64 Header (`Elf64_Ehdr`)

Every 64-bit ELF binary begins with an exact 64-byte header:

```c
typedef struct {
    unsigned char e_ident[16]; // 0x7F 'E' 'L' 'F', Class (2=64-bit), Data (1=LE), Version
    uint16_t      e_type;      // 1=ET_REL (object), 2=ET_EXEC (executable), 3=ET_DYN (PIE/DSO)
    uint16_t      e_machine;   // 0x3E=x86-64, 0xB7=AArch64, 0xF3=RISC-V
    uint32_t      e_version;   // 1 (current)
    uint64_t      e_entry;     // Virtual memory entry point address (_start)
    uint64_t      e_phoff;     // File offset of Program Header table
    uint64_t      e_shoff;     // File offset of Section Header table
    uint32_t      e_flags;     // Processor-specific flags
    uint16_t      e_ehsize;    // Size of this ELF header (64 bytes)
    uint16_t      e_phentsize; // Size of each program header entry (56 bytes)
    uint16_t      e_phnum;     // Number of program header entries
    uint16_t      e_shentsize; // Size of each section header entry (64 bytes)
    uint16_t      e_shnum;     // Number of section header entries
    uint16_t      e_shstrndx;  // Section header index of the section name string table
} Elf64_Ehdr;
```

---

## 3. Dynamic Linking Sections and Symbol Versioning

When ELF binaries use shared libraries:
- **`.dynsym`**: Dynamic symbol table. Contains `Elf64_Sym` structures for exported and imported symbols.
- **`.dynstr`**: Null-terminated ASCII string table containing symbol names and library paths.
- **`.gnu.hash`**: Bloom filter and hash bucket table for accelerating symbol lookups.
- **`.gnu.version` / `.gnu.version_r`**: Symbol versioning tables recording the required version string (e.g. `GLIBC_2.17`) for each external symbol.

---

## 4. The Sovereign Rubix ELF Implementation

In Rubix, ELF generation is implemented in sovereign code in [compiler/packaging/elf.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/elf.bix):
1. **Zero External Assembler or Linker**: Rubix does not invoke `as`, `ld`, or `gcc`.
2. **Direct Byte Serialization**: Emits the exact 64-byte `Elf64_Ehdr`, calculates virtual memory page alignments (4096-byte boundaries), and constructs `PT_LOAD` segments for `.text` and `.data`.
3. **Hardened Security Flags**: Emits `PT_GNU_STACK` with permissions set to `PF_R | PF_W` (non-executable stack), guaranteeing hardware DEP/NX protection against stack buffer overflows.
