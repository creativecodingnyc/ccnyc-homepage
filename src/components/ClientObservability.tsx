"use client";

import { useEffect } from "react";

type ErrorContext = Record<
  string,
  string | number | boolean | null | undefined
>;

export function reportClientError(error: unknown, context: ErrorContext = {}) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  const body = JSON.stringify({
    message: normalized.message,
    stack: normalized.stack,
    name: normalized.name,
    url: window.location.href,
    userAgent: navigator.userAgent,
    context,
    occurredAt: new Date().toISOString(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/observability/client-error",
      new Blob([body], { type: "application/json" }),
    );
    return;
  }
  void fetch("/api/observability/client-error", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
    keepalive: true,
  }).catch(() => {});
}

export default function ClientObservability() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError(event.error || event.message, {
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        kind: "window-error",
      });
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportClientError(event.reason, { kind: "unhandled-rejection" });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
