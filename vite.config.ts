import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Wir definieren den Hauptpfad
const rootDir = path.resolve();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Nur noch der Alias für den Client ist da. 
      // @shared ist gelöscht, da wir kein Backend mehr haben.
      "@": path.resolve(rootDir, "client", "src"),
    },
  },
  // Vite soll im 'client' Ordner starten (wo die index.html liegt)
  root: path.resolve(rootDir, "client"),
  build: {
    // Das Ergebnis soll im Hauptordner 'dist' landen
    outDir: path.resolve(rootDir, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});