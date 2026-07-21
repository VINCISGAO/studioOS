"use client";

import { Loader2, Plus } from "lucide-react";
import { useFormStatus } from "react-dom";
import { createBlankCanvasAction } from "@/features/canvas/create-blank-canvas.action";

function SubmitButton({
  idleLabel,
  pendingLabel,
  variant = "primary"
}: {
  idleLabel: string;
  pendingLabel: string;
  variant?: "primary" | "ghost";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        variant === "primary"
          ? "inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
          : "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-60"
      }
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export function CreateBlankCanvasButton({
  idleLabel,
  pendingLabel,
  variant = "primary"
}: {
  idleLabel: string;
  pendingLabel: string;
  variant?: "primary" | "ghost";
}) {
  return (
    <form action={createBlankCanvasAction}>
      <SubmitButton idleLabel={idleLabel} pendingLabel={pendingLabel} variant={variant} />
    </form>
  );
}
