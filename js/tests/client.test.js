import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to test the module's internal state, so we re-import fresh each time
// by resetting modules between tests
let sendPayload, sendPayloadFireAndForget;

// Mock global fetch
const mockFetch = vi.fn(() => Promise.resolve({ ok: true }));
vi.stubGlobal("fetch", mockFetch);

describe("client", () => {
  beforeEach(async () => {
    // Reset module state (dedup map) by re-importing
    vi.resetModules();
    mockFetch.mockClear();
    const mod = await import("../src/client.js");
    sendPayload = mod.sendPayload;
    sendPayloadFireAndForget = mod.sendPayloadFireAndForget;
  });

  const config = {
    url: "https://feedback.example.com",
    apiKey: "test-key",
  };

  function payload(overrides = {}) {
    return {
      user_id: "u1",
      page: "/test",
      description: "test error",
      ...overrides,
    };
  }

  describe("sendPayload", () => {
    it("calls fetch with correct URL", async () => {
      await sendPayload(config, payload());
      expect(mockFetch).toHaveBeenCalledWith(
        "https://feedback.example.com/feedback",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("sends correct headers", async () => {
      await sendPayload(config, payload());
      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers["Content-Type"]).toBe("application/json");
      expect(callArgs.headers["X-Api-Key"]).toBe("test-key");
    });

    it("sends payload as JSON body", async () => {
      const p = payload();
      await sendPayload(config, p);
      const callArgs = mockFetch.mock.calls[0][1];
      expect(JSON.parse(callArgs.body)).toEqual(p);
    });

    it("uses keepalive flag", async () => {
      await sendPayload(config, payload());
      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.keepalive).toBe(true);
    });

    it("suppresses fetch errors silently", async () => {
      mockFetch.mockRejectedValueOnce(new Error("network down"));
      // Should not throw
      await sendPayload(config, payload());
    });
  });

  describe("deduplication", () => {
    it("sends first payload", async () => {
      await sendPayload(config, payload());
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("blocks identical second payload", async () => {
      const p = payload();
      await sendPayload(config, p);
      await sendPayload(config, p);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("allows different user_id", async () => {
      await sendPayload(config, payload({ user_id: "u1" }));
      await sendPayload(config, payload({ user_id: "u2" }));
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("allows different page", async () => {
      await sendPayload(config, payload({ page: "/a" }));
      await sendPayload(config, payload({ page: "/b" }));
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("allows different description", async () => {
      await sendPayload(config, payload({ description: "error A" }));
      await sendPayload(config, payload({ description: "error B" }));
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("sendPayloadFireAndForget", () => {
    it("does not throw even if fetch fails", () => {
      mockFetch.mockRejectedValueOnce(new Error("network down"));
      expect(() => sendPayloadFireAndForget(config, payload())).not.toThrow();
    });
  });
});
