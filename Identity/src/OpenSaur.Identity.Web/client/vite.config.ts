import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendTarget =
  process.env.ASPNETCORE_HTTP_PORTS != null &&
  process.env.ASPNETCORE_HTTP_PORTS.length > 0
    ? `http://localhost:${process.env.ASPNETCORE_HTTP_PORTS.split(";")[0]}`
    : process.env.ASPNETCORE_URLS != null &&
        process.env.ASPNETCORE_URLS.length > 0
      ? process.env.ASPNETCORE_URLS.split(";")[0]
      : "http://localhost:5220";

export default defineConfig(({ mode }) => ({
  build: {
    emptyOutDir: true,
    outDir: "../wwwroot",
    sourcemap: mode === "development"
  },
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/.well-known": {
        changeOrigin: true,
        secure: false,
        target: backendTarget
      },
      "/api": {
        changeOrigin: true,
        secure: false,
        target: backendTarget
      },
      "/connect": {
        changeOrigin: true,
        secure: false,
        target: backendTarget
      }
    },
    strictPort: true
  }
}));
