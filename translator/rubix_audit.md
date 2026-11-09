# Rubix Toolchain Audit — Why It Stops

> Audit of the Rubix `v1.0.0` language/runtime/compiler tree at the current working
> revision. Every finding below was reproduced from the actual binaries and source,
> not inferred from the documentation.

---

## 1. Executive Summary

**Rubix cannot run a single one of its own shipped examples.** The toolchain halts in
the semantic-validation phase with `error[-49] [SEMANTIC]: invalid main function
signature` before any machine code is generated.

There are **four independent stops**, ordered by how early a user hits them:

| # | Stop | Symptom | Severity |
|---|------|---------|----------|
| 1 | `bin/rubix` is not executable | `./bin/rubix: Permission denied` (exit **126**) | Blocker |
| 2 | Runtime loads a stale compiler under a different path than the newest build | `bin/rubix` points at `bin/rubix_stage2` (Oct 4 17:21) while `bin/rubix.native`/`bin/rubix.elf` (Oct 4 23:01+) are newer | Blocker |
| 3 | Compiler has no `Integer` type keyword | `main(): Integer` → **-49** | Blocker |
| 4 | Compiler has no `mut`, no `print`, no implicit return | `mut x = 0` → **-2**; `print "x"` undefined; last-expression return rejected | Blocker |

**Meta root cause:** the *documented and exemplified language surface has drifted away
from the implemented compiler*. The repository contains exactly one commit
(`044d3d1 feat: initial release of Rubix 1.0.0`) and a large in-place reorganization
(root files moved under `rubix/`), leaving docs, examples, and `std/` describing a
richer language (`Integer`, `mut`, `print`, `Boolean`, `String`, `?`/elvis, pipelines)
than the compiler actually accepts (`i64`/`i32`/`u8`, `let`, `println`).

---

## 2. Reproduction

```bash
cd rubix

# Stop 1 — shell refuses to run the runtime
./bin/rubix examples/01_basics.bix
#   /bin/sh: ./bin/rubix: Permission denied      (exit 126)

# Bypass the exec bit to reach the compiler
python3 bin/rubix examples/01_basics.bix
#   rubix: error[-49] [SEMANTIC]: invalid main function signature
#     file: examples/01_basics.bix
#   [RUBIX ERROR] Compilation failed (code -49)   (exit 1)

# Every shipped example fails identically:
for f in examples/*.bix; do python3 bin/rubix check "$f"; done
#   examples/01_basics.bix  -> -49
#   examples/02_control_flow.bix -> -49
#   ... all 8 numbered examples -> -49
```

Minimal isolation probes:

| Probe source | Result |
|---|---|
| `fn main(): i64 { return 0; }` | `[RUBIX CHECK] OK` |
| `fn main(): Integer { 0 }` | **error[-49]** |
| `fn main(): i64 { mut counter = 0; counter = counter + 1; return counter; }` | **error[-2] undefined identifier** |
| `fn main(): i64 { print "hi"; return 0; }` | check OK, **no output at runtime** |
| `fn main(): i64 { println "hi"; return 0; }` | check OK, **no output at runtime** |

The same `-49` is produced by every compiler binary in the tree
(`rubix_stage2`, `rubix_stage3`, `rubix_det_a`, `rubix.elf`, `rubix_new_stage1`,
`rubix.native`), and by both front-ends (`bin/rubix` and `rix/bin/rix run`).
`rix check` reports a *false* PASS for `i64` programs (it does not reach codegen),
which masks the real failure until run time.

---

## 3. Root-Cause Chain for `-49`

The `Integer` failure is a straight line through five sites:

1. **Lexer** — `compiler/frontend/lexer.bix:441-443` recognizes only `i64`, `i32`,
   `f64`, `f32`, `ptr`, `str`, `bool`, `char`, `void` as type tokens. `Integer`
   therefore arrives at the parser as `TOKEN_IDENT`.

2. **Type parser** — `compiler/main.bix:4281` (`parse_type`, `TOKEN_IDENT` branch)
   accepts only struct names, `Option`, `Result`, `Tuple`, and enum names. There is
   **no `Integer` / `Int` alias**.

3. **Unknown-type bailout** — `compiler/main.bix:4369`:
   ```rubix
   set_qword(s, 7, -37); # ERR_UNKNOWN_TYPE
   return TYPE_NONE;      # TYPE_NONE == 0
   ```
   So `Integer` → return type `0`.

4. **Main validation** — `compiler/main.bix:5724` sets `fn_ret_type = TYPE_NONE`,
   then `compiler/main.bix:5755` calls
   `tir_validate_main(param_count, fn_ret_type, t0, t1)`.

5. **Validator** — `compiler/middle/tir.bix:273`:
   ```rubix
   fn tir_validate_main(param_count: i64, ret_type: i64, t0: i64, t1: i64): i64 {
       if type_is_integer(ret_type) != 1 {
           return -49; # ERR_INVALID_MAIN (must return integer type: i64, i32, u8)
       }
   ```
   and `type_is_integer` (`tir.bix:39-46`) only recognizes `I64/I32/CHAR/U8/INT_LIT`.
   `0` is not an integer type → **-49**.

