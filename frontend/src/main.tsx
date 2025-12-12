import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { initializeOTEL } from "./lib/otel";

// Initialize OpenTelemetry first (for W3C Trace Context propagation)
initializeOTEL();

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration({
      traceFetch: true,
      traceXHR: true,
    }),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  profilesSampleRate: 1.0,
  enabled:
    import.meta.env.MODE === "production" ||
    import.meta.env.VITE_SENTRY_ENABLED === "true",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
