# RUBIX LIBRARY — MASTER BUILD PROMPT

> You are a senior systems + platform engineer working inside the repo `/home/bishwaxyz/translator`.
> This file is the **single source of truth** for building the **Rubix Library**, the **`rix` package manager**,
> a **kid-simple web layer**, and the **Cloudflare + GitHub storage topology**.
> Read `library/PLAN.md` before writing a single line. Obey every invariant in §0. Do not stop for clarification;
> make the safe, conservative choice and record it in `library/DECISIONS.md`.

---

## 0. HARD INVARIANTS (never violate, never "improve away")

1. **Rubix stays self-hosting and dependency-free.** The compiler in [`rubix/compiler/main.bix`](../rubix/compiler/main.bix) must
   keep compiling itself with **no** GCC / Clang / LLVM / `as` / `ld`. Never introduce a C dependency into the compiler or `std`.
2. **Do not edit the bootstrap fixed-point in a way that breaks it.** After ANY change run, in order:
   `python3 run_all_regressions.py` and the bootstrap/self-host tests. The final gate is **98/98 (or more) suites passing**.
   A change that turns a green suite red is a rejected change.
3. **Every module you touch must pass `rix check` on its own.** A file that only compiles when concatenated with another
   file is **not packaged**. This is currently the #1 gap: `async, ffi, json, llm, matrix, thread, wire` fail standalone.
4. **Never commit secrets, tokens, private keys, or account IDs.** All are `.env` / Cloudflare Worker secrets only.
   `.gitignore` must cover `.env*`, `*.pem`, `*.key`, `library/.wrangler/`, `library/node_modules/`, `library/dist/`.
5. **Security is not a phase, it is the substrate.** Every package is content-addressed, signed, sandboxed, and AI-scanned
   *before* it can be installed. See §6. Never "temporarily" disable a check.
6. **The web layer must stay readable by a 12-year-old.** If a beginner cannot express an idea in ≤ 6 lines, the design failed.
   See §5 (Rubix Web DSL). Simplicity is a hard requirement, not a nice-to-have.
7. **One canonical folder layout.** Do not scatter new top-level folders. Everything new lives under `library/` (platform)
   or `rubix/std/` (language-bundled) or `rix/` (CLI). See `library/PLAN.md` §2.
8. **`rix` verbs must keep working on the existing repo.** `run/test/compile/check/fmt/debug/docs/create/dev/serve` are shipped
   and regression-tested. New package verbs are **additive** only.
9. **No silent network access from the compiler or from `std`.** Only the `rix` CLI (and the Rubix registry server) may talk
   to the network, and only through the hardened client in §6.
10. **Idempotency + determinism.** Builds, installs, and registries must be reproducible from a lockfile; byte-identical
    inputs yield byte-identical outputs.

---

## 1. EXECUTIVE GOAL

Turn the current monorepo into a **published, adult-grade ecosystem** with four deliverables:

| # | Deliverable | Lives in | Definition of done |
|---|-------------|----------|--------------------|
| A | **Consolidated language std** — remove junk, merge imports, make every `std` module self-contained | `rubix/std/` | `for f in std/*.bix; rix check $f` → 100% PASS |
| B | **Rubix Library registry** — npmjs-equivalent, category-driven, "white" theme, AI-verified | `library/` | `rix search/add/install/publish` work end-to-end against the registry |
| C | **`rix` as npm/npx/pip** — a real package manager, not a manifest appender | `rix/bin/rix` (+ `rix/lib/`) | install → resolve → verify → lock → run any package, not just webbix |
| D | **Kid-simple Rubix Web layer + storage on Cloudflare + GitHub** | `webbix/`, `library/app/` | a child writes 6 lines and gets a working page; storage survives millions of writes |

---

## 2. PHASE A — CONSOLIDATE & DE-JUNK THE LANGUAGE

