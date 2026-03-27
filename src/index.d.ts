// Type declarations for platform-feedback SDK

/** SDK version string (semver). */
export const version: string;

export interface FeedbackConfig {
  url: string;
  apiKey: string;
  appName: string;
  microservice: string;
  environment: string;
}

export interface FeedbackUser {
  id?: string;
  email?: string;
  role?: string;
}

export interface SubmitOptions {
  submissionType?: "user" | "programmatic";
  type?: "bug" | "cosmetic" | "suggestion";
  severity?: "critical" | "high" | "low";
  title?: string;
  description?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  page?: string;
  sessionId?: string;
  sentryEventId?: string;
  errorMessage?: string;
  stackTrace?: string;
  screenshotUrl?: string;
}

export interface FeedbackPayload {
  submission_type: string;
  timestamp: string;
  session_id: string;
  app_name: string;
  microservice: string;
  environment: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  user_id: string;
  user_email: string | null;
  user_role: string | null;
  page: string | null;
  page_url?: string;
  browser?: string;
  screen_resolution?: string;
  viewport_size?: string;
  sentry_event_id: string | null;
  error_message: string | null;
  stack_trace: string | null;
  screenshot_url: string | null;
}

/** Auto-detect framework and initialize feedback SDK. */
export function initFeedback(app?: unknown): { submit: typeof submit } | null;

/** Submit a feedback payload. Requires initFeedback() to have been called first. */
export function submit(options: SubmitOptions): void;

/** Next.js App Router error boundary handler. */
export function onAppError(error: Error): void;

/** React error boundary component. */
export class FeedbackErrorBoundary {
  constructor(props: { children?: unknown; fallback?: unknown });
  static getDerivedStateFromError(): { hasError: boolean };
  componentDidCatch(error: Error, info: { componentStack?: string }): void;
  render(): unknown;
}

// Vue and Angular are available via dedicated export paths to avoid
// pulling in their peer dependencies for React/Next.js consumers:
//   import { PlatformFeedbackPlugin } from 'platform-feedback/vue'
//   import { PlatformFeedbackModule } from 'platform-feedback/angular'
