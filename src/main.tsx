import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  for (const [oldKey, newKey] of [
    ["nurture-theme", "onesie-theme"],
    ["nurture-feeding-reminder", "onesie-feeding-reminder"],
  ]) {
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, oldValue);
    }
    if (oldValue !== null) localStorage.removeItem(oldKey);
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
