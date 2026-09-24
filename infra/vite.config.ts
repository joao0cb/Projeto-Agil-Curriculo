import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 🎭 Preview sem backend: mock de convex/react com dados de demonstração.
      // Testes (vitest.config.ts) e build com backend real não passam por aqui.
      "convex/react": fileURLToPath(
        new URL("./src/testMocks/convexReactMock.tsx", import.meta.url),
      ),
    },
  },
  clearScreen: false,
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
