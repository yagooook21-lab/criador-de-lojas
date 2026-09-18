// Polyfill crypto.randomUUID for non-secure HTTP contexts (IP addresses)
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    (window as any).crypto = {};
  }
  if (typeof window.crypto.randomUUID !== 'function') {
    (window.crypto as any).randomUUID = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
  }
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;
rootEl.style.display = "contents";
createRoot(rootEl).render(<App />);
