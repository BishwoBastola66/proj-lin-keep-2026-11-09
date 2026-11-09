# Rubix Library

**The package ecosystem for Rubix — find it, install it, publish it.**

This folder is the *platform*: the registry, the curated first-party packages, the Cloudflare edge, and the white-theme UI.
The language itself lives in [`../rubix/`](../rubix/). The command-line tool lives in [`../rix/`](../rix/).

---

## What this is

| Piece | Path | What it does |
|---|---|---|
| Registry UI | [`app/`](app/) | White-themed web app to browse/search/publish packages |
| Registry API | [`api/`](api/) | Rubix/Webbix server exposing `/v1/*` |
| Edge | [`workers/`](workers/) | Cloudflare Workers: rate-limit, cache, AI-scanner trigger |
| Database | [`db/`](db/) | Cloudflare D1 schema + seed |
| Index builder | [`index/`](index/) | Turns the GitHub mirror into the registry index |
| Curated packages | [`packages/`](packages/) | First-party packages (moved out of `std/` and `webbix/`) |
| Theme | [`theme/`](theme/) | `white.tokens.json` — the ONE source of truth for colors |

Start with [`PROMPT.md`](PROMPT.md) to understand the build, [`PLAN.md`](PLAN.md) for the reasoning, and
[`DECISIONS.md`](DECISIONS.md) for the running log.

---

## For users

```sh
rix search tensor            # find packages
rix info qme/ui-kit          # versions, integrity, AI verdict, license
rix add qme/ui-kit           # resolve + download + VERIFY + lock
rix install                  # install exactly what the lockfile says
rix run counter              # npx-style: run a package's binary
rix audit                    # find unsigned / flagged / vulnerable deps
rix doctor                   # re-verify every vendored hash + signature
```

## For publishers

```sh
rix init                     # create rubix.pkg
rix publish                  # sign -> AI scan -> upload to registry
```

Publishing is **scoped** (`your-handle/your-package`), **immutable** (versions can be yanked, never overwritten),
**signed** (Ed25519), and **AI-verified** before anyone can install it.

---

## Storage: Cloudflare holds, GitHub stores

```text
publish ─► Cloudflare Worker (WAF + rate limit + Turnstile)
              ├─► D1    metadata        ├─► R2   tarballs (sha256-addressed)
              ├─► KV    hot read cache  └─► Queue ─► GitHub mirror (cold, durable)
```

- **Reads never touch GitHub**, so bot rate-limits can never break installs.
- **Writes are queued, batched, and mirrored** to GitHub with backoff — millions of publishes won't exhaust the API.
- GitHub is the durable historical record; Cloudflare is the fast, resilient front. Each does what it is best at.

---

## Security (all of it, not some)

Scope-only names · immutable versions · sha256 verified on every read · Ed25519 author signatures · build provenance ·
**no install scripts by default** · sandboxed capability-scoped hooks · AI diff/obfuscation/secret scanning · path-traversal-safe
extraction · `rix ci` lockfile-only installs · Cloudflare WAF/Turnstile/rate limits.

See [`PROMPT.md`](PROMPT.md) §6 for the full model and [`PLAN.md`](PLAN.md) §6 for the reasoning.

---

## Theme

White-first. One accent. AA contrast. Tokens live in [`theme/white.tokens.json`](theme/white.tokens.json) and are compiled to
[`app/theme.css`](app/theme.css). No component may hardcode a color.
