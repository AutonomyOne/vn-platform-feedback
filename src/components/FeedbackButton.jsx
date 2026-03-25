/**
 * FeedbackButton — floating trigger button.
 * Drop into your app root layout.
 *
 * React / Next.js:
 *   import { FeedbackButton } from 'platform-feedback/components'
 *   <FeedbackButton user={currentUser} />
 *
 * Vue equivalent is in integrations/vue-button.vue
 * Angular equivalent is in angular/feedback-button.component.ts
 */

import { useState } from "react";
import FeedbackModal from "./FeedbackModal.jsx";
import { getStoredConfig } from "../store.js";
import { buildPayload } from "../payload.js";
import { sendPayloadFireAndForget } from "../client.js";

export default function FeedbackButton({ user, style }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(payload) {
    const config = getStoredConfig();
    if (!config) return;
    const full = buildPayload(config, { ...payload, submissionType: "user" });
    sendPayloadFireAndForget(config, full);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ ...defaultStyle, ...style }}>
        🐛 Feedback
      </button>
      {open && (
        <FeedbackModal
          user={user}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}

const defaultStyle = {
  position: "fixed",
  bottom: 24,
  right: 24,
  zIndex: 9998,
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: 24,
  padding: "10px 18px",
  fontSize: 13,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
};
