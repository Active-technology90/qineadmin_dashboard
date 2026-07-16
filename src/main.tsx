// src/main.tsx
import './i18n/i18n'; // ⬅️ i18n config must be imported FIRST
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/authContext.tsx";
import React, { Suspense } from "react"; // ⬅️ needed for Suspense

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-secondary">Loading...</div>}>
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
      </BrowserRouter>
    </Suspense>
  </React.StrictMode>
);