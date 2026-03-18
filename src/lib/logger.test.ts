import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger, logger, analytics } from "@/lib/logger";

describe("logger", () => {
  let originalEnv: string | undefined;
  let consoleSpy: {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    group: ReturnType<typeof vi.fn>;
    groupEnd: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    consoleSpy = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      group: vi.fn(),
      groupEnd: vi.fn(),
    };
    // Use vi.spyOn instead of stubbing global
    vi.spyOn(console, "debug").mockImplementation(consoleSpy.debug as any);
    vi.spyOn(console, "info").mockImplementation(consoleSpy.info as any);
    vi.spyOn(console, "warn").mockImplementation(consoleSpy.warn as any);
    vi.spyOn(console, "error").mockImplementation(consoleSpy.error as any);
    vi.spyOn(console, "group").mockImplementation(consoleSpy.group as any);
    vi.spyOn(console, "groupEnd").mockImplementation(consoleSpy.groupEnd as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalEnv) {
      process.env.NODE_ENV = originalEnv;
    }
  });

  describe("createLogger", () => {
    it("creates a logger with correct namespace", () => {
      const testLogger = createLogger("test");
      expect(testLogger).toBeDefined();
    });

    describe("in development mode", () => {
      beforeEach(() => {
        process.env.NODE_ENV = "development";
      });

      it("logs debug messages", () => {
        const testLogger = createLogger("test");
        testLogger.debug("debug message");
        expect(consoleSpy.debug).toHaveBeenCalled();
      });

      it("logs info messages", () => {
        const testLogger = createLogger("test");
        testLogger.info("info message");
        expect(consoleSpy.info).toHaveBeenCalled();
      });

      it("logs warn messages", () => {
        const testLogger = createLogger("test");
        testLogger.warn("warn message");
        expect(consoleSpy.warn).toHaveBeenCalled();
      });

      it("logs error messages", () => {
        const testLogger = createLogger("test");
        testLogger.error("error message");
        expect(consoleSpy.error).toHaveBeenCalled();
      });

      it("groups logs", () => {
        const testLogger = createLogger("test");
        testLogger.group("test group");
        expect(consoleSpy.group).toHaveBeenCalled();
      });

      it("ends log groups", () => {
        const testLogger = createLogger("test");
        testLogger.groupEnd();
        expect(consoleSpy.groupEnd).toHaveBeenCalled();
      });
    });

    describe("in production mode", () => {
      beforeEach(() => {
        process.env.NODE_ENV = "production";
      });

      it("does not log debug messages in production", () => {
        const testLogger = createLogger("test");
        testLogger.debug("debug message");
        expect(consoleSpy.debug).not.toHaveBeenCalled();
      });

      it("does not log info messages in production", () => {
        const testLogger = createLogger("test");
        testLogger.info("info message");
        expect(consoleSpy.info).not.toHaveBeenCalled();
      });

      it("logs warn messages in production", () => {
        const testLogger = createLogger("test");
        testLogger.warn("warn message");
        expect(consoleSpy.warn).toHaveBeenCalled();
      });

      it("logs error messages in production", () => {
        const testLogger = createLogger("test");
        testLogger.error("error message");
        expect(consoleSpy.error).toHaveBeenCalled();
      });
    });
  });

  describe("default logger", () => {
    it("is defined", () => {
      expect(logger).toBeDefined();
    });
  });

  describe("analytics", () => {
    describe("in development mode", () => {
      beforeEach(() => {
        process.env.NODE_ENV = "development";
      });

      it("logs track events", () => {
        analytics.track("test_event", { key: "value" });
        expect(consoleSpy.info).toHaveBeenCalledWith(
          "[Analytics] Track: test_event",
          { key: "value" }
        );
      });

      it("logs identify calls", () => {
        analytics.identify("user123", { name: "Test" });
        expect(consoleSpy.info).toHaveBeenCalledWith(
          "[Analytics] Identify: user123",
          { name: "Test" }
        );
      });

      it("logs page calls", () => {
        analytics.page("/home");
        expect(consoleSpy.info).toHaveBeenCalledWith(
          "[Analytics] Page: /home"
        );
      });
    });

    describe("in production mode", () => {
      beforeEach(() => {
        process.env.NODE_ENV = "production";
      });

      it("does not log track events", () => {
        analytics.track("test_event");
        expect(consoleSpy.info).not.toHaveBeenCalled();
      });

      it("does not log identify calls", () => {
        analytics.identify("user123");
        expect(consoleSpy.info).not.toHaveBeenCalled();
      });

      it("does not log page calls", () => {
        analytics.page("/home");
        expect(consoleSpy.info).not.toHaveBeenCalled();
      });
    });
  });
});
