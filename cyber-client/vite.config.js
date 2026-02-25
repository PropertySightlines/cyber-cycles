import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0', // Exposes to all network interfaces
    port: 5173,      // Ensures it stays on 5173
    strictPort: true // Fails if 5173 is taken, rather than silently switching to 5174
  }
});