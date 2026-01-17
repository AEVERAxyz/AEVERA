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
      "@assets": path.resolve(rootDir, "attached_assets"),
    },
  },
  // Vite soll im 'client' Ordner starten
  root: path.resolve(rootDir, "client"),
  build: {
    outDir: path.resolve(rootDir, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    hmr: {
      // Deaktiviert das Fehler-Overlay, falls es stört
      overlay: false, 
    },
  },
});