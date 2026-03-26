import React from "react";
import ReactDOM from "react-dom/client";
import { AppProviders } from "./app/providers/AppProviders";
import { AppRouter } from "./app/router/AppRouter";
import { AuthBootstrapBoundary } from "./features/auth/components/AuthBootstrapBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <AuthBootstrapBoundary>
        <AppRouter />
      </AuthBootstrapBoundary>
    </AppProviders>
  </React.StrictMode>
);