**Step A1 — Remove unwanted packages/modules.**
- Inventory every file under `rubix/std/`, `webbix/`, `rubix/legacy/`, `rubix/scratch/`, `rubix/examples/`.
- Classify each: `KEEP-BUNDLED` (language), `KEEP-REGISTRY` (moves to `library/packages/`), `DELETE` (dead/duplicate/stub).
- Delete the `DELETE` set. Legacy dialect files (`rubix/legacy/**` using `module/def/end/Integer/String`) must **not** be
  included anywhere in `std/` or `webbix/` — quarantine or delete them. Record deletions in `library/DECISIONS.md`.
- Known-duplicate/overlapping candidates to resolve: `webbix/client` vs `webbix/declarative` vs `webbix/ir` vs `webbix/framework`,
  and `rubix/std/web.bix` vs `rubix/std/http.bix` vs `webbix/server`. Pick ONE canonical path per concept.

**Step A2 — Merge imports into a small, fixed core.**
- Define the bundled core as a **single include graph** rooted at `rubix/std/core.bix`, split into modules that each check
  clean: `core` (memory/alloc/syscall), `math`, `string`, `collections`, `fs`, `cli`, `json`, `wire`, `http`(client+server),
  `net`, `thread`, `async`, `proc`, `tensor`, `matrix`, `llm`.
- **Fix the 7 failing modules so each passes `rix check` alone.** Root causes to hunt:
  - missing identifier because it lives in a sibling module → add an explicit `include` of the *defining* module, OR
    move the shared primitive into `core`.
  - `llm.bix` specifically references `tensor.bix` symbols (e.g. `matmul_i8`) — either `include "tensor.bix";` at the top of
    `llm.bix` **or** move the tensor primitives it needs into `core`. Prefer the explicit include.
  - Apply the same treatment to `matrix`, `wire`, `ffi`, `async`, `thread`, `json`.
- **Guardrail:** add a regression test `rubix/tests/test_std_selfcontained.py` that loops `std/*.bix`, runs `rix check` on each,
  and fails if any module fails. Register it in [`rubix/run_all_regressions.py`](../rubix/run_all_regressions.py).

**Step A3 — Gap-closing (the "clear all gaps" list).** Implement, in priority order:
1. **JSON parser** (`json_parse` → tree/tokenizer) — [`rubix/std/json.bix`](../rubix/std/json.bix) is encode-only today.
   Nothing network-facing works without it.
2. **Outbound TCP client + DNS resolver + HTTP client** — needs `net` + `json` + `http` client. (Server path exists.)
3. **Real atomic builtin** (`atomic_add` / `compare_and_swap` / `fence`) — [`rubix/std/proc.bix`](../rubix/std/proc.bix)
   currently uses bare `set_qword` for its barrier; that is a correctness bug. Wire it through `register_builtins()`.
4. **`wire.bix` self-containment** (serialization used by the registry protocol).
5. **SIMD codegen cut-over** — `machdesc.bix` + `*.machine` declare `VEC_FMA/VEC_DOT`; prove the *live backend* emits them,
   then vectorize `matmul_i8`. Until then, do not claim SIMD support.
6. **TLS posture** — Rubix still has no TLS. Do **not** invent one now: the registry is **served** behind Cloudflare TLS and
   the `rix` client (Python) uses `ssl`. Document this boundary explicitly.

**Gate A:** `python3 run_all_regressions.py` ≥ 98/98 **and** the new `test_std_selfcontained.py` green.

---

## 3. PHASE B — THE `rix` PACKAGE MANAGER (npm / npx / pip class)

Rewrite the package verbs in [`rix/bin/rix`](../rix/bin/rix) (currently stubs at `cmd_add`/`cmd_remove`/`cmd_update`) into a real
manager. Keep them in Python (see §7 why), but structure them under `rix/lib/` for testability.

**Verb surface (must implement):**

```
rix init                       # scaffold rubix.pkg + .rixrc
rix search <query> [--category] # query the registry index
rix info <pkg>                 # manifest, versions, integrity, AI verdict, licenses
rix add <pkg>[@version]        # resolve from registry, download, VERIFY, install to /vendor, update lockfile
rix install                    # install everything from rubix.pkg exactly (lockfile-faithful)
rix ci                         # clean, lockfile-only install (CI mode)
rix remove <pkg>
rix update [pkg]               # respect semver ranges, rewrite lockfile
rix publish                    # sign, scan, upload to registry (auth required)
rix audit                      # report vulnerabilities / unsigned / AI-flagged deps
rix doctor                     # verify every vendored package hash + signature
rix run <pkg>                  # npx-style: run a package's declared bin without permanently installing
rix cache clean|verify         # content-addressed local cache (~/.rix/cache)
```

