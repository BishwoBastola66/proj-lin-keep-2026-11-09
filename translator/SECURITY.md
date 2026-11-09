# Rubix Security Policy & Ecosystem Disclosure

## Security Principles

Security in the Rubix ecosystem is the substrate, not a phase:
1. **Content-Addressed Immutability**: Packages are strictly content-addressed by `sha256(content)`. Versions are immutable (yank-only); releases cannot be silently overwritten or replaced.
2. **Deterministic Reproducibility**: `rubix.lock` pins the exact SHA-256 integrity hash, signature, and dependency tree of every package. Installs in CI (`rix ci`) refuse to execute if the lockfile is absent, modified, or if downloaded tarball checksums deviate.
3. **Safe Extraction Sandbox**: The `rix` package manager enforces strict path-traversal prevention (ZipSlip protection). Tarballs containing absolute paths, directory traversal sequences (`..`), or external symlinks are immediately rejected.
4. **No Arbitrary Pre/Post Install Scripts**: Packages are prevented from running arbitrary shell scripts during `rix install` or `rix add`. Tooling hooks are strictly sandboxed and network-isolated.
5. **AI-Powered Publish Pipeline**: Every package published to the Rubix Library registry undergoes automated AI and static analysis:
   - Static syntax and linting checks.
   - Secret and private key detection.
   - Obfuscated bytecode and reverse-shell heuristics.
   - Capability manifest verification (`net`, `fs:read`, `fs:write`, `exec`, `gpu`).
   - Automated verdict: `clean`, `review`, or `blocked`.

---

## Reporting a Vulnerability & SLAs

We take security vulnerabilities seriously and adhere to responsible disclosure standards:

- **Initial Acknowledgment SLA**: Within **48 hours** of receiving a security advisory.
- **Triage & Remediation Plan**: Within **7 business days**.
- **Coordinated Disclosure SLA**: Standard **90-day** disclosure window from initial triage, or sooner if a coordinated patch release is deployed.
- **Reporting Contact**: Security advisories should be submitted via `security@rubix-lang.org` or through GitHub Private Vulnerability Reporting on the Rubix repository.

---

## Package Compromise & Key Revocation Runbook

In the event of an author key compromise, compromised release, or reported vulnerability:

### 1. Immediate Triage & Quarantine
- The registry operator or security team marks the compromised version as `yanked` or `blocked` in the registry database:
  ```sql
  UPDATE versions SET yanked = 1, ai_verdict = 'blocked' WHERE package_id = ? AND version = ?;
  ```
- The Cloudflare KV cache for the package metadata is purged immediately.

### 2. Client-Side Enforcement
- Subsequent runs of `rix install` or `rix add` querying the registry will refuse to install versions marked as `blocked`.
- `rix audit` flags any locally installed package matching the compromised SHA-256 hash or version.

### 3. Key Revocation
- In the event an author's Ed25519 signing key is compromised:
  1. Author submits revocation request signed with backup recovery key or verified via GitHub App OAuth.
  2. The key is added to the revoked keys list in the registry.
  3. All releases signed solely by the revoked key after the compromise timestamp are marked for `review` or `blocked`.
  4. Author registers a new Ed25519 public key.

### 4. Public Advisory
- A GitHub Security Advisory (GHSA) and CVE identifier will be issued documenting the impact, affected version ranges, and upgrade guidance.
