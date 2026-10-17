import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from GitHub Pages at /ReactLeavePlanner/
export default defineConfig({
  base: "/ReactLeavePlanner/",
  plugins: [react()],
  server: { port: 5210, strictPort: true },
});