6. **Diagnostic** — `compiler/middle/warnings.bix:135-136` renders the code:
   ```rubix
   if code == -49 {
       return diag_write_str(buf, pos, "invalid main function signature", 31);
   ```

The same validation logic is **duplicated** in three places, which is why the error is
so sticky:
- `compiler/frontend/parser.bix:5751-5759` and `parser.bix:6436-6444`
- `compiler/frontend/uir_frontend.bix:1010-1015`
- `compiler/main.bix:10122-10127`, `10728-10733`, `1107-1126`

`compiler/main.bix` (22,050 lines) is a concatenation of the other modules, so each
defect exists in several copies.

---

## 4. Secondary Stops (surfaced once `-49` is worked around)

### 4.1 `mut` is not a token
`grep` for `TOKEN_KW_MUT` in `compiler/frontend/lexer.bix` → **0 matches**. The lexer
knows `let` (`lexer.bix:441`) but not `mut`. Documentation in `rubix.md:136`
("mut are mutable") and every example use `mut`, so
`mut counter = 0` fails with `-2 undefined identifier or variable out of scope`.

### 4.2 `print` is not a builtin — only `println`
The builtin table registers `sys_write` (`compiler/frontend/symtab.bix:1140`) and
`println` (`symtab.bix:1212`). There is **no `print` entry anywhere in
`compiler/`**. The examples call `print`, so they would fail as undefined identifiers
(partially masked by the earlier `-49`).

### 4.3 Valid programs produce no output
A check-clean program `fn main(): i64 { println "hi"; return 0; }` compiles to a
**61-byte stub** and exits `0` while writing **nothing** to stdout or stderr. The
emitted entry stub (`_start` → `main` → `sys_exit`) never routes the `println`
argument into `sys_write(1, …)`. So even after the `-49` and naming issues are fixed,
the examples would still print nothing. The W^X in-memory executor itself is sound
(see `compiler/executor/executor.bix:15-21`), so this is a codegen/builtin-lowering
gap, not an executor fault.

### 4.4 Surface drift
`rubix.md:114-144` and the editor syntax files advertise `Integer`, `Float`,
`Boolean`, `String`, `Void`, `Any`, `mut`, `?`, pipelines and implicit returns.
The implemented lexer defines none of those spellings. 46 `.bix` files use
`: Integer` while 117 use `: i64` — the tree is internally split between two dialects.

---

## 5. Inconsistency Matrix

| Language surface | Docs / examples | Implemented compiler |
|---|---|---|
| Integer type | `Integer` | `i64`, `i32`, `u8`, `char` only |
| Mutable local | `mut x = 0` | `let` only (no `mut` token) |
| Console output | `print "x"` | `println` builtin; `print` absent |
| Function result | implicit last expression | requires explicit `return` |
| Aliases `String`/`Boolean`/`Int` | advertised | undefined |

---

## 6. Why It Is "Stopped"

