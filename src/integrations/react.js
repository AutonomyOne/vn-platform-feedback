import { getConfig } from "../config.js";
import { buildPayload } from "../payload.js";
import { sendPayloadFireAndForget } from "../client.js";
import { setConfig, getStoredConfig } from "../store.js";

export function initReact() {
  setConfig(getConfig());

  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      _submitError({
        title: event.message?.slice(0, 120) || "Unhandled error",
        description: event.message || "Unknown error",
        errorMessage: event.message,
        stackTrace: event.error?.stack,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      const msg = event.reason?.message || String(event.reason);
      _submitError({
        title: `Unhandled Promise rejection: ${msg.slice(0, 100)}`,
        description: msg,
        errorMessage: msg,
        stackTrace: event.reason?.stack,
      });
    });
  }

  return { submit, submitError: _submitError };
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

/**
 * React class-based error boundary.
 * Wrap your app root:
 *
 *   import { FeedbackErrorBoundary } from 'platform-feedback'
 *   <FeedbackErrorBoundary>
 *     <App />
 *   </FeedbackErrorBoundary>
 */
export class FeedbackErrorBoundary {
  constructor(props) {
    this.props = props;
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    _submitError({
      title: error.message?.slice(0, 120) || "React component error",
      description: error.message || "Unknown",
      errorMessage: error.message,
      stackTrace: error.stack + "\n\nComponent Stack:\n" + info?.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}
