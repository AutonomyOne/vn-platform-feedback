import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { detectFramework } from "../src/detector.js";

describe("detectFramework", () => {
  const originalWindow = globalThis.window;
  const originalProcess = globalThis.process;

  afterEach(() => {
    // Restore globals
    globalThis.process = originalProcess;
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  describe("Next.js detection", () => {
    it("detects via NEXT_RUNTIME env", () => {
      process.env.NEXT_RUNTIME = "nodejs";
      const result = detectFramework();
      delete process.env.NEXT_RUNTIME;
      expect(result).toBe("nextjs");
    });

    it("detects via window.__NEXT_DATA__", () => {
      globalThis.window = { __NEXT_DATA__: {} };
      expect(detectFramework()).toBe("nextjs");
    });
  });

  describe("Angular detection", () => {
    it("detects via window.ng", () => {
      globalThis.window = { ng: {} };
      globalThis.document = { querySelector: () => null };
      expect(detectFramework()).toBe("angular");
    });

    it("detects via ng-version attribute", () => {
      globalThis.window = {};
      globalThis.document = { querySelector: (sel) => sel === "[ng-version]" ? {} : null };
      expect(detectFramework()).toBe("angular");
    });
  });

  describe("Vue detection", () => {
    it("detects via window.__VUE__", () => {
      globalThis.window = { __VUE__: true };
      globalThis.document = { querySelector: () => null };
      expect(detectFramework()).toBe("vue");
    });
  });

  describe("Express detection", () => {
    it("detects Node.js without window as express", () => {
      delete globalThis.window;
      expect(detectFramework()).toBe("express");
    });
  });

  describe("Browser fallback", () => {
    it("returns browser when window exists but no framework markers", () => {
      globalThis.window = {};
      globalThis.document = { querySelector: () => null };
      expect(detectFramework()).toBe("browser");
    });
  });
});
