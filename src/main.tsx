import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";
import './styles/premium.css';
import { Suspense } from "react";
import { TranslationProvider } from './i18n/index';

createRoot(document.getElementById("root")!).render(
  <TranslationProvider>
    <Suspense fallback="loading">
      <App />
    </Suspense>
  </TranslationProvider>
);