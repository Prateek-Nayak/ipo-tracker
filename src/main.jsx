import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import { registerSW } from "./register-sw.jsx";
import { inject } from "@vercel/analytics";
import { bootstrapUpstoxMigration } from "./upstoxMigration.js";
import { installUxEnhancements } from "./uxEnhancements.js";

/*
 * Mount React first. The Upstox migration can involve network requests and
 * must never block the first paint. Previously bootstrapUpstoxMigration() was
 * awaited before createRoot(), leaving #root empty and producing a black
 * screen for several seconds on a cold/reload start. App already has its own
 * lazy/loading UI, so let that render immediately and do migration work in
 * the background.
 */
const root = createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);

registerSW();
inject();
installUxEnhancements();

void bootstrapUpstoxMigration().catch((error) => {
  console.error("Background migration step failed; continuing", error);
});
