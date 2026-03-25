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

  if (!url || !apiKey || !appName || !microservice) {
    console.warn(
      "[platform-feedback] Missing env vars. Required: " +
      "FEEDBACK_SERVICE_URL, FEEDBACK_API_KEY, FEEDBACK_APP_NAME, FEEDBACK_MICROSERVICE"
    );
  }

  return { url, apiKey, appName, microservice, environment };
}
