/**
 * Detects the current JS framework at runtime.
 */
export function detectFramework() {
  // Next.js — server or client
  if (typeof process !== "undefined" && process.env?.NEXT_RUNTIME) return "nextjs";
  if (typeof window !== "undefined" && window.__NEXT_DATA__) return "nextjs";

  // Angular — checks for ng global or Angular-specific DOM attributes
  if (typeof window !== "undefined" && (window.ng || document.querySelector("[ng-version]")))
    return "angular";

  // Vue 3 — checks for __VUE__ global
  if (typeof window !== "undefined" && window.__VUE__) return "vue";

  // Express — Node.js, no window
  if (typeof window === "undefined" && typeof process !== "undefined") return "express";

  // Generic browser
  if (typeof window !== "undefined") return "browser";

  return "unknown";
}
