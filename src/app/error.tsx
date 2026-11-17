"use client";

import { useEffect } from "react";
import { reportClientError } from "@/components/ClientObservability";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, {
      kind: "react-error-boundary",
      digest: error.digest,
    });
  }, [error]);

  return (
    <main>
      <h1>Something went wrong</h1>
      <p>
        The error has been reported. You can try loading this section again.
      </p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