**Manifest `rubix.pkg` (new canonical format; keep reading legacy `webbix.pkg`/`package.json`):**
```
name        "qme/counter"
version     "1.2.0"
edition     "2026"
entry       "src/main.bix"
description "A counter app"
license     "MIT"
category    web

dep "std/collections" "1.x"
dep "qme/ui-kit" "^2.0.0"

bin "counter" "src/main.bix"
targets     [native, rex, wasm]
```

**Lockfile `rubix.lock` (deterministic):** for every resolved node record
`name, version, source(git sha + registry url), integrity(sha256), signature(sig+keyid), ai_verdict, deps[]`.

**Resolver rules:**
- Semver-first, **exact-lock** by default. `^`/`~`/`x` supported.
- Deterministic resolution order (lexicographic tie-break), so two machines produce identical lockfiles.
- Transitive deps resolved to a single version per (name) unless a conflict is declared → then fail loudly.
- Content-addressed cache keyed by `sha256(content)`. Never trust a cache entry without re-hashing on install.

**Gate B:** `rix add` on a clean machine installs, verifies, locks, and `rix run`s a **non-webbix** package (e.g. a pure
`collections`-based CLI tool) with zero manual steps. Ship `rubix/tests/test_rix_packaging.py` for this.

---

## 4. PHASE C — THE LIBRARY (npmjs-like registry, "white" theme)

Build the registry as a **Webbix application** inside `library/`, backed by Cloudflare (D1/KV/R2) and mirrored on GitHub.

**Folder layout (create exactly):**
```
library/
  README.md                 # white-themed landing (this doc's partner)
  PROMPT.md                 # (this file)
  PLAN.md                   # the why/thinking
  DECISIONS.md              # append-only log of every choice
  theme/white.tokens.json   # the single source of truth for the WHITE theme
  packages/                 # the curated first-party Rubix library (moved out of std/webbix/)
    collections/  ui/  http/  json/  tensor/  ...
  app/                      # the registry web app, written in Rubix/Webbix
    src/main.bix            # entry
    src/pages/*.bix         # home, search, package, publish, docs
    src/components/*.bix    # white-theme UI kit
  api/                      # the Rubix registry server (Webbix) — read/write API
    src/main.bix
    src/routes/*.bix
  workers/                  # Cloudflare Workers (edge, rate-limit, cache, AI scanner trigger)
    rate-limit/  cache/  scanner/
  db/
    schema.sql              # D1 schema
    seed.sql
  index/
    build_index.py          # turns GitHub package metadata into the registry index
```

**Registry data model (Cloudflare D1):**
```
packages(name PK, category, description, license, latest, downloads, verified, created_at)
versions(name, version, integrity_sha256, source_git_sha, signature, key_id,
         ai_verdict, ai_report_url, published_at, yanked, PRIMARY KEY(name,version))
categories(slug PK, title, icon, description, sort_order)
users(handle PK, pubkey, email_hash, created_at)
reports(id, name, version, reporter_hash, reason, state, created_at)
```

**Categories (ship at minimum):** `web, mobile, desktop, ai, data, graphics, games, networking, systems, crypto, tools, education`.

**Server API (versioned, JSON):**
```
GET  /v1/search?q=&category=&page=          -> index slice (edge-cached)
GET  /v1/pkg/{name}                         -> manifest + versions + ai_verdict
GET  /v1/pkg/{name}/{version}               -> metadata + integrity + download url
GET  /v1/pkg/{name}/{version}/tarball       -> R2 signed URL (short TTL)
POST /v1/publish                            -> signed upload (auth), enqueues AI scan
POST /v1/report                             -> abuse/vuln report
GET  /v1/keys                               -> current signing pubkeys (rotation)
```

