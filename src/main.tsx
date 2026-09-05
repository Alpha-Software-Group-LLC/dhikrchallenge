import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./styles/base.css";

const isDesktop = Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
if (!isDesktop) {
  const update = registerSW({
    onNeedRefresh() {
      // A quiet update path: the new version applies on the next natural reload.
      // Users mid-session are never interrupted.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") void update(true);
      }, { once: true });
    },
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
