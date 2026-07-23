import "server-only";

import { after } from "next/server";
import { logger } from "@/lib/core/logger";

export function scheduleCanvasBackgroundWork(label: string, run: () => void) {
  const execute = () => {
    try {
      run();
    } catch (error) {
      logger.error("Canvas background work failed to start", {
        label,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  if (process.env.NODE_ENV === "development") {
    queueMicrotask(execute);
    return;
  }

  try {
    after(execute);
  } catch {
    execute();
  }
}
