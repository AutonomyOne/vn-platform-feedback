import { getConfig } from "../config.js";
import { buildPayload } from "../payload.js";
import { sendPayloadFireAndForget } from "../client.js";

let _config = null;

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
 * Vue 3 Plugin.
 * Install in main.js:
 *
 *   import { PlatformFeedbackPlugin } from 'platform-feedback'
 *   app.use(PlatformFeedbackPlugin)
 */
export const PlatformFeedbackPlugin = {
  install(app) {
    _config = getConfig();

    // Vue global error handler
    app.config.errorHandler = (err, instance, info) => {
      _submitError({
        title: err.message?.slice(0, 120) || "Vue error",
        description: err.message || "Unknown",
        errorMessage: err.message,
        stackTrace: err.stack + `\n\nVue info: ${info}`,
        page: typeof window !== "undefined" ? window.location.pathname : null,
      });
      // Log to console — don't silently swallow
      console.error("[Vue error]", err, info);
    };

    // Vue warning handler (dev only — non-critical)
    app.config.warnHandler = (msg, instance, trace) => {
      console.warn("[Vue warn]", msg, trace);
    };

    // Unhandled promise rejections
    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", (event) => {
        const msg = event.reason?.message || String(event.reason);
        _submitError({
          title: `Unhandled Promise: ${msg.slice(0, 100)}`,
          description: msg,
          errorMessage: msg,
          stackTrace: event.reason?.stack,
        });
      });
    }

    // Expose $feedback on all components
    app.config.globalProperties.$feedback = { submit };
  },
};
