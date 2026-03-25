/**
 * Reads feedback config from environment variables.
 * Works across Next.js (NEXT_PUBLIC_*), Vite (VITE_*), and Node.js.
 */
export function getConfig() {
  const env = (key) =>
    (typeof process !== "undefined" && process.env?.[key]) ||
    (typeof import.meta !== "undefined" && import.meta?.env?.[key]) ||
    null;

  const url =
    env("NEXT_PUBLIC_FEEDBACK_SERVICE_URL") ||
    env("VITE_FEEDBACK_SERVICE_URL") ||
    env("FEEDBACK_SERVICE_URL");

  const apiKey =
    env("NEXT_PUBLIC_FEEDBACK_API_KEY") ||
    env("VITE_FEEDBACK_API_KEY") ||
    env("FEEDBACK_API_KEY");

  const appName =
    env("NEXT_PUBLIC_FEEDBACK_APP_NAME") ||
    env("VITE_FEEDBACK_APP_NAME") ||
    env("FEEDBACK_APP_NAME");

  const microservice =
    env("NEXT_PUBLIC_FEEDBACK_MICROSERVICE") ||
    env("VITE_FEEDBACK_MICROSERVICE") ||
    env("FEEDBACK_MICROSERVICE");

  const environment =
    env("NEXT_PUBLIC_FEEDBACK_ENV") ||
    env("VITE_FEEDBACK_ENV") ||
    env("FEEDBACK_ENV") ||
    "staging";

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
