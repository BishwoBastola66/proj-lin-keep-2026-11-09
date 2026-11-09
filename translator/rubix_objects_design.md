# Rubix Dual Paradigm — Design: Structures *and* Objects

> Companion to [`rubix_audit.md`](rubix_audit.md). Answers: *"Can we make it object
> also a structure also?"* — **Yes.** Add objects as a second, coexisting paradigm
> rather than replacing the value-type model.

---

## 1. The Core Idea

Rubix today is structure-based: `struct` is a **value type** (contiguous bytes, static
field offsets, copy on assign, pass-by-pointer, no return-by-value). Keep that.
Add `class` as a **reference type** (heap-allocated, pointer semantics, methods bound
to the type, optionally virtual). Both reuse the same declaration and lookup
machinery, split only by *memory discipline*.

| Aspect | `struct` (existing) | `class` (new) |
|---|---|---|
| Semantics | value | reference |
| Storage | inline / stack | heap (`alloc`) |
| Variable holds | the bytes | a pointer to the bytes |
| Assignment | byte copy (`emit_copy_bytes_to_rcx`) | pointer copy |
| Pass to fn | by pointer (existing) | pointer (native) |
| Return by value | disallowed (`-41`) | pointer is returnable |
| Nullable | no | yes (`null`) |
| Methods | free `fn` | `fn` in `impl`/body, `self` |
| Dispatch | none | static by default, vtable opt-in |
| Inheritance | none | optional single, base-first |

This is the Rust/Go/C++ hybrid: POD `struct` + reference `class`, one language.

---

## 2. Type-System Changes

Current type ids ([`token.bix:113`](rubix/compiler/frontend/token.bix:113)):
`TYPE_STRUCT = 100`, user structs are `TYPE_STRUCT + struct_id`.

Add a parallel reference space:

```rubix
let TYPE_CLASS = 200;   # user classes are TYPE_CLASS + class_id
```

Rules (mirror the existing `>= TYPE_STRUCT` checks):
- `a_class_type` is a **pointer-sized (8-byte)** type; `type_size` returns 8.
- It is **nullable**; `null` assigns to any class type.
- It is **not** allowed in arithmetic/comparison without a field/method access.
- `type_is_reference(t) == 1` iff `t >= TYPE_CLASS`.
- `struct` stays ≥ 100 and < 200; disjoint ranges keep every existing
  `t >= TYPE_STRUCT` test working with a one-line guard change
  (`if t >= TYPE_STRUCT & t < TYPE_CLASS`).

New tables (alongside the existing struct table at `compiler/frontend/symtab.bix:21`):
- `class_tbl` — id → {name_hash, total_size, base_class_id, field list, method list, vtable}
- Method entries reuse `func_tbl` with a **mangled hash** `mangle(class_hash, method_hash)`
  so `Point.dist` and `Line.dist` don't collide.

---

## 3. Proposed Grammar (`.bix`)

Keep `struct` exactly as-is. Add `class` with the same field syntax plus methods:

```rubix
struct Point { x: Integer, y: Integer }          # value type (unchanged)

class Shape {                                    # reference type
    name: String                                 # field
    sides: Integer

    fn area(self): Integer { 0 }                 # method (self is *Shape)
    fn describe(self): String { self.name }
}

class Circle : Shape {                           # optional single inheritance
    radius: Integer

    fn area(self): Integer { 3 * self.radius * self.radius }
}

fn main(): Integer {
    let s = new Shape { name: "shape", sides: 3 } # heap alloc + init
    let c = new Circle { name: "circle", sides: 0, radius: 5 }
    println s.describe()                          # static dispatch → Shape_describe(s)
    println c.area()                              # → Circle_area(c)
    let sh: *Shape = c                            # upcast (base-first layout)
    return 0;
}
```

Alternative (less new syntax): keep declarations as `struct` and add separate
`impl Type { fn m(self) {...} }` blocks. `impl` only attaches behaviour; `class`
additionally changes memory discipline. **Recommendation: ship `impl` first**
(smaller), then `class` on top of it.

---

## 4. Semantic Analysis

- **`self`** is a hidden first parameter typed `*Class`. In method bodies, `self.field`
  is `(*self).field`.
- **Method resolution** at `expr.ident(...)`: if `ident` is a method of `expr`'s class
  (or an ancestor), rewrite to a static call `Class_method(expr, args…)`. Otherwise fall
  back to the existing field access path. This slots into the current `.`-handling in
  [`parser.bix:720`](rubix/compiler/frontend/parser.bix:720) and
  [`parser.bix:5183`](rubix/compiler/frontend/parser.bix:5183).
- **Upcast** `*Derived → *Base` is free because the base is laid out first (offset 0);
  narrow cast `as` is a byte reinterpretation (already how `TYPE_PTR` casts work).
- **Override**: same mangled method name in a subclass; compile-time lookup walks the
  base chain, so the most-derived implementation wins for concrete types.
- **Visibility** (optional): `pub`/private by default; enforce at resolution time.

---

## 5. Codegen Plan

Reuse the existing emitters wherever possible.

**Instantiation** — `new C { f: v, … }`:
1. `buf = alloc(sizeof(C))` (heap alloc builtin already exists).
2. Zero / default-init fields.
3. For each named initializer, `emit_store_field(buf, offset, value)` — the same
   `emit_add_rax_imm32(code_buf, l, f_off)` + typed-store used for struct fields today.
4. If a constructor is declared, call it with `self = buf`.
5. Class-typed lvalue = pointer (8 bytes) → existing `emit_load_slot_typed(..., TYPE_PTR)`.

