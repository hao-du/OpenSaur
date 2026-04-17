import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendTarget =
  process.env.ASPNETCORE_HTTP_PORTS != null &&
  process.env.ASPNETCORE_HTTP_PORTS.length > 0
    ? `http://localhost:${process.env.ASPNETCORE_HTTP_PORTS.split(";")[0]}`
    : process.env.ASPNETCORE_URLS != null &&
        process.env.ASPNETCORE_URLS.length > 0
      ? process.env.ASPNETCORE_URLS.split(";")[0]
      : "https://localhost:5011";

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: path.resolve(__dirname, "../wwwroot")
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
    proxy: {
      "/app-config.js": {
        changeOrigin: true,
        secure: false,
        target: backendTarget
      }
    },
    strictPort: true
  }
});
