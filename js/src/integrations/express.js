import { getConfig } from "../config.js";
import { buildPayload } from "../payload.js";
import { sendPayloadFireAndForget } from "../client.js";

let _config = null;

export function initExpress(app) {
  _config = getConfig();

  /**
   * Express error middleware — must be registered LAST, after all routes.
   * Automatically installed when you call initExpress(app).
   *
   * Express identifies error middleware by its 4-argument signature (err, req, res, next).
   */
  app.use((err, req, res, next) => {
    const payload = buildPayload(_config, {
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
    sendPayloadFireAndForget(_config, payload);

    // Pass to Express default error handler
    next(err);
  });

  return { submit };
}

export function submit(options) {
  if (!_config) return;
  const payload = buildPayload(_config, {
    submissionType: "user",
    ...options,
  });
  sendPayloadFireAndForget(_config, payload);
}
