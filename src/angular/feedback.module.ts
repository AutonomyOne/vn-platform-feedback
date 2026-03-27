import { Injectable, ErrorHandler, NgModule, APP_INITIALIZER, ModuleWithProviders } from '@angular/core';
import { getConfig } from '../config.js';
import { buildPayload } from '../payload.js';
import { sendPayloadFireAndForget } from '../client.js';

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private config = getConfig();

  submit(options: {
    type?: string;
    severity?: string;
    title: string;
    description: string;
    submissionType?: string;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    page?: string;
    sentryEventId?: string;
    screenshotUrl?: string;
  }): void {
    const payload = buildPayload(this.config, {
      submissionType: options.submissionType || 'user',
      ...options,
    });
    sendPayloadFireAndForget(this.config, payload);
  }

  submitError(error: Error, context?: Record<string, unknown>): void {
    const payload = buildPayload(this.config, {
      submissionType: 'programmatic',
      type: 'bug',
      severity: 'high',
      title: error.message?.slice(0, 120) || 'Angular error',
      description: error.message || 'Unknown error',
      errorMessage: error.message,
      stackTrace: error.stack,
      ...context,
    });
    sendPayloadFireAndForget(this.config, payload);
  }
}

// ── Global Error Handler ──────────────────────────────────────────────────────

@Injectable()
export class FeedbackErrorHandler implements ErrorHandler {
  constructor(private feedback: FeedbackService) {}

  handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.feedback.submitError(err);
    // Still log to console
    console.error('[Angular error]', error);
  }
}

// ── Module ────────────────────────────────────────────────────────────────────

@NgModule({})
export class PlatformFeedbackModule {
  /**
   * Import in your root AppModule or bootstrapApplication providers:
   *
   *   // app.module.ts
   *   imports: [PlatformFeedbackModule.forRoot()]
   *
   *   // main.ts (standalone)
   *   bootstrapApplication(AppComponent, {
   *     providers: [PlatformFeedbackModule.forRoot().providers]
   *   })
   */
  static forRoot(): ModuleWithProviders<PlatformFeedbackModule> {
    return {
      ngModule: PlatformFeedbackModule,
      providers: [
        FeedbackService,
        {
          provide: ErrorHandler,
          useClass: FeedbackErrorHandler,
          deps: [FeedbackService],
        },
      ],
    };
  }
}
