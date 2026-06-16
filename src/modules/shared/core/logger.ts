import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "unknown",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createLogger(moduleName: string) {
  return logger.child({ module: moduleName });
}
