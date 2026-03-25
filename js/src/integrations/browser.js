import { getConfig } from "../config.js";
import { buildPayload } from "../payload.js";
import { sendPayloadFireAndForget } from "../client.js";
import { setConfig, getStoredConfig } from "../store.js";

export function initBrowser() {
  setConfig(getConfig());

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
  const config = getStoredConfig();
  if (!config) return;
  const payload = buildPayload(config, {
    submissionType: "programmatic",
    type: "bug",
    severity: "high",
    ...options,
  });
  sendPayloadFireAndForget(config, payload);
}

export function submit(options) {
  const config = getStoredConfig();
  if (!config) return;
  const payload = buildPayload(config, {
    submissionType: "user",
    ...options,
  });
  sendPayloadFireAndForget(config, payload);
}