**WHITE THEME (hard requirement).** `library/theme/white.tokens.json` is the single source of truth. Light, calm,
high-contrast, accessible:
```
bg            #FFFFFF    surface       #FFFFFF    surface-alt  #F7F8FA
border        #E6E8EC    border-strong #D0D5DD    text         #101828
text-muted    #475467    accent        #2563EB    accent-weak  #EFF4FF
success       #12B76A    warn          #F79009    danger       #F04438
radius        12px       shadow        0 1px 2px rgba(16,24,40,.06)
font          Inter, system-ui, sans-serif
```
Rules: no dark chrome on the registry; no gradients on text; AA contrast minimum; every page is white-first with a single
accent; icons monochrome. The `app/src/components/*` kit must consume the tokens, never hardcode colors.

**Gate C:** `rix search tens` returns results from the live/staging registry; the registry page renders white-themed on
`rex_browser_host` and a generated static build passes pixel/regression tests.

---

## 5. PHASE D — KID-SIMPLE RUBIX WEB DSL

The current entry experience is too heavy (see [`webbix/examples/counter_app.bix`](../webbix/examples/counter_app.bix) — 109 lines for a
counter, with manual node IDs, `WebbixVNode`, `webbix_client_init`, etc.). Build **`bix`** — a beginner surface on top of Webbix.

**Target ergonomics (this is the acceptance test — a 12-year-old can read it):**
```
use web

page Home:
    title "Hello"
    text "My name is " + name
    button "Say hi" -> name = "Riya"
    input name

start Home
```
Rendered result must be a real HTTP-served page, not a toy.

Requirements:
1. Keep all existing Webbix machinery — `bix` is **sugar that lowers to Webbix IR**. Do not fork the engine.
2. No manual node IDs, no `alloc_buffer`, no pointer arithmetic, no `include` in beginner files. Those stay available for experts.
3. Provide a tiny, closed vocabulary: `page, text, button, input, image, list, if, repeat, start`.
4. One-command run: `rix run main.bix` serves it; `rix build` emits a native binary.
5. Ship `webbix/examples/kid/*.bix` (≥ 5 examples) and a `rubix/tests/test_kid_dsl.py` that compiles and asserts HTML output.
6. Errors in beginner files must be **human sentences**, not `error[-41]`. Map internal codes to friendly messages when the
   source is in "simple mode" (detect by `use web` + no `include`).

**Gate D:** all 5 kid examples compile, serve, and pass HTML-assertion tests; the friendly-error mapping is covered by tests.

---

## 6. SECURITY MODEL (the most secure methods in the world — implement all of it)

**6.1 Namespacing & supply chain**
- Namespaced, scope-only publishing: `handle/package` (npm-style). No unqualified top-level names. Prevents typosquatting of
  popular names; reserve `std/*` to the language only.
- Immutable versions: a published `(name, version)` can never be overwritten — only `yank`ed. Integrity is `sha256` of the tarball.
- Provenance: every version records the source Git SHA + build environment hash. npm-style provenance attestations.
- Author signing: publishers register an Ed25519 **pubkey**; every publish is signed. `rix doctor` verifies signature + hash.

**6.2 Installation-time safety**
- Content-addressed store; verify hash **on every read**, not just on download.
- Sandbox install: packages are extracted with path-traversal guards (reject `..`, absolute paths, symlinks escaping root).
- **No install scripts by default.** Any package requesting post-install hooks must be explicitly approved, run in a sandbox
  with no network (seccomp/`unshare` if available), and be marked with a visible warning. This kills the #1 npm attack vector.
- Capability manifest: packages must *declare* what they need (`net`, `fs:read`, `fs:write`, `exec`, `gpu`). `rix` refuses to
  grant undeclared capabilities at runtime and warns at install.
- Lockfile is authoritative in `rix ci`: network fetch of new versions is forbidden.

**6.3 AI verification pipeline (every publish)**
1. static lint (`rix check` on all `.bix`)
2. diff/intent review: AI reads the diff against the previous version and flags suspicious capability escalation
3. malware heuristics: obfuscated constants, dynamic `exec`, raw syscall wrappers, suspicious sockets, hidden unicode
4. license + secret scan (no tokens/keys in tarballs)
5. verdict stored on the version row (`ai_verdict ∈ {clean, review, blocked}`) with a human-readable report
6. `blocked` cannot be installed without an explicit override flag, which is logged locally.

