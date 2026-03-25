import { describe, it, expect, vi } from "vitest";
import { buildPayload } from "../src/payload.js";

// Mock uuid to return predictable values
vi.mock("uuid", () => ({ v4: () => "mock-uuid-1234" }));

const config = {
  appName: "vetceedr",
  microservice: "frontend",
  environment: "staging",
};

describe("buildPayload", () => {
  describe("structure", () => {
    it("contains all required keys", () => {
      const payload = buildPayload(config, { title: "Test" });
      const keys = Object.keys(payload);
      expect(keys).toContain("submission_type");
      expect(keys).toContain("timestamp");
      expect(keys).toContain("session_id");
      expect(keys).toContain("app_name");
      expect(keys).toContain("microservice");
      expect(keys).toContain("environment");
      expect(keys).toContain("type");
      expect(keys).toContain("severity");
      expect(keys).toContain("title");
      expect(keys).toContain("description");
      expect(keys).toContain("user_id");
      expect(keys).toContain("sentry_event_id");
      expect(keys).toContain("screenshot_url");
    });

    it("sets app context from config", () => {
      const payload = buildPayload(config);
      expect(payload.app_name).toBe("vetceedr");
      expect(payload.microservice).toBe("frontend");
      expect(payload.environment).toBe("staging");
    });

    it("generates ISO timestamp", () => {
      const payload = buildPayload(config);
      expect(() => new Date(payload.timestamp)).not.toThrow();
      expect(payload.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("defaults", () => {
    it("defaults submission_type to programmatic", () => {
      const payload = buildPayload(config);
      expect(payload.submission_type).toBe("programmatic");
    });

    it("defaults type to bug", () => {
      const payload = buildPayload(config);
      expect(payload.type).toBe("bug");
    });

    it("defaults severity to high", () => {
      const payload = buildPayload(config);
      expect(payload.severity).toBe("high");
    });

    it("defaults user_id to anonymous", () => {
      const payload = buildPayload(config);
      expect(payload.user_id).toBe("anonymous");
    });

    it("generates session_id when not provided", () => {
      const payload = buildPayload(config);
      expect(payload.session_id).toBeTruthy();
    });

    it("defaults optional fields to null", () => {
      const payload = buildPayload(config);
      expect(payload.user_email).toBeNull();
      expect(payload.user_role).toBeNull();
      expect(payload.sentry_event_id).toBeNull();
      expect(payload.error_message).toBeNull();
      expect(payload.stack_trace).toBeNull();
      expect(payload.screenshot_url).toBeNull();
    });
  });

  describe("overrides", () => {
    it("accepts submission type override", () => {
      const payload = buildPayload(config, { submissionType: "user" });
      expect(payload.submission_type).toBe("user");
    });

    it("accepts type override", () => {
      const payload = buildPayload(config, { type: "cosmetic" });
      expect(payload.type).toBe("cosmetic");
    });

    it("accepts severity override", () => {
      const payload = buildPayload(config, { severity: "critical" });
      expect(payload.severity).toBe("critical");
    });

    it("accepts user context", () => {
      const payload = buildPayload(config, {
        userId: "u1",
        userEmail: "u@test.com",
        userRole: "vet",
      });
      expect(payload.user_id).toBe("u1");
      expect(payload.user_email).toBe("u@test.com");
      expect(payload.user_role).toBe("vet");
    });

    it("accepts session_id override", () => {
      const payload = buildPayload(config, { sessionId: "my-session" });
      expect(payload.session_id).toBe("my-session");
    });

    it("accepts error fields", () => {
      const payload = buildPayload(config, {
        errorMessage: "boom",
        stackTrace: "Error: boom\n  at...",
        sentryEventId: "abc123",
      });
      expect(payload.error_message).toBe("boom");
      expect(payload.stack_trace).toBe("Error: boom\n  at...");
      expect(payload.sentry_event_id).toBe("abc123");
    });

    it("accepts page override", () => {
      const payload = buildPayload(config, { page: "/dashboard" });
      expect(payload.page).toBe("/dashboard");
    });

    it("accepts screenshot_url", () => {
      const payload = buildPayload(config, {
        screenshotUrl: "https://cdn.example.com/shot.png",
      });
      expect(payload.screenshot_url).toBe("https://cdn.example.com/shot.png");
    });
  });

  describe("SSR safety", () => {
    it("handles missing window/sessionStorage (Node.js)", () => {
      // In Node.js test env, window and sessionStorage are undefined
      // buildPayload should still work without error
      const payload = buildPayload(config, { title: "SSR test" });
      expect(payload.title).toBe("SSR test");
      expect(payload.session_id).toBeTruthy();
    });
  });
});
