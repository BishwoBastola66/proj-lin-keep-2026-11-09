-- ==============================================================================
-- Rubix Library Registry Database Schema (Cloudflare D1 / SQLite)
-- File: library/db/schema.sql
-- ==============================================================================

-- 1. Users & Authors Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    handle TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    email TEXT UNIQUE,
    public_key TEXT,                     -- Ed25519 author signing key
    github_id TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Package Categories Table
CREATE TABLE IF NOT EXISTS categories (
    slug TEXT PRIMARY KEY,               -- e.g. web, mobile, desktop, ai, data, etc.
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT
);

-- 3. Packages Table (Scope-only names handle/pkg or canonical names)
CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,                 -- slug e.g. 'handle/pkg' or 'pkg'
    name TEXT NOT NULL UNIQUE,
    scope TEXT,
    owner_id TEXT NOT NULL,
    description TEXT,
    repository TEXT,
    homepage TEXT,
    license TEXT DEFAULT 'MIT',
    category TEXT NOT NULL,
    downloads_total INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (category) REFERENCES categories(slug)
);

-- 4. Package Versions Table (Immutable except yanked)
CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,                 -- e.g. 'pkg@1.0.0'
    package_id TEXT NOT NULL,
    version TEXT NOT NULL,
    edition TEXT DEFAULT '2026',
    entry TEXT DEFAULT 'src/main.bix',
    integrity TEXT NOT NULL,             -- sha256:...
    signature TEXT,                      -- Ed25519 signature hex
    signature_keyid TEXT,
    tarball_url TEXT NOT NULL,           -- R2 URL / object key
    tarball_size INTEGER NOT NULL,
    readme TEXT,
    ai_verdict TEXT DEFAULT 'clean',     -- clean | review | blocked
    ai_scan_report TEXT,                 -- JSON audit report
    capabilities TEXT,                   -- JSON array of capabilities (net, fs, exec, gpu)
    dependencies TEXT,                   -- JSON object of dependencies
    bin_targets TEXT,                    -- JSON object of bin targets
    yanked INTEGER DEFAULT 0,            -- 0 = active, 1 = yanked
    yank_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id),
    UNIQUE (package_id, version)
);

-- 5. Package Reports Table (Security & abuse reports)
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    package_id TEXT NOT NULL,
    version TEXT,
    reporter_id TEXT,
    reason TEXT NOT NULL,                -- malware, secret_leak, spam, license_violation
    details TEXT NOT NULL,
    status TEXT DEFAULT 'pending',       -- pending, resolved, dismissed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id)
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_packages_category ON packages(category);
CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);
CREATE INDEX IF NOT EXISTS idx_versions_package_id ON versions(package_id);
CREATE INDEX IF NOT EXISTS idx_versions_integrity ON versions(integrity);
CREATE INDEX IF NOT EXISTS idx_versions_ai_verdict ON versions(ai_verdict);
