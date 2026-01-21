import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// path.resolve() ohne Argumente ist der sicherste Weg, den Hauptordner zu bekommen
const rootDir = path.resolve();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Wir bauen die Pfade vom Hauptordner aus
      "@": path.resolve(rootDir, "client", "src"),
      "@shared": path.resolve(rootDir, "shared"),
      // @assets wurde entfernt, da der Ordner gelöscht wurde (Clean Code)
    },
  },
  // Vite soll im 'client' Ordner starten
  root: path.resolve(rootDir, "client"),
  build: {
    // WICHTIG: Wir speichern jetzt direkt in 'dist', passend zur neuen .replit Config
    outDir: path.resolve(rootDir, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    // 👇 Das ist der Schlüssel: Erlaubt Replit URLs
    allowedHosts: true,
    hmr: {
      overlay: false, 
    },
  },
});