"Stopped" is literal here: the compiler **bails out at semantic validation** the moment
it parses the canonical entry point `fn main(): Integer`. Because `Integer` resolves to
`TYPE_NONE` and the main-signature validator demands an integer return, the driver
returns `-49`, no bytes are emitted, and the runtime prints the diagnostic and exits
non-zero. Before that even happens, a plain `./bin/rubix` invocation dies at the shell
with exit 126 because the runtime script lacks the execute bit. The net effect is that
the headline promise of `rubix.md` ("zero-dependency native compiler… execution
platform") does not hold for any artifact shipped in the repo.

---

## 7. Recommendations (ordered by leverage)

1. **Rebuild the shipped compiler from the source that matches the documented
   surface, or point the runtime at the correct build.** The newest artifacts
   (`bin/rubix.native`, `bin/rubix.elf`, Oct 4 23:01+) post-date the file the runtime
   loads (`bin/rubix_stage2`, Oct 4 17:21). Confirm which revision is authoritative,
   then repoint `STAGE2_PATH` in `bin/rubix` and rebuild.
2. **Implement the documented surface in the compiler** (the examples are the spec):
   - alias `Integer`/`Int` → `TYPE_I64` in `lexer.bix` + `parse_type`
   - add `mut` (either a `TOKEN_KW_MUT` or treat it as a `let` synonym)
   - register `print` alongside `println`
   - lower `println`/`print` to `sys_write(1, …)`
3. **Or, if the compiler is the source of truth**, migrate docs + `std/` + all 46
   `: Integer` sources to `i64`/`let`/`println`. This is the larger blast radius and
   contradicts `rubix.md`, so option 2 is preferred.
4. **`chmod +x bin/rubix`** and make the build/packaging step preserve the mode; also
   create the missing top-level `rubix` launcher referenced by the layout.
5. **Fix the silent-output bug**: verify the `_start` stub and `println` lowering so a
   check-clean program actually writes to fd 1.
6. **Remove the false pass in `rix check`** so it exercises the same semantic path as
   `run` (it currently reports PASS for programs that fail native compilation).
7. **De-duplicate `tir_validate_main`** across `main.bix` / `parser.bix` /
   `uir_frontend.bix`, and reduce `main.bix` to generated concatenation, so the three
   validators cannot drift.
8. **Add CI** that runs every file in `examples/` end-to-end and asserts exit code and
   stdout; this would have caught all four stops.

---

## 8. Key Files & Lines

- [`rubix/bin/rubix`](rubix/bin/rubix:1) — Python runtime; loads `bin/rubix_stage2` via `mmap`+`ctypes` (`:66`, `:78-99`)
- [`rubix/bin/rubix_stage2`](rubix/bin/rubix_stage2:1) — flat code blob loaded by the runtime (not an ELF)
- [`rubix/bin/rubix.elf`](rubix/bin/rubix.elf:1) — genuine statically-linked ELF compiler build
- [`rubix/compiler/frontend/lexer.bix`](rubix/compiler/frontend/lexer.bix:441) — type-keyword table (no `Integer`, no `mut`)
- [`rubix/compiler/main.bix`](rubix/compiler/main.bix:4281) — `parse_type` identifier branch
- [`rubix/compiler/main.bix`](rubix/compiler/main.bix:4369) — `ERR_UNKNOWN_TYPE` → `TYPE_NONE` for `Integer`
- [`rubix/compiler/main.bix`](rubix/compiler/main.bix:5755) — `tir_validate_main` call for `main`
- [`rubix/compiler/middle/tir.bix`](rubix/compiler/middle/tir.bix:273) — the `-49` return
- [`rubix/compiler/middle/tir.bix`](rubix/compiler/middle/tir.bix:39) — `type_is_integer`
- [`rubix/compiler/middle/warnings.bix`](rubix/compiler/middle/warnings.bix:135) — `-49` diagnostic text
- [`rubix/compiler/frontend/symtab.bix`](rubix/compiler/frontend/symtab.bix:1212) — `println` builtin (only)
- [`rubix/compiler/executor/executor.bix`](rubix/compiler/executor/executor.bix:15) — W^X exec path (healthy)
- [`rubix.md`](rubix.md:114) — documented language surface (diverges from compiler)

---

## 9. Type Paradigm: Structure-Based, Not Object-Based

**Verdict: Rubix is *structure-based* (value-type / record-oriented). There is no
object model.**

Evidence from the compiler's own grammar and type system:

- **The only user-defined aggregate is `struct`.** Tokens are
  `TOKEN_KW_STRUCT` ([`token.bix:59`](rubix/compiler/frontend/token.bix:59)),
  `TOKEN_KW_ENUM` ([`token.bix:75`](rubix/compiler/frontend/token.bix:75)) and
  `TOKEN_KW_TYPE` ([`token.bix:90`](rubix/compiler/frontend/token.bix:90)). There is
  **no `class`, `object`, `interface`, `trait`, `impl`, `extends`, `inherits`, `self`,
  or `this`** anywhere in the token table or parser.
- **Aggregates are value types.** User structs occupy a contiguous id range starting at
  `TYPE_STRUCT = 100` ([`token.bix:113`](rubix/compiler/frontend/token.bix:113)),
  with `TYPE_STRUCT + struct_id` naming each record
  ([`main.bix:4293`](rubix/compiler/main.bix:4293)). Member access via `.` is resolved
  to a **static byte offset** (`emit_add_rax_imm32(code_buf, l, f_off)`), and whole
  struct assignment is a raw **byte copy**
  (`emit_copy_bytes_to_rcx`), both hallmarks of value semantics.
- **Structs are passed by pointer and cannot be returned by value.**
  [`parser.bix:5732`](rubix/compiler/frontend/parser.bix:5732) and
  [`main.bix:6425`](rubix/compiler/main.bix:6425) reject `ret_type >= TYPE_STRUCT`
  with `-41` ("Struct returns by value not supported"). A classic systems/value-type
  restriction that an object system would not impose.
- **No dynamic dispatch.** There are no vtables, `virtual` slots, or method tables in
  the compiler; `.` is field access only. Behaviour is attached to functions
  (`fn`), not to data.
- **No inheritance, no encapsulation keywords** (`public`/`private`/`protected` are
  absent). The data model is plain records + free functions.
- The compiler's own internal style is the same paradigm: a state record addressed as
  `s` with slot accessors (`get_qword(s, N)` / `set_qword(s, N, …)`) plus side tables,
  driven by procedural functions — record-based, not object-based.

Practical mapping:

| Concern | Rubix mechanism | OO analogue |
|---|---|---|
| Data grouping | `struct` (value type) | class fields |
| Named constants/sets | `enum` + `type` | enum |
| Polymorphism | `Option`/`Result` ADTs, `match`, generics-by-monomorphization | inheritance/interfaces |
| Behaviour | free `fn`s taking a struct or `*Struct` | methods |
| Dynamic dispatch | none | vtables |
| Encapsulation | none (module-level privacy only) | access modifiers |

So: reach for `struct` + functions + `match`/ADTs, **not** classes/objects/inheritance.
(Note: the `webbix/` UI layer and `rubix/legacy/` interpreter use record- and
enum-shaped data — e.g. `Value` with a `kind` discriminant — which is still
structure-based, not an object system.)
