import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Hide initial loading indicator immediately
const loadingEl = document.getElementById("initial-loading");
if (loadingEl) {
  loadingEl.style.opacity = "0";
  loadingEl.style.transition = "opacity 0.4s ease";
  setTimeout(() => loadingEl.remove(), 500);
}

createRoot(document.getElementById("root")!).render(<App />);