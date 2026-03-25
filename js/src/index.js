/**
 * platform-feedback JS SDK
 * Single import, zero config beyond env vars.
 *
 * Usage:
 *   import { initFeedback } from 'platform-feedback'
 *   initFeedback()           // auto-detects framework
 *   initFeedback(app)        // pass app instance for Express
 *
 * Vue:
 *   import { PlatformFeedbackPlugin } from 'platform-feedback'
 *   app.use(PlatformFeedbackPlugin)
 *
 * Angular:
 *   import { PlatformFeedbackModule } from 'platform-feedback'
 *   PlatformFeedbackModule.forRoot()
 */

import { detectFramework } from "./detector.js";
import { submit } from "./integrations/browser.js";
import { initReact, FeedbackErrorBoundary } from "./integrations/react.js";
import { initNextjs, onAppError } from "./integrations/nextjs.js";
import { initExpress } from "./integrations/express.js";
import { PlatformFeedbackPlugin } from "./integrations/vue.js";
import { PlatformFeedbackModule, FeedbackService, FeedbackErrorHandler } from "./angular/feedback.module.ts";

export const version = "0.1.0";

export { submit, FeedbackErrorBoundary, onAppError, PlatformFeedbackPlugin };
export { PlatformFeedbackModule, FeedbackService, FeedbackErrorHandler };

export function initFeedback(app = null) {
  const framework = detectFramework();

  switch (framework) {
    case "nextjs":
      return initNextjs();
    case "vue":
      // Vue uses plugin pattern — initFeedback() is a no-op,
      // user installs via app.use(PlatformFeedbackPlugin)
      console.info("[platform-feedback] Vue detected. Use app.use(PlatformFeedbackPlugin) instead.");
      return null;
    case "angular":
      // Angular uses module pattern — initFeedback() is a no-op,
      // user imports PlatformFeedbackModule.forRoot()
      console.info("[platform-feedback] Angular detected. Use PlatformFeedbackModule.forRoot().");
      return null;
    case "express":
      return initExpress(app);
    default:
      // React or generic browser
      return initReact();
  }
}
