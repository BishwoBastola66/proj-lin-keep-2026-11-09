# The Portable Executable (PE/COFF) Windows ABI

## 1. The Structure of Windows Executables and DLLs

The **Portable Executable (PE)** format, derived from the Common Object File Format (COFF), is the native binary container for Microsoft Windows executables (`.exe`), dynamic link libraries (`.dll`), and kernel drivers (`.sys`).

```
+-------------------------------------------------------------------------------+
|                             PE/COFF File Layout                               |
+-------------------------------------------------------------------------------+
|  MS-DOS 2.0 MZ Header (64 bytes) + DOS Stub Program ("This program cannot...")|
+-------------------------------------------------------------------------------+
|  PE Signature: 'P', 'E', 0x00, 0x00 (4 bytes)                                 |
+-------------------------------------------------------------------------------+
|  COFF File Header (20 bytes): Machine (x86-64: 0x8664), NumberOfSections     |
+-------------------------------------------------------------------------------+
|  PE Optional Header (240 bytes for PE32+):                                    |
|    - ImageBase (Preferred virtual load address, e.g. 0x140000000)             |
|    - SectionAlignment (Memory page size: 4096)                                |
|    - FileAlignment (Disk sector size: 512)                                    |
|    - AddressOfEntryPoint (RVA to entry code)                                  |
|    - DataDirectory[16]: Array of RVAs to Import Table, Export Table, IAT...   |
+-------------------------------------------------------------------------------+
|  Section Headers Table: .text, .rdata, .data, .pdata, .reloc                  |
+-------------------------------------------------------------------------------+
|  Section Raw Data: Machine instructions, string literals, import thunks       |
+-------------------------------------------------------------------------------+
```

---

## 2. Dynamic Linking Mechanics: Import Directory and IAT

Unlike ELF which uses GOT and PLT stubs, Windows uses the **Import Address Table (IAT)**:
1. **Import Directory Table**: An array of `IMAGE_IMPORT_DESCRIPTOR` structures, one for each required DLL (e.g. `KERNEL32.DLL`).
2. **OriginalFirstThunk (Import Lookup Table)**: Points to an array of RVAs pointing to `IMAGE_IMPORT_BY_NAME` records (the names or ordinals of functions to import, e.g., `ExitProcess`).
3. **FirstThunk (Import Address Table - IAT)**: Before execution, points to identical lookup structures. When the Windows loader (`ntdll.dll`) loads the PE:
   - It iterates through the IAT.
   - It queries `GetProcAddress` internally for each symbol.
   - It overwrites the IAT entry directly with the 64-bit absolute memory address of the target function.
4. **Call Site**: Code calls imported functions via an indirect call through the IAT:
   ```text
   call qword ptr [rip + __imp_ExitProcess]  ; Direct indirect call through IAT
   ```

---

## 3. The Base Relocation Table (`.reloc`)

Because Windows utilizes **Address Space Layout Randomization (ASLR)**, executables are rarely loaded at their preferred `ImageBase`:
- The `.reloc` section contains a series of **Base Relocation Blocks**.
- Each block covers a 4KB virtual memory page and lists 16-bit offsets of pointers that must be adjusted by the loader:
  $$\text{AdjustedPointer} = \text{OriginalPointer} + (\text{ActualLoadBase} - \text{PreferredImageBase})$$
- If an executable is built with `/DYNAMICBASE` (mandatory on modern 64-bit Windows), the OS loader randomizes the load base and applies these relocations before jumping to `AddressOfEntryPoint`.

---

## 4. The Sovereign Rubix PE Implementation

In Rubix, PE/COFF packaging is implemented in [compiler/packaging/pe_coff.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/pe_coff.bix):
- Emits the classic DOS MZ header with 64-byte `e_lfanew` pointing to the PE signature.
- Configures PE32+ (64-bit) headers with machine architecture `0x8664`.
- Establishes the Import Directory and IAT entries for `KERNEL32.DLL` (`ExitProcess`, `WriteFile`, `GetStdHandle`), allowing standalone Rubix executables to run natively on Windows without MSVC CRT dependencies.
