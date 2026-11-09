# RUBIX LIBRARY — PLAN & REASONING

This is the **thinking** behind [`library/PROMPT.md`](PROMPT.md). Read this to understand *why* the prompt says what it says.
It is written to be re-readable in six months when we have forgotten the context.

---

## 1. Where we actually are (verified, not assumed)

Evidence gathered by running the repo, not by reading a claim:

- **Regression battery: 98/98 suites pass (≈16s).** Includes the new `test_ai_tensor.py`, `test_ai_inference.py`,
  `test_rex_webgpu.py`.
- **Hygiene: 0 `TODO/FIXME/HACK`** across all `.bix`.
- **`std/` standalone health is BAD — 7 of 17 fail `rix check`:**

  | PASS (10) | FAIL (7) |
  |---|---|
  | `core, math, string, collections, fs, cli, http, web, proc, tensor` | `async, ffi, json, llm, matrix, thread, wire` |

  The 98/98 number is real, but it is **masked**: `test_ai_inference.py` concatenates `tensor + proc + llm` into one blob, so a
  module that depends on another still "passes". A standalone `rix check` exposes the truth. **This is the core gap.**

- **`rix` package verbs are stubs.** [`cmd_add()`](../rix/bin/rix:717) appends `"pkg": "^1.0.0"` to a manifest and does nothing else.
  [`cmd_remove()`](../rix/bin/rix:735) is a text filter. [`cmd_update()`](../rix/bin/rix:750) prints "up to date" without doing anything.
  There is **no registry, no download, no verification, no lockfile, no cache**.

- **Webbix has two worlds:** a legacy flag/enum engine (109-line counter in
  [`webbix/examples/counter_app.bix`](../webbix/examples/counter_app.bix) with manual node IDs) and a newer declarative layer
  ([`webbix/declarative/app.bix`](../webbix/declarative/app.bix) with `App/State/StateInc`). Neither is kid-simple.

- **No TLS, no DNS, no HTTP client, and `json.bix` is encode-only** — so the `rix` client can never be Rubix-only. (Confirmed earlier.)

**Conclusion:** the ecosystem is a strong *engine* with a missing *distribution and ergonomics layer*. That is exactly what this
project builds.

---

## 2. Where things live (canonical layout — no scattered folders)

```
rubix/                 # the language + compiler (unchanged home)
  std/                 #   bundled, self-contained language modules (Phase A)
  compiler/            #   self-hosting compiler
  tests/               #   regression suites (all new suites register here)
rix/
  bin/rix              #   the CLI (Python; the client shim)
  lib/                 #   NEW: package manager internals (resolver, verify, lock, cache)
webbix/                # the web engine (engine only)
library/               # NEW: the ecosystem platform (registry + curated packages + workers)
  packages/            #   curated first-party packages moved out of std/webbix
  app/                 #   white-themed registry UI (Webbix)
  api/                 #   registry server (Webbix)
  workers/             #   Cloudflare Workers (edge)
  db/                  #   D1 schema + seed
  index/               #   GitHub -> registry index builder
```

**Why `library/` as the new home?** You asked for a `library` folder. It cleanly separates *the language* (rubix) from *the
ecosystem* (library). It also gives Cloudflare Workers/`wrangler.toml`/`package.json` a place to live without polluting the
compiler repo root.

**"Remove all packages / combine the important ones."** Interpretation: the `std/` surface has grown to 17 modules with
overlaps (`web` vs `http`; `matrix` vs `tensor`; `thread` vs `async` vs `proc`). Plan:
- Merge overlapping modules into a small fixed core (`core, math, string, collections, fs, cli, json, wire, net, http, thread, async, proc, tensor, llm`).
- Move non-language, higher-level things (`ui`, `webbix`): to `library/packages/`.
- Delete dead/legacy/duplicate files (`rubix/legacy/**` legacy dialect, unused `scratch/`).
- Each surviving module must `rix check` alone. Non-negotiable.

---

## 3. Why `rix` stays Python (and the registry can be Rubix)

We re-verified: Rubix has **no TLS, no DNS resolver, no HTTP client, and no JSON parser**. A package manager's client *must*:
speak HTTPS, resolve DNS, parse JSON, verify signatures. Therefore:

