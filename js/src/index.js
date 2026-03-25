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

export { submit } from "./integrations/browser.js";
export { PlatformFeedbackPlugin } from "./integrations/vue.js";
export { PlatformFeedbackModule, FeedbackService, FeedbackErrorHandler } from "./angular/feedback.module.ts";
export { FeedbackErrorBoundary } from "./integrations/react.js";
export { onAppError } from "./integrations/nextjs.js";

export function initFeedback(app = null) {
  const framework = detectFramework();

  switch (framework) {
    case "nextjs": {
      const { initNextjs } = require("./integrations/nextjs.js");
      return initNextjs();
    }
    case "vue": {
      // Vue uses plugin pattern — initFeedback() is a no-op,
      // user installs via app.use(PlatformFeedbackPlugin)
      console.info("[platform-feedback] Vue detected. Use app.use(PlatformFeedbackPlugin) instead.");
      return null;
    }
    case "angular": {
      // Angular uses module pattern — initFeedback() is a no-op,
      // user imports PlatformFeedbackModule.forRoot()
      console.info("[platform-feedback] Angular detected. Use PlatformFeedbackModule.forRoot().");
      return null;
    }
    case "express": {
      const { initExpress } = require("./integrations/express.js");
      return initExpress(app);
    }
    default: {
      // React or generic browser
      const { initReact } = require("./integrations/react.js");
      return initReact();
    }
  }
}
