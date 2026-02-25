import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom for DOM testing (needed for Three.js and browser APIs)
    environment: 'jsdom',
    
    // Include test files
    include: ['tests/**/*.test.js', 'tests/**/*.test.ts'],
    
    // Exclude patterns
    exclude: ['node_modules', 'dist', '.git'],
    
    // Test timeout in milliseconds
    testTimeout: 10000,
    
    // Setup files to run before tests
    setupFiles: ['./tests/setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js', 'src/**/*.ts'],
      exclude: ['node_modules', 'tests/']
    },
    
    // Globals - allows using describe, it, expect without imports
    globals: true,
    
    // Watch mode settings
    watch: true
  },
  
  // Resolve aliases for imports
  resolve: {
    alias: {
      '@': '/src',
      '@module': '/src/module'
    }
  }
});
