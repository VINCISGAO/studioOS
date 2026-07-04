"use client";

import { useEffect, useState } from "react";
import { AiCopilotDrawer } from "@/components/ai-copilot/ai-copilot-drawer";

export function AiCopilotRoot() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <AiCopilotDrawer />;
}
