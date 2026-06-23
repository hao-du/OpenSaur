import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

const backendTarget =
    process.env.ASPNETCORE_HTTP_PORTS != null &&
        process.env.ASPNETCORE_HTTP_PORTS.length > 0
        ? `http://localhost:${process.env.ASPNETCORE_HTTP_PORTS.split(";")[0]}`
        : process.env.ASPNETCORE_URLS != null &&
            process.env.ASPNETCORE_URLS.length > 0
            ? process.env.ASPNETCORE_URLS.split(";")[0]
            : "https://localhost:5031";

export default defineConfig(({ mode }) => ({
    plugins: [
        react(),
        ...(mode === "dev-offline" ? [basicSsl()] : []),
    ],
    build: {
        emptyOutDir: true,
        outDir: path.resolve(__dirname, "../wwwroot"),
        minify: mode === "development" || mode === "dev-offline" ? false : "esbuild",
        sourcemap: mode === "development" || mode === "dev-offline"
    },
    server: {
        host: "0.0.0.0",
        port: mode === "dev-offline" ? 5032 : 5174,
        proxy: {
            "/api": {
                changeOrigin: true,
                secure: false,
                target: backendTarget
            }
        },
        strictPort: true
    }
}));
