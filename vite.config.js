import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* The /api routes are Vercel functions and do not exist locally, so both the
   dev server and the preview server hand them to the deployed site. That keeps
   a local build honest — the UI is the one being tested, the data is real —
   without needing the Upstox or NSE credentials on this machine. */
const apiProxy = {
  "/api": {
    target: "https://www.prateeknayak.in",
    changeOrigin: true,
    secure: true,
  },
};

export default defineConfig({
  plugins: [react()],
  // host: true binds every interface, so a phone on the same network can reach it.
  server: { port: 5173, host: true, proxy: apiProxy },
  preview: { port: 5173, host: true, proxy: apiProxy },
});
