/**
 * Reads feedback config from environment variables.
 * Works across Next.js (NEXT_PUBLIC_*), Vite (VITE_*), and Node.js.
 *
 * IMPORTANT: Each env var must appear as a static string literal
 * (e.g. process.env.NEXT_PUBLIC_FEEDBACK_SERVICE_URL) so that
 * Next.js/Webpack/Turbopack and Vite can find and inline them
 * at build time. Dynamic access like process.env[key] does NOT work.
 */
export function getConfig() {
  const url =
    process.env.NEXT_PUBLIC_FEEDBACK_SERVICE_URL ||
    process.env.VITE_FEEDBACK_SERVICE_URL ||
    process.env.FEEDBACK_SERVICE_URL ||
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_FEEDBACK_SERVICE_URL) ||
    null;

  const apiKey =
    process.env.NEXT_PUBLIC_FEEDBACK_API_KEY ||
    process.env.VITE_FEEDBACK_API_KEY ||
    process.env.FEEDBACK_API_KEY ||
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_FEEDBACK_API_KEY) ||
    null;

  const appName =
    process.env.NEXT_PUBLIC_FEEDBACK_APP_NAME ||
    process.env.VITE_FEEDBACK_APP_NAME ||
    process.env.FEEDBACK_APP_NAME ||
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_FEEDBACK_APP_NAME) ||
    null;

  const microservice =
    process.env.NEXT_PUBLIC_FEEDBACK_MICROSERVICE ||
    process.env.VITE_FEEDBACK_MICROSERVICE ||
    process.env.FEEDBACK_MICROSERVICE ||
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_FEEDBACK_MICROSERVICE) ||
    null;

  const environment =
    process.env.NEXT_PUBLIC_FEEDBACK_ENV ||
    process.env.VITE_FEEDBACK_ENV ||
    process.env.FEEDBACK_ENV ||
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_FEEDBACK_ENV) ||
    "staging";

  // Diagnostic logging — helps debug config issues in consumer apps
  if (typeof console !== "undefined" && console.debug) {
    console.debug("[platform-feedback] Config resolved:", {
      url: url ? `${url.slice(0, 30)}...` : null,
      apiKey: apiKey ? "***" : null,
      appName,
      microservice,
      environment,
    });
  }

  const missing = [
    !url && "FEEDBACK_SERVICE_URL",
    !apiKey && "FEEDBACK_API_KEY",
    !appName && "FEEDBACK_APP_NAME",
    !microservice && "FEEDBACK_MICROSERVICE",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(
      `[platform-feedback] Missing required env vars: ${missing.join(", ")}. ` +
      `Prefix with NEXT_PUBLIC_ (Next.js) or VITE_ (Vite) as needed.`
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error(`[platform-feedback] FEEDBACK_SERVICE_URL is not a valid URL: "${url}"`);
  }

  return { url: url.replace(/\/+$/, ""), apiKey, appName, microservice, environment };
}
