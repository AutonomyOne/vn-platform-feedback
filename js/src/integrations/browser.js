import { getConfig } from "../config.js";
import { buildPayload } from "../payload.js";
import { sendPayloadFireAndForget } from "../client.js";

let _config = null;

export function initBrowser() {
  _config = getConfig();

  window.addEventListener("error", (event) => {
    _submitError({
      title: event.message?.slice(0, 120) || "Unhandled error",
      description: event.message || "Unknown",
      errorMessage: event.message,
      stackTrace: event.error?.stack,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message || String(event.reason);
    _submitError({
      title: `Unhandled Promise: ${msg.slice(0, 100)}`,
      description: msg,
      errorMessage: msg,
      stackTrace: event.reason?.stack,
    });
  });

  return { submit };
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
