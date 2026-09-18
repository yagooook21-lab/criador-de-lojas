import { defineConfig } from "vite";
import path from "path";
import { createOrderMiddleware } from "./vite-plugins/create-order-middleware";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [createOrderMiddleware()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
}));
