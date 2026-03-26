import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendTarget =
  process.env.ASPNETCORE_HTTPS_PORTS != null &&
  process.env.ASPNETCORE_HTTPS_PORTS.length > 0
    ? `https://localhost:${process.env.ASPNETCORE_HTTPS_PORTS.split(";")[0]}`
    : process.env.ASPNETCORE_URLS != null &&
        process.env.ASPNETCORE_URLS.length > 0
      ? process.env.ASPNETCORE_URLS.split(";")[0]
      : "https://localhost:7017";

export default defineConfig({
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
});
