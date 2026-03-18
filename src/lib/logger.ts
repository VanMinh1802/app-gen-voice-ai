/**
 * Production Logger
 * A logger that respects the environment - only logs in development mode
 * In production, all logs are silenced unless it's an error
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
}

/**
 * Create a namespaced logger
 */
export function createLogger(namespace: string): Logger {
  const isDev = process.env.NODE_ENV === "development";
  const prefix = `[${namespace}]`;

  const format = (level: LogLevel, args: unknown[]): unknown[] => {
    const timestamp = new Date().toISOString();
    return [`${timestamp} ${level.toUpperCase()} ${prefix}`, ...args];
  };

  return {
    debug: (...args: unknown[]) => {
      if (isDev) {
        console.debug(...format("debug", args));
      }
    },
    info: (...args: unknown[]) => {
      if (isDev) {
        console.info(...format("info", args));
      }
    },
    warn: (...args: unknown[]) => {
      // Warnings shown in both dev and production
      console.warn(...format("warn", args));
    },
    error: (...args: unknown[]) => {
      // Errors shown in both dev and production
      console.error(...format("error", args));
    },
    group: (label: string) => {
      if (isDev) {
        console.group(`${prefix} ${label}`);
      }
    },
    groupEnd: () => {
      if (isDev) {
        console.groupEnd();
      }
    },
  };
}

// Default logger instance
export const logger = createLogger("app");

/**
 * Analytics logger - for tracking events in production
 * This is a placeholder for actual analytics implementation
 */
export const analytics = {
  track: (event: string, properties?: Record<string, unknown>) => {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.info(`[Analytics] Track: ${event}`, properties);
    }
    // In production, this would send to analytics service
  },
  identify: (userId: string, traits?: Record<string, unknown>) => {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.info(`[Analytics] Identify: ${userId}`, traits);
    }
    // In production, this would send to analytics service
  },
  page: (pageName: string) => {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.info(`[Analytics] Page: ${pageName}`);
    }
    // In production, this would send to analytics service
  },
};
