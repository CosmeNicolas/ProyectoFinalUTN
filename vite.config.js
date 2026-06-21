import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        login: resolve(__dirname, "index.html"),
        home: resolve(__dirname, "pages/home.html"),
      },
    },
  },
});