**Field access** `c.radius` where `c: *Circle`:
- This is *exactly* the `p_pointee >= TYPE_STRUCT` path already coded at
  [`parser.bix:5265`](rubix/compiler/frontend/parser.bix:5265) / [`main.bix:9695`](rubix/compiler/main.bix:9695):
  load the pointer, add the field offset, typed load. Reuse verbatim; just classify
  `TYPE_CLASS + id` like `TYPE_STRUCT + id` for **offset lookup**, with pointer
  indirection at the front.

**Method call** `c.area()`:
- Static → `call Circle_area` with `rdi = c` (System V `self` first arg). The function
  table + call emitter already target this ABI.
- Virtual (phase 2) → object layout gets a hidden `vptr` at a reserved offset; index
  the vtable, `call [vptr + 8*method_slot]`. Only needed for true subtype polymorphism
  at call sites typed as the base.

**Return** — class returns are pointer returns (`TYPE_PTR`-like), so the
`-41` "struct returns by value" restriction does **not** apply; guard it with
`t >= TYPE_STRUCT & t < TYPE_CLASS`.

---

## 6. Inheritance (single, base-first)

- Layout: `[base fields][derived fields]`. Guarantees `*Derived` is usable as `*Base`
  with no thunk.
- Method lookup walks the base chain at compile time (no vtable required for
  non-virtual methods).
- Optional `override`/`virtual` keyword switches a method to vtable dispatch.
- Multiple inheritance: **out of scope** (diamond problems, layout copies) — keep it
  single-inheritance + interfaces-free, like Go/Rust.

---

## 7. Memory Model

There is **no GC** in Rubix today. Objects are heap memory, so pick one:

1. **Manual `free(obj)`** — simplest, matches the systems ethos; risk of leaks/UAF.
2. **Arena / bump allocator** (recommended first cut) — objects die with a declared
   scope/arena; deterministic, no per-object tracking. `heap_mark()` /
   `heap_rewind(mark)` already exist in the runtime
   ([`legacy/runtime/runtime.bix:12-13`](rubix/legacy/runtime/runtime.bix:12)) and are
   a natural fit.
3. **RC/GC** — later; requires object headers and runtime support.

Recommendation: **arena-scoped objects** initially (deterministic, cheap, no headers),
add manual `free` for long-lived objects, defer GC.

---

## 8. Coexistence Rules (the important part)

- `struct` = value, `class` = reference — **never** auto-convert.
- A struct field *may* hold a class handle (`owner: *User`); a class field may hold a
  struct by value (it is inlined into the object's bytes).
- `struct` stays non-nullable and non-returnable-by-value; `class` is nullable and
  returnable.
- Generic code (`Option`/`Result`, arrays, tuples) works with both: a class handle is
  a pointer, already supported by `TYPE_PTR` handling.
- No changes to the W^X executor ([`executor.bix`](rubix/compiler/executor/executor.bix:1)) —
  objects are ordinary heap memory reached by emitted code.

---

## 9. Reuse Map — What to Touch

| Concern | Existing code to extend |
|---|---|
| Decl parse | `parser.bix:6028` (`struct`), `:6549` (`struct`/`enum` scan) |
| Field tables | `compiler/frontend/symtab.bix:21` struct table + `struct_tbl_*` |
| Type resolve | `parse_type` `TOKEN_IDENT` branch, `main.bix:4281` |
| Field access | `parser.bix:720`, `:5265` (pointer-to-struct path) |
| Function table | `func_tbl_*` + `symtab.bix:1140/1212` builtin registration |
| Heap | `alloc` builtin (`std/ffi.bix`), `heap_mark`/`heap_rewind` |
| Type guards | every `t >= TYPE_STRUCT` test — add `& t < TYPE_CLASS` |

---

## 10. Phased Roadmap

1. **Prerequisite — fix the base** (audit §7): make `./bin/rubix` executable, repoint
   the runtime to the matching compiler build, implement `Integer`/`mut`/`print`,
   fix silent output, add example CI. **Do not build objects on a toolchain that can't
   run `examples/01_basics.bix`.**
2. **`impl` blocks, static dispatch** — methods without changing memory discipline.
   Smallest useful OO step; reuses `func_tbl` mangling.
3. **`class` + `new` + `self`** — reference semantics over `alloc`; field offsets reuse
   the pointer-to-struct path.
4. **Arena memory** — scope-bound object lifetime via `heap_mark`/`heap_rewind`.
5. **Single inheritance + upcast** — base-first layout.
6. **Optional vtables** — `virtual`/`override` for true dynamic dispatch.
7. **Visibility + `pub`** — optional.

---

## 11. Risks & Effort

- **Self-hosting bootstrap:** `compiler/main.bix` is a 22,050-line generated
  concatenation of the source modules (audit §3). Every feature must be added to the
  modules **and** regenerated into `main.bix`, or it drifts.
- **Broken baseline:** the toolchain currently rejects its own examples and emits no
  output — objects inherit those bugs unless step 1 lands first.
- **Duplicated logic:** `tir_validate_main` and friends exist in 3+ copies; new
  validators must be de-duplicated simultaneously.
- **No GC:** object lifetime design (§7) is a real decision, not a detail.
- **Effort (rough):** step 2 ~ small; step 3 ~ medium; steps 4–6 ~ medium each;
  full vtable OO ~ large. Doable incrementally, each phase independently testable.

---

## 12. Verdict

Yes — Rubix can be **both** structure- and object-oriented. Keep `struct` as the value
type and add `class` as the reference type on the same declaration/lookup/codegen
spine. The fastest safe path is `impl` (behaviour) → `class`/`new` (reference
semantics) → arena lifetime → single inheritance → optional vtables — **after** the
currently-broken baseline is repaired.
