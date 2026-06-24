import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY || "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          login: resolve(__dirname, "index.html"),
          home: resolve(__dirname, "pages/home.html"),
          admin: resolve(__dirname, "pages/admin.html"),
        },
      },
    },
  };
});