**6.4 Edge protection (Cloudflare)**
- Cloudflare **WAF** + bot management in front of every API route.
- **Rate limiting** at the edge so a bot cannot exhaust GitHub (see §7). Sliding-window per-IP + per-token.
- Signed R2 URLs for tarballs (short TTL), so content never streams through the Worker hot path.
- Turnstile on publish/report forms.
- All traffic TLS-terminated by Cloudflare; origin locked to the Worker only.

**6.5 Disclosure & response**
- `SECURITY.md` with a PGP/age key, 48h ack SLA, 90-day disclosure.
- Revocation: yank + revoke key + invalidate edge cache. Documented runbook in `library/PLAN.md` §9.

---

## 7. STORAGE TOPOLOGY — CLOUDFLARE HOLDS, GITHUB STORES

**The load problem:** if millions of projects publish at once and every request hits GitHub's API, GitHub rate-limits/bans the
bot. Cloudflare must absorb the flood.

**Design:**
```
Publisher (rix publish)
      │  signed upload
      ▼
Cloudflare Worker  ──  WAF + bot mgmt + rate limit + Turnstile
      │
      ├─► D1        : package/version/user metadata (fast, indexed, queryable)
      ├─► KV        : hot read cache for /v1/search and manifests (edge, global)
      ├─► R2        : tarball blobs (content-addressed by sha256) + signed URL downloads
      └─► Queue     : async jobs (AI scan, GitHub mirror, index rebuild)
                          │
                          ▼
                  GitHub (source of truth / cold store)
                  - one repo per package: rubixlib/<handle>__<name>
                  - release per version holds the tarball + provenance attestation
                  - periodic, batched mirror (never per-request)
```
**Rules**
- **Reads never touch GitHub.** Serve from KV/D1/R2. GitHub is cold storage + provenance mirror only.
- **Writes are queued, batched, and exponential-backoff'd** to GitHub. Use a single GitHub App installation token, rotated,
  never a personal token. Hard cap concurrency; honor `Retry-After`.
- **GitHub is optional for installs** — installing a package uses R2, so GitHub being rate-limited never blocks users.
- **Disaster recovery:** D1/R2/KV are rebuildable from the GitHub mirror via `library/index/build_index.py`.
- **Cost/quotas:** document Cloudflare free-tier limits and the overflow plan; the design must degrade to "read-only index"
  rather than fail open.
- **Cost control:** edge cache TTL on search = 60s, on version metadata = immutable (hours). Tarball = immutable.

---

## 8. TESTING, CI, AND DEFINITION OF DONE

- Every phase ships tests **first-class** in `rubix/tests/` and `library/tests/`, registered in
  [`rubix/run_all_regressions.py`](../rubix/run_all_regressions.py).
- New required suites: `test_std_selfcontained.py`, `test_rix_packaging.py`, `test_kid_dsl.py`, `test_registry_api.py`,
  `test_security_verify.py` (hash/signature/sandbox), `test_lockfile_determinism.py`.
- CI matrix: bootstrap fixed-point, 98/98+ regressions, `rix check` over `std/*` and `library/packages/*`, security tests.
- **Definition of Done (whole project):**
  1. `std/*` 100% standalone-clean; junk removed; imports consolidated.
  2. `rix` is a real manager: install/verify/lock/run/publish/audit/doctor, lockfile-deterministic.
  3. `library/` registry serves search/info/publish over a white theme, backed by CF + mirrored to GitHub.
  4. A 12-year-old's 6-line `bix` file runs and serves a page.
  5. Security pipeline (§6) active on publish and verified in tests.

---

## 9. WORKING AGREEMENT

- Work **phase by phase** (A → B → C → D). Do not start a phase before the previous gate is green.
- After every phase: run the full regression battery, then append a dated entry to `library/DECISIONS.md`
  (what changed, what was deleted, why, and evidence: test output).
- Push back only with evidence. If a stated approach breaks an invariant in §0, choose the invariant.
- Keep the repo buildable at all times. Nothing half-done on `main`.
