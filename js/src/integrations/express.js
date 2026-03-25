import { getConfig } from "../config.js";
import { buildPayload } from "../payload.js";
import { sendPayloadFireAndForget } from "../client.js";
import { setConfig, getStoredConfig } from "../store.js";

export function initExpress(app) {
  setConfig(getConfig());

  /**
   * Express error middleware — must be registered LAST, after all routes.
   * Automatically installed when you call initExpress(app).
   *
   * Express identifies error middleware by its 4-argument signature (err, req, res, next).
   */
  app.use((err, req, _res, next) => {
    const config = getStoredConfig();
    const payload = buildPayload(config, {
      submissionType: "programmatic",
      type: "bug",
      severity: "high",
      title: `${err.name || "Error"}: ${err.message?.slice(0, 120)}`,
      description: err.message || "Unknown error",
      page: req.path,
      errorMessage: err.message,
      stackTrace: err.stack,
      extra: {
        method: req.method,
        url: req.originalUrl,
        status: err.status || 500,
      },
    });
    sendPayloadFireAndForget(config, payload);

    // Pass to Express default error handler
    next(err);
  });

  return { submit };
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
