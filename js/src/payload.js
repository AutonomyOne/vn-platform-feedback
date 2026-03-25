import { v4 as uuidv4 } from "uuid";

function getSessionId() {
  if (typeof sessionStorage === "undefined") return uuidv4();
  let id = sessionStorage.getItem("_pf_sid");
  if (!id) { id = uuidv4(); sessionStorage.setItem("_pf_sid", id); }
  return id;
}

function getBrowserContext() {
  if (typeof window === "undefined") return {};
  return {
    page_url: window.location.href,
    page: window.location.pathname,
    browser: navigator.userAgent,
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
  };
}

export function buildPayload(config, options = {}) {
  return {
    // Submission metadata
    submission_type: options.submissionType || "programmatic",
    timestamp: new Date().toISOString(),
    session_id: options.sessionId || getSessionId(),

    // App context
    app_name: config.appName,
    microservice: config.microservice,
    environment: config.environment,

    // Report
    type: options.type || "bug",
    severity: options.severity || "high",
    title: options.title || "",
    description: options.description || "",

    // User context
    user_id: options.userId || "anonymous",
    user_email: options.userEmail || null,
    user_role: options.userRole || null,

    // Browser context (auto-captured)
    ...getBrowserContext(),

    // Overrides from caller
    ...(options.page ? { page: options.page } : {}),

    // Error linkage
    sentry_event_id: options.sentryEventId || null,
    error_message: options.errorMessage || null,
    stack_trace: options.stackTrace || null,

    // Attachments
    screenshot_url: options.screenshotUrl || null,
  };
}
