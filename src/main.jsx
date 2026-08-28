import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import { registerSW } from "./register-sw.jsx";
import { inject } from "@vercel/analytics";
import { bootstrapUpstoxMigration } from "./upstoxMigration.js";

async function bootstrap() {
  const cleanupUiRules = await bootstrapUpstoxMigration();

  createRoot(document.getElementById("root")).render(
    <React.StrictMode><App /></React.StrictMode>
  );

  registerSW();
  inject();

  return cleanupUiRules;
}

bootstrap().catch((error) => {
  console.error("Application bootstrap failed", error);
  createRoot(document.getElementById("root")).render(
    <React.StrictMode><App /></React.StrictMode>
  );
  registerSW();
  inject();
});
