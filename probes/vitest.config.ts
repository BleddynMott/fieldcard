import { defineConfig } from 'vitest/config';

// The probes are models, not tests; CI does not run them (tasks/G-02b.md step 7).
export default defineConfig({ test: { include: ['probes/**/*.probe.ts'], environment: 'node', testTimeout: 600000 } });
