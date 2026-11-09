'use client';

// Suppress harmless Three.js r185 internal Clock deprecation warning
if (typeof window !== 'undefined') {
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return;
    origWarn.apply(console, args);
  };
}
