type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

type LogFields = {
  requestId?: string;
  userId?: string;
  campaignId?: string;
  service?: string;
  latency?: number;
  [key: string]: unknown;
};

function write(level: LogLevel, message: string, fields?: LogFields) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields
  };

  if (process.env.NODE_ENV === "production") {
    // Structured JSON for production log collectors
    console.info(JSON.stringify(payload));
    return;
  }

  const prefix = `[${level.toUpperCase()}]`;
  if (fields && Object.keys(fields).length > 0) {
    console.info(prefix, message, fields);
  } else {
    console.info(prefix, message);
  }
}

export const logger = {
  trace: (message: string, fields?: LogFields) => write("trace", message, fields),
  debug: (message: string, fields?: LogFields) => write("debug", message, fields),
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
  fatal: (message: string, fields?: LogFields) => write("fatal", message, fields)
};
