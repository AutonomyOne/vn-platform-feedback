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
 *   import { PlatformFeedbackPlugin } from 'platform-feedback/vue'
 *   app.use(PlatformFeedbackPlugin)
 *
 * Angular:
 *   import { PlatformFeedbackModule } from 'platform-feedback/angular'
 *   PlatformFeedbackModule.forRoot()
 */

import { detectFramework } from "./detector.js";
import { submit } from "./integrations/browser.js";
import { initReact, FeedbackErrorBoundary } from "./integrations/react.js";
import { initNextjs, onAppError } from "./integrations/nextjs.js";
import { initExpress } from "./integrations/express.js";

export const version = "0.2.0";

export { submit, FeedbackErrorBoundary, onAppError };

export function initFeedback(app = null) {
  const framework = detectFramework();

  switch (framework) {
    case "nextjs":
      return initNextjs();
    case "vue":
      console.info(
        "[platform-feedback] Vue detected. Use:\n" +
        "  import { PlatformFeedbackPlugin } from 'platform-feedback/vue'"
      );
      return null;
    case "angular":
      console.info(
        "[platform-feedback] Angular detected. Use:\n" +
        "  import { PlatformFeedbackModule } from 'platform-feedback/angular'"
      );
      return null;
    case "express":
      return initExpress(app);
    default:
      // React or generic browser
      return initReact();
  }
}
