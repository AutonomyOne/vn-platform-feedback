import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from './feedback.module.js';

@Component({
  selector: 'pf-feedback-button',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating trigger -->
    <button class="pf-btn" (click)="open.set(true)">🐛 Feedback</button>

    <!-- Modal -->
    @if (open()) {
      <div class="pf-overlay">
        <div class="pf-modal">
          <div class="pf-header">
            <h2>Report Feedback</h2>
            <button class="pf-close" (click)="open.set(false)">✕</button>
          </div>

          <!-- Honeypot -->
          <input [(ngModel)]="honeypot" name="_hp" style="display:none" tabindex="-1" autocomplete="off" />

          <div class="pf-row">
            @for (t of typeOptions; track t) {
              <button [class]="'pf-chip' + (type === t ? ' pf-chip--on' : '')" (click)="type = t">
                {{ typeLabel[t] }}
              </button>
            }
          </div>

          <div class="pf-row">
            @for (sv of severityOptions; track sv) {
              <button [class]="'pf-chip' + (severity === sv ? ' pf-chip--on' : '')" (click)="severity = sv">
                {{ sevLabel[sv] }}
              </button>
            }
          </div>

          <input class="pf-input" [(ngModel)]="title" placeholder="Short title" maxlength="120" />
          <textarea class="pf-input pf-textarea" [(ngModel)]="description"
            placeholder="What happened? What did you expect? Steps to reproduce..."></textarea>

          @if (errorMsg) { <p class="pf-error">{{ errorMsg }}</p> }
          @if (submitted()) { <p class="pf-thanks">✅ Feedback received. Thank you.</p> }

          @if (!submitted()) {
            <div class="pf-row">
              <button class="pf-submit" (click)="handleSubmit()" [disabled]="submitting()">
                {{ submitting() ? 'Sending…' : 'Submit' }}
              </button>
              <button class="pf-cancel" (click)="open.set(false)">Cancel</button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .pf-btn        { position:fixed; bottom:24px; right:24px; z-index:9998; background:#111; color:#fff; border:none; border-radius:24px; padding:10px 18px; font-size:13px; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,.2); }
    .pf-overlay    { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:9999; }
    .pf-modal      { background:#fff; border-radius:12px; padding:28px; width:100%; max-width:480px; display:flex; flex-direction:column; gap:12px; box-shadow:0 20px 60px rgba(0,0,0,.3); }
    .pf-header     { display:flex; justify-content:space-between; align-items:center; }
    .pf-header h2  { margin:0; font-size:18px; font-weight:700; }
    .pf-close      { background:none; border:none; font-size:18px; cursor:pointer; color:#666; }
    .pf-row        { display:flex; gap:8px; flex-wrap:wrap; }
    .pf-chip       { padding:6px 14px; border-radius:20px; border:1px solid #ddd; cursor:pointer; background:#f5f5f5; font-size:13px; }
    .pf-chip--on   { background:#111; color:#fff; border-color:#111; }
    .pf-input      { width:100%; padding:8px 12px; border-radius:8px; border:1px solid #ddd; font-size:14px; box-sizing:border-box; }
    .pf-textarea   { height:100px; resize:vertical; }
    .pf-error      { color:#c00; font-size:13px; margin:0; }
    .pf-thanks     { font-size:16px; text-align:center; }
    .pf-submit     { padding:10px 24px; border-radius:8px; background:#111; color:#fff; border:none; cursor:pointer; font-size:14px; }
    .pf-cancel     { padding:10px 24px; border-radius:8px; background:#f5f5f5; color:#333; border:1px solid #ddd; cursor:pointer; font-size:14px; }
  `],
})
export class FeedbackButtonComponent {
  @Input() user: { id?: string; email?: string; role?: string } = {};

  open      = signal(false);
  submitting = signal(false);
  submitted  = signal(false);

  type     = 'bug';
  severity = 'high';
  title    = '';
  description = '';
  honeypot = '';
  errorMsg = '';

  typeOptions     = ['bug', 'cosmetic', 'suggestion'];
  severityOptions = ['critical', 'high', 'low'];
  typeLabel: Record<string, string>  = { bug: '🐛 Bug', cosmetic: '🎨 Cosmetic', suggestion: '💡 Suggestion' };
  sevLabel: Record<string, string>   = { critical: '🔴 Critical', high: '🟠 High', low: '🟡 Low' };

  constructor(private feedback: FeedbackService) {}

  handleSubmit() {
    if (this.honeypot) return;
    if (!this.title.trim() || !this.description.trim()) {
      this.errorMsg = 'Title and description are required.';
      return;
    }
    this.submitting.set(true);
    this.errorMsg = '';
    try {
      this.feedback.submit({
        submissionType: 'user',
        type: this.type,
        severity: this.severity,
        title: this.title,
        description: this.description,
        userId: this.user?.id,
        userEmail: this.user?.email,
        userRole: this.user?.role,
      });
      this.submitted.set(true);
      setTimeout(() => { this.open.set(false); this.submitted.set(false); }, 2000);
    } catch {
      this.errorMsg = 'Submission failed. Please try again.';
    } finally {
      this.submitting.set(false);
    }
  }
}
