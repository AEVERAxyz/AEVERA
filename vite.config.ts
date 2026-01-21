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
      "@shared": path.resolve(rootDir, "shared"),
    },
  },
  // 👇 WICHTIG: Wir zeigen wieder auf 'client', weil dort die index.html liegt
  root: path.resolve(rootDir, "client"),
  build: {
    // 👇 WICHTIG: Wir speichern das Ergebnis aber im Hauptordner 'dist'
    outDir: path.resolve(rootDir, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});