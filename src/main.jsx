import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import { registerSW } from "./register-sw.jsx";
import { inject } from "@vercel/analytics";
import { bootstrapUpstoxMigration } from "./upstoxMigration.js";

async function bootstrap() {
  /* A one-time data migration must not be able to stop the app from starting:
     whatever it fails at, there is still a ledger to show. */
  try {
    await bootstrapUpstoxMigration();
  } catch (error) {
    console.error("Migration step failed; continuing", error);
  }

  createRoot(document.getElementById("root")).render(
    <React.StrictMode><App /></React.StrictMode>
  );

  registerSW();
  inject();

}

bootstrap().catch((error) => {
  console.error("Application bootstrap failed", error);
  createRoot(document.getElementById("root")).render(
    <React.StrictMode><App /></React.StrictMode>
  );
  registerSW();
  inject();
});
