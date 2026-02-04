import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Wir definieren den Hauptpfad
const rootDir = path.resolve();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "client", "src"),
    },
  },
  root: path.resolve(rootDir, "client"),
  build: {
    outDir: path.resolve(rootDir, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true, // Erlaubt Replit URLs
    // WICHTIG: Die Brücke zum lokalen Server
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
});