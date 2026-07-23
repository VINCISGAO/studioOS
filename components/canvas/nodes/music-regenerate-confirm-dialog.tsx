"use client";

import { Music2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import {
  MUSIC_NODE_REGENERATE_DIALOG,
  musicNodeCopy
} from "@/lib/canvas/music-node-design";

function RegenerateConfirmBody({ credits }: { credits: number }) {
  const t = musicNodeCopy.zh;

  return (
    <DialogDescription asChild>
      <p className={MUSIC_NODE_REGENERATE_DIALOG.body}>
        {t.regenerateConfirmLead}
        <span className={MUSIC_NODE_REGENERATE_DIALOG.credits}>
          {t.regenerateConfirmCredits(credits)}
        </span>
        {t.regenerateConfirmTail}
      </p>
    </DialogDescription>
  );
}

export function MusicRegenerateConfirmDialog({
  open,
  credits,
  onOpenChange,
  onConfirm
}: {
  open: boolean;
  credits: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = musicNodeCopy.zh;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={MUSIC_NODE_REGENERATE_DIALOG.shell}>
        <div className={MUSIC_NODE_REGENERATE_DIALOG.header}>
          <div className={MUSIC_NODE_REGENERATE_DIALOG.headerMain}>
            <span className={MUSIC_NODE_REGENERATE_DIALOG.icon}>
              <Music2 className={MUSIC_NODE_REGENERATE_DIALOG.iconGlyph} strokeWidth={2.25} />
            </span>
            <DialogTitle className={MUSIC_NODE_REGENERATE_DIALOG.title}>
              {t.regenerateConfirmTitle}
            </DialogTitle>
          </div>
          <button
            type="button"
            aria-label={t.regenerateCancel}
            onClick={() => onOpenChange(false)}
            className={MUSIC_NODE_REGENERATE_DIALOG.closeButton}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        </div>

        <RegenerateConfirmBody credits={credits} />

        <div className={MUSIC_NODE_REGENERATE_DIALOG.footer}>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={MUSIC_NODE_REGENERATE_DIALOG.cancelButton}
          >
            {t.regenerateCancel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={MUSIC_NODE_REGENERATE_DIALOG.confirmButton}
          >
            {t.regenerateConfirm}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
