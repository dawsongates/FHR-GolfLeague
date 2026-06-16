import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/FHR-GolfLeague/",
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
