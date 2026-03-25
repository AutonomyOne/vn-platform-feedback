/**
 * FeedbackModal — shared across React and Next.js.
 * Handles user-initiated submissions with full context capture.
 *
 * Props:
 *   user         { id, email, role }
 *   appName      string
 *   appVersion   string (optional)
 *   onClose      () => void
 *   onSubmit     (payload) => Promise<void>  — injected by integration
 */

import { useState, useRef } from "react";
import { getConfig } from "../config.js";

const TYPE_OPTIONS     = ["bug", "cosmetic", "suggestion"];
const SEVERITY_OPTIONS = ["critical", "high", "low"];
const TYPE_LABEL  = { bug: "🐛 Bug", cosmetic: "🎨 Cosmetic", suggestion: "💡 Suggestion" };
const SEV_LABEL   = { critical: "🔴 Critical", high: "🟠 High", low: "🟡 Low" };

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_RE = /^image\/(png|jpe?g|gif|webp)$/;

function getSessionId() {
  if (typeof sessionStorage === "undefined") return "ssr";
  let id = sessionStorage.getItem("_pf_sid");
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("_pf_sid", id); }
  return id;
}

function getBrowserContext() {
  if (typeof window === "undefined") return {};
  return {
    page_url: window.location.href,
    page: window.location.pathname,
    browser: navigator.userAgent,
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
  };
}

export default function FeedbackModal({ user, appName: _appName, appVersion: _appVersion, onClose, onSubmit }) {
  const [type, setType]               = useState("bug");
  const [severity, setSeverity]       = useState("high");
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot]   = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState(null);
  const honeypotRef                   = useRef(null);

  async function handleSubmit() {
    if (honeypotRef.current?.value) return; // honeypot
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Screenshot upload — get presigned URL then upload direct to Spaces
      let screenshotUrl = null;
      if (screenshot) {
        const cfg = getConfig();
        const res = await fetch(
          `${cfg.url}/upload-url`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Api-Key": cfg.apiKey,
            },
            body: JSON.stringify({ filename: screenshot.name }),
          }
        );
        const { upload_url, public_url } = await res.json();
        await fetch(upload_url, {
          method: "PUT",
          headers: { "Content-Type": screenshot.type || "image/png" },
          body: screenshot,
        });
        screenshotUrl = public_url;
      }

      // Capture Sentry event ID if available
      let sentryEventId = null;
      try {
        sentryEventId = window.__SENTRY__?.hub?.lastEventId?.() || null;
      } catch (_e) {
        // Sentry not available — safe to ignore
      }

      const payload = {
        submission_type: "user",
        type,
        severity,
        title: title.trim().slice(0, 120),
        description: description.trim().slice(0, 5000),
        screenshot_url: screenshotUrl,
        sentry_event_id: sentryEventId,
        user_id: user?.id || "anonymous",
        user_email: user?.email || null,
        user_role: user?.role || null,
        session_id: getSessionId(),
        timestamp: new Date().toISOString(),
        ...getBrowserContext(),
      };

      await onSubmit(payload);
      setSubmitted(true);
    } catch (_e) {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={s.overlay}>
        <div style={s.modal}>
          <p style={s.thanks}>✅ Feedback received. Thank you.</p>
          <button style={s.btn} onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.heading}>Report Feedback</h2>
          <button style={s.close} onClick={onClose}>✕</button>
        </div>

        {/* Honeypot */}
        <input ref={honeypotRef} name="_hp" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

        <div style={s.row}>
          {TYPE_OPTIONS.map(t => (
            <button key={t} style={type === t ? s.chipOn : s.chip} onClick={() => setType(t)}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <div style={s.row}>
          {SEVERITY_OPTIONS.map(sv => (
            <button key={sv} style={severity === sv ? s.chipOn : s.chip} onClick={() => setSeverity(sv)}>
              {SEV_LABEL[sv]}
            </button>
          ))}
        </div>

        <input style={s.input} placeholder="Short title" value={title}
          maxLength={120} onChange={e => setTitle(e.target.value)} />

        <textarea style={{ ...s.input, height: 100, resize: "vertical" }}
          placeholder="What happened? What did you expect? Steps to reproduce..."
          value={description} onChange={e => setDescription(e.target.value)} />

        <label style={s.fileLabel}>
          📎 Attach screenshot (optional, max 5 MB)
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" style={{ display: "none" }}
            onChange={e => {
              const file = e.target.files?.[0] || null;
              if (file && !ALLOWED_MIME_RE.test(file.type)) {
                setError("Only image files (PNG, JPEG, GIF, WebP) are allowed.");
                return;
              }
              if (file && file.size > MAX_SCREENSHOT_BYTES) {
                setError("Screenshot must be under 5 MB.");
                return;
              }
              setError(null);
              setScreenshot(file);
            }} />
        </label>
        {screenshot && <span style={s.fileName}>{screenshot.name}</span>}

        {error && <p style={s.error}>{error}</p>}

        <div style={s.row}>
          <button style={s.btn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending…" : "Submit"}
          </button>
          <button style={s.btnSec} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Minimal inline styles — override with your design system
const s = {
  overlay:  { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  modal:    { background: "#fff", borderRadius: 12, padding: 28, width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  header:   { display: "flex", justifyContent: "space-between", alignItems: "center" },
  heading:  { fontSize: 18, fontWeight: 700, margin: 0 },
  close:    { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#666" },
  row:      { display: "flex", gap: 8, flexWrap: "wrap" },
  chip:     { padding: "6px 14px", borderRadius: 20, border: "1px solid #ddd", cursor: "pointer", background: "#f5f5f5", fontSize: 13 },
  chipOn:   { padding: "6px 14px", borderRadius: 20, border: "1px solid #111", cursor: "pointer", background: "#111", color: "#fff", fontSize: 13 },
  input:    { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" },
  fileLabel:{ fontSize: 13, color: "#555", cursor: "pointer" },
  fileName: { fontSize: 12, color: "#888" },
  error:    { color: "#c00", fontSize: 13 },
  thanks:   { fontSize: 16, textAlign: "center" },
  btn:      { padding: "10px 24px", borderRadius: 8, background: "#111", color: "#fff", border: "none", cursor: "pointer", fontSize: 14 },
  btnSec:   { padding: "10px 24px", borderRadius: 8, background: "#f5f5f5", color: "#333", border: "1px solid #ddd", cursor: "pointer", fontSize: 14 },
};
