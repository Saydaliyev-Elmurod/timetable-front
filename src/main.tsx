import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";
import './styles/premium.css';
import { Suspense } from "react";
import { TranslationProvider } from './i18n/index';

// Dev-only Web Vitals attribution — quantifies INP and names the slowest
// interaction/script. Stripped from production builds by the DEV guard.
if (import.meta.env.DEV) {
  import('./lib/webVitals').then(({ initWebVitals }) => initWebVitals());
}

createRoot(document.getElementById("root")!).render(
  <TranslationProvider>
    <Suspense fallback="loading">
      <App />
    </Suspense>
  </TranslationProvider>
);