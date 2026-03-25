import { getConfig } from "../config.js";
import { buildPayload } from "../payload.js";
import { sendPayloadFireAndForget } from "../client.js";

let _config = null;

export function initNextjs() {
  _config = getConfig();

  // Auto-capture unhandled client-side errors
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      _submitError({
        title: event.message?.slice(0, 120) || "Unhandled error",
        description: event.message || "Unknown error",
        errorMessage: event.message,
        stackTrace: event.error?.stack,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      const msg = event.reason?.message || String(event.reason);
      _submitError({
        title: `Unhandled Promise rejection: ${msg.slice(0, 100)}`,
        description: msg,
        errorMessage: msg,
        stackTrace: event.reason?.stack,
      });
    });
  }

  return { submit, submitError: _submitError };
}

function _submitError(options) {
  if (!_config) return;
  const payload = buildPayload(_config, {
    submissionType: "programmatic",
    type: "bug",
    severity: "high",
    ...options,
  });
  sendPayloadFireAndForget(_config, payload);
}

export function submit(options) {
  if (!_config) return;
  const payload = buildPayload(_config, {
    submissionType: "user",
    ...options,
  });
  sendPayloadFireAndForget(_config, payload);
}

/**
 * Next.js App Router error boundary handler.
 * Use in your global error.jsx:
 *
 *   import { onAppError } from 'platform-feedback'
 *   export default function GlobalError({ error }) {
 *     onAppError(error)
 *     return <html><body><h2>Something went wrong</h2></body></html>
 *   }
 */
export function onAppError(error) {
  _submitError({
    title: error.message?.slice(0, 120) || "App error",
    description: error.message || "Unknown",
    errorMessage: error.message,
    stackTrace: error.stack,
  });
}
