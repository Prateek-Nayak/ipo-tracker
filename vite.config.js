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

/* Something to read back over a message. The app says which build it is
   running, so which code is on a phone stops being a thing anyone has to infer
   from deployment timestamps - and a stale installed app, which keeps running
   the bundle it launched with however many times it is redeployed, gives itself
   away at a glance. Minutes in IST, since that is the clock everyone here is
   reading, and it sorts. */
const BUILD_ID = new Date(Date.now() + 5.5 * 3600 * 1000)
  .toISOString().slice(5, 16).replace("-", "").replace("T", ".").replace(":", "");

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [react()],
  // host: true binds every interface, so a phone on the same network can reach it.
  server: { port: 5173, host: true, proxy: apiProxy, watch: {
      usePolling: true,
    },},
  preview: { port: 5173, host: true, proxy: apiProxy },
  
});