- **Client (`rix` CLI): Python.** It already is ([\`rix/bin/rix\`](../rix/bin/rix) is `#!/usr/bin/env python3`). We harden it, not rewrite it.
  Reason: correctness and security beat purity for the installer.
- **Registry server: Rubix/Webbix** behind **Cloudflare TLS**. This proves the language can serve a real platform, while
  Cloudflare terminates TLS (which Rubix cannot do yet).
- **Future:** when Rubix gains TLS + JSON parse, port `rix` to Rubix. The API is versioned (`/v1/`) so the client can be swapped.

**`rix` as npm/npx/pip:** unify the model — a manifest (`rubix.pkg`), a lockfile (`rubix.lock`), a content-addressed cache,
`npx`-style `rix run <pkg>`, `pip`-style `rix install`, and npm-style scopes/semver/provenance. See PROMPT §3.

---

## 4. Why the registry is Cloudflare-first, GitHub-cold

The explicit concern: **millions of simultaneous publishes would exhaust GitHub's API limits and get the bot banned.**

The fix is architectural, not a bigger token:

1. **Never let reads touch GitHub.** Search/manifests come from KV/D1 (edge, fast, cached). Tarballs come from R2 via signed URLs.
   GitHub is never in the hot path.
2. **Queue writes.** Publishes enqueue jobs; a background worker batches and mirrors to GitHub with backoff and a single
   rotating GitHub App token. If GitHub is rate-limited, **users are unaffected** — R2 still serves installs.
3. **Abuse absorption.** WAF + bot management + Turnstile + sliding-window rate limits stop the flood before it reaches origin.
4. **Rebuildability.** GitHub is the *durable* mirror; D1/KV/R2 are rebuildable from it via `library/index/build_index.py`.
   Cloudflare is the *fast, resilient* front. Each does what it is best at: Cloudflare holds, GitHub stores.

This also answers "hold": Cloudflare holds hot state and streams bytes; GitHub holds the immutable historical record.

---

## 5. Making the web language kid-simple

Current 109-line counter vs target 6-line page. The plan is a **sugar layer (`bix`) that lowers to the existing Webbix IR** —
we do not fork the engine (Invariant §0.1/§0.2). We hide node IDs, pointers, allocs, and includes behind a 9-word vocabulary.
Errors in simple mode get human sentences. Acceptance = a child's file runs and serves.

**Why not simplify by deleting Webbix?** Because Webbix already works and is regression-tested; the problem is *surface*, not
*engine*. Sugar over a solid core is the safe, fast path.

---

## 6. Security decisions (and the "why")

| Decision | Why (threat) |
|---|---|
| Scope-only names (`handle/pkg`) | typosquatting / name squatting of popular packages |
| Immutable versions + yank | malicious overwrite of a trusted version |
| sha256 per tarball, verified on **every** read | cache poisoning, MITM, disk corruption |
| Ed25519 author signatures + provenance | impersonation of a publisher; verify build origin |
| **No install scripts by default** | the #1 real-world npm attack vector (postinstall RCE) |
| Sandboxed, network-less hooks when approved | limits blast radius when a hook is unavoidable |
| Capability declarations (`net`,`fs`,`exec`,`gpu`) | least privilege; visible privilege escalation |
| AI diff/obfuscation/license/secret scan pre-publish | catches malware & leaks before distribution |
| `rix ci` forbids new network versions | reproducible, tamper-resistant builds |
| Cloudflare WAF/Turnstile/rate limit | DDoS/bot abuse, publish spam |
| Path-traversal-safe extraction | zip-slip style escapes in archives |

We explicitly call these "the most secure methods" because they are the *current best practice* (npm/pip/Cargo learned these the
hard way). We implement all of them rather than a subset.

---

## 7. Order of work & gates

```
Phase A  Consolidate & de-junk language      → Gate: std/* 100% standalone + 98/98+
Phase B  Real rix package manager            → Gate: install/verify/lock/run a non-webbix pkg
Phase C  Library registry (white theme)      → Gate: search + publish e2e; white page renders
Phase D  Kid-simple web DSL                  → Gate: 5 kid examples compile+serve+test
```

A is first because **you cannot package what does not compile**. B is second because C needs a client.
C is third because D is independent but nicer to demo once the registry exists.

---

## 8. Open questions to resolve as we work (record answers in `DECISIONS.md`)

1. **Final `std` module list** — is `matrix` folded into `tensor`? is `web` folded into `http`? (Recommend yes/no respectively.)
2. **Registry hostname** — `lib.rubix.dev` vs Cloudflare `*.workers.dev`. Affects key URLs and docs.
3. **Signing key custody** — registry org key + per-publisher keys; where is the org key backed up?
4. **GitHub mirror org name** — `rubixlib` suggested; one repo per package vs one repo with releases.
5. **AI scanner runtime** — Cloudflare Worker (fast, limited) vs GitHub Action (slower, full model access).
6. **Do we keep `webbix.pkg` and `package.json`** as legacy reads, or migrate once? (Recommend: read legacy, write `rubix.pkg` only.)
7. **Kid DSL keyword set** — freeze at `page,text,button,input,image,list,if,repeat,start`?

---

## 9. Runbooks (fill in as phases land)

- **Incident: malicious package published.** Yank version → revoke publisher key → purge KV/R2 edge cache → publish advisory →
  `rix audit` marks it locally. SLA: same day.
- **Incident: GitHub rate-limited.** Worker backs off; installs continue via R2; alert if queue depth > threshold for > 15 min.
- **Incident: Cloudflare origin down.** Serve read-only index from KV cache; disable publish with a friendly banner.
- **Rollback a bad registry release.** Redeploy previous Worker version; D1 migrations are additive-only; R2/KV are immutable-ish.
