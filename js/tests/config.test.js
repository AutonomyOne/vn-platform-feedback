import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getConfig } from "../src/config.js";

const VALID_ENV = {
  FEEDBACK_SERVICE_URL: "https://feedback.example.com",
  FEEDBACK_API_KEY: "test-key-123",
  FEEDBACK_APP_NAME: "vetceedr",
  FEEDBACK_MICROSERVICE: "frontend",
};

function setEnv(overrides = {}) {
  const env = { ...VALID_ENV, ...overrides };
  for (const [k, v] of Object.entries(env)) {
    process.env[k] = v;
  }
}

function clearEnv() {
  for (const key of Object.keys(process.env)) {
    if (key.includes("FEEDBACK_")) delete process.env[key];
  }
}

describe("getConfig", () => {
  beforeEach(clearEnv);
  afterEach(clearEnv);

  describe("loads env vars correctly", () => {
    it("reads all required vars", () => {
      setEnv();
      const cfg = getConfig();
      expect(cfg.url).toBe("https://feedback.example.com");
      expect(cfg.apiKey).toBe("test-key-123");
      expect(cfg.appName).toBe("vetceedr");
      expect(cfg.microservice).toBe("frontend");
    });

    it("strips trailing slashes from URL", () => {
      setEnv({ FEEDBACK_SERVICE_URL: "https://feedback.example.com///" });
      const cfg = getConfig();
      expect(cfg.url).toBe("https://feedback.example.com");
    });

    it("defaults environment to staging", () => {
      setEnv();
      const cfg = getConfig();
      expect(cfg.environment).toBe("staging");
    });

    it("reads FEEDBACK_ENV override", () => {
      setEnv({ FEEDBACK_ENV: "production" });
      const cfg = getConfig();
      expect(cfg.environment).toBe("production");
    });
  });

  describe("NEXT_PUBLIC_ prefix", () => {
    it("reads NEXT_PUBLIC_ prefixed vars", () => {
      process.env.NEXT_PUBLIC_FEEDBACK_SERVICE_URL = "https://next.example.com";
      process.env.NEXT_PUBLIC_FEEDBACK_API_KEY = "next-key";
      process.env.NEXT_PUBLIC_FEEDBACK_APP_NAME = "nextapp";
      process.env.NEXT_PUBLIC_FEEDBACK_MICROSERVICE = "frontend";
      const cfg = getConfig();
      expect(cfg.url).toBe("https://next.example.com");
      expect(cfg.apiKey).toBe("next-key");
    });
  });

  describe("missing vars", () => {
    it("throws on missing FEEDBACK_SERVICE_URL", () => {
      setEnv();
      delete process.env.FEEDBACK_SERVICE_URL;
      expect(() => getConfig()).toThrow("FEEDBACK_SERVICE_URL");
    });

    it("throws on missing FEEDBACK_API_KEY", () => {
      setEnv();
      delete process.env.FEEDBACK_API_KEY;
      expect(() => getConfig()).toThrow("FEEDBACK_API_KEY");
    });

    it("throws on missing FEEDBACK_APP_NAME", () => {
      setEnv();
      delete process.env.FEEDBACK_APP_NAME;
      expect(() => getConfig()).toThrow("FEEDBACK_APP_NAME");
    });

    it("throws on missing FEEDBACK_MICROSERVICE", () => {
      setEnv();
      delete process.env.FEEDBACK_MICROSERVICE;
      expect(() => getConfig()).toThrow("FEEDBACK_MICROSERVICE");
    });

    it("lists all missing vars in error message", () => {
      expect(() => getConfig()).toThrow(/FEEDBACK_SERVICE_URL.*FEEDBACK_API_KEY/);
    });
  });

  describe("URL validation", () => {
    it("rejects malformed URL", () => {
      setEnv({ FEEDBACK_SERVICE_URL: "not-a-url" });
      expect(() => getConfig()).toThrow("not a valid URL");
    });

    it("accepts valid https URL", () => {
      setEnv({ FEEDBACK_SERVICE_URL: "https://feedback.example.com" });
      const cfg = getConfig();
      expect(cfg.url).toBe("https://feedback.example.com");
    });

    it("accepts localhost URL", () => {
      setEnv({ FEEDBACK_SERVICE_URL: "http://localhost:8000" });
      const cfg = getConfig();
      expect(cfg.url).toBe("http://localhost:8000");
    });
  });
});
