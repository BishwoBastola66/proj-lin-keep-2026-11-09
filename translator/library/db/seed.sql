-- ==============================================================================
-- Rubix Library Registry Database Seed Data
-- File: library/db/seed.sql
-- ==============================================================================

-- 1. Standard 12 Categories
INSERT OR IGNORE INTO categories (slug, name, description, icon) VALUES
('web', 'Web', 'Web frameworks, DOM bindings, and HTTP servers', 'globe'),
('mobile', 'Mobile', 'Mobile application primitives and responsive UI', 'smartphone'),
('desktop', 'Desktop', 'Native GUI applications and desktop utilities', 'monitor'),
('ai', 'AI & ML', 'Tensor computing, LLM inference, and neural ops', 'cpu'),
('data', 'Data & Math', 'High-performance data structures and algorithms', 'database'),
('graphics', 'Graphics', '2D canvas, 3D WebGPU, and raster rendering', 'image'),
('games', 'Games', 'Game loops, physics engines, and audio synthesis', 'gamepad'),
('networking', 'Networking', 'TCP, UDP, DNS, protocols, and wire serialization', 'wifi'),
('systems', 'Systems', 'Process orchestration, low-level OS, and atomics', 'terminal'),
('crypto', 'Cryptography', 'Hashing, cryptographic signatures, and ciphers', 'lock'),
('tools', 'Developer Tools', 'CLI utilities, linters, code generators, and dev tools', 'tool'),
('education', 'Education', 'Beginner-friendly tutorials, puzzles, and kid-simple DSLs', 'book-open');

-- 2. System Users
INSERT OR IGNORE INTO users (id, handle, display_name, email, public_key) VALUES
('usr_core', 'rubix-core', 'Rubix Core Team', 'team@rubix-lang.org', 'ed25519:e4d9b2e1a3c5f780a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0'),
('usr_community', 'community', 'Rubix Community Contributors', 'community@rubix-lang.org', 'ed25519:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789');

-- 3. Initial Curated Packages
INSERT OR IGNORE INTO packages (id, name, scope, owner_id, description, license, category, downloads_total) VALUES
('collections', 'collections', NULL, 'usr_core', 'High-performance persistent collections, HashMaps, and RingBuffers for Rubix', 'MIT', 'data', 1420),
('webbix-core', 'webbix-core', NULL, 'usr_core', 'Native reactive declarative web and DOM framework for Rubix', 'MIT', 'web', 3580),
('tensor-ai', 'tensor-ai', NULL, 'usr_core', 'Lightweight tensor ops and INT8 quantized matmul kernels', 'MIT', 'ai', 890),
('wire-proto', 'wire-proto', NULL, 'usr_core', 'Binary wire serialization and RPC protocol for Rubix services', 'MIT', 'networking', 670);

-- 4. Versions
INSERT OR IGNORE INTO versions (
    id, package_id, version, edition, entry, integrity, tarball_url, tarball_size, ai_verdict, capabilities, dependencies
) VALUES
(
    'collections@1.0.0', 'collections', '1.0.0', '2026', 'src/main.bix',
    'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'https://r2.rubix-lang.org/tarballs/collections-1.0.0.tar.gz', 4200,
    'clean', '[]', '{}'
),
(
    'webbix-core@1.0.0', 'webbix-core', '1.0.0', '2026', 'src/main.bix',
    'sha256:c0ffee112233445566778899aabbccddeeff00112233445566778899aabbccdd',
    'https://r2.rubix-lang.org/tarballs/webbix-core-1.0.0.tar.gz', 12500,
    'clean', '["net", "fs:read"]', '{}'
);
