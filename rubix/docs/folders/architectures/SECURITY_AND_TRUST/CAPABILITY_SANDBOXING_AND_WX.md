# Capability Sandboxing & Zero-Syscall W^X Architecture

> **Status**: Canonical Accepted  
> **Classification**: Security Engineering & Memory Protection  
> **Subsystem**: Rubix Security & Trust Substrate  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification establishes the concrete OS-level implementation of **Dual Virtual Alias Mapping (DVAM)** and **Capability Sandboxing**.

It demonstrates how Rubix achieves strict compliance with operating system Write XOR Execute ($W \oplus X$) memory protection while eliminating runtime `mprotect()` system call overhead, and details how untrusted modules are isolated in zero-cost user-space capability sandboxes.

---

## 2. Multi-OS DVAM Implementation Deep-Dive

To achieve zero-syscall $W \oplus X$ execution, the runtime initializes two separate virtual memory mappings backed by identical physical pages:

### 2.1 Linux Kernel Implementation (`memfd_create`)
```c
int init_linux_dvam(size_t size, void **out_write, void **out_exec) {
    // 1. Create anonymous anonymous in-memory file descriptor
    int fd = memfd_create("rubix_code_arena", MFD_CLOEXEC);
    if (fd < 0) return -1;
    
    // 2. Set memory backing size
    if (ftruncate(fd, size) < 0) { close(fd); return -1; }
    
    // 3. Create Writable Alias (PROT_READ | PROT_WRITE)
    *out_write = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    
    // 4. Create Executable Alias (PROT_READ | PROT_EXEC)
    *out_exec = mmap(NULL, size, PROT_READ | PROT_EXEC, MAP_SHARED, fd, 0);
    
    // 5. Close fd handle (mappings remain active)
    close(fd);
    return 0;
}
```

### 2.2 macOS / Darwin Implementation (`mach_vm_remap`)
Under Darwin, anonymous shared memory is created via `mach_vm_allocate()`, followed by `mach_vm_remap()` with `VM_PROT_READ | VM_PROT_EXECUTE` to instantiate the execution alias.

### 2.3 Windows Implementation (`CreateFileMappingW`)
On Windows NT, memory is created using `CreateFileMappingW(INVALID_HANDLE_VALUE, ...)` with `PAGE_EXECUTE_READWRITE`, mapped once via `MapViewOfFile(..., FILE_MAP_WRITE, ...)` and once via `MapViewOfFile(..., FILE_MAP_EXECUTE, ...)`.

---

## 3. Capability Sandboxing via Seccomp-BPF

When executing third-party plugins or untrusted foreign code, Rubix confines the process using a strict Berkeley Packet Filter (BPF) seccomp jail:

1. **Ambient Syscalls Banned**: All ambient system calls (`socket`, `connect`, `openat`, `unlink`, `execve`) return `SECCOMP_RET_ERRNO` with `EPERM`.
2. **Channel-Mediated I/O**: The sandboxed code can only communicate with the host via pre-allocated shared memory ring buffers passed as explicit capability arguments.
3. **No Hypervisor Overhead**: Sandboxing operates at pure native CPU instruction speed with **0% virtualization overhead**, guaranteeing absolute hardware isolation.
