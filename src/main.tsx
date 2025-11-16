
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Suspense } from "react";
import { TranslationProvider } from './i18n/index';

createRoot(document.getElementById("root")!).render(
  <TranslationProvider>
    <Suspense fallback="loading">
      <App />
    </Suspense>
  </TranslationProvider>
);