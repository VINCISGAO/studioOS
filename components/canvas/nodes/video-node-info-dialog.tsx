"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart3, Copy, X } from "lucide-react";
import {
  VIDEO_NODE_INFO_DIALOG,
  videoNodeReadyCopy
} from "@/lib/canvas/video-node-ready-design";
import type { VideoNodeMetadata } from "@/lib/canvas/video-node-metadata";
import { CANVAS_GENERATION_MODAL_Z_INDEX } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";

export function VideoNodeInfoDialog({
  locale,
  open,
  previewUrl,
  metadata,
  onClose
}: {
  locale: Locale;
  open: boolean;
  previewUrl?: string;
  metadata: VideoNodeMetadata;
  onClose: () => void;
}) {
  const t = videoNodeReadyCopy[locale];
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open) return null;

  async function copyPrompt() {
    if (!metadata.prompt) return;
    try {
      await navigator.clipboard.writeText(metadata.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-start justify-center p-4 pt-[12vh]"
      style={{ zIndex: CANVAS_GENERATION_MODAL_Z_INDEX }}
      onPointerDown={onClose}
    >
      <div
        className={VIDEO_NODE_INFO_DIALOG.shell}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className={VIDEO_NODE_INFO_DIALOG.header}>
          <div className={VIDEO_NODE_INFO_DIALOG.headerMain}>
            {previewUrl ? (
              <video
                src={previewUrl}
                muted
                playsInline
                preload="metadata"
                className={VIDEO_NODE_INFO_DIALOG.thumb}
              />
            ) : (
              <div className={VIDEO_NODE_INFO_DIALOG.thumb} />
            )}
            <h3 className={VIDEO_NODE_INFO_DIALOG.title}>{t.generatorTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={VIDEO_NODE_INFO_DIALOG.closeButton}
            aria-label={t.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={VIDEO_NODE_INFO_DIALOG.body}>
          <div>
            <div className={VIDEO_NODE_INFO_DIALOG.fieldLabelRow}>
              <span className={VIDEO_NODE_INFO_DIALOG.fieldLabel}>{t.promptLabel}</span>
              <button
                type="button"
                onClick={() => void copyPrompt()}
                className={VIDEO_NODE_INFO_DIALOG.copyButton}
                aria-label={t.copyPrompt}
                title={copied ? t.copied : t.copyPrompt}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className={VIDEO_NODE_INFO_DIALOG.promptText}>
              {metadata.prompt || "—"}
            </p>
          </div>

          <div>
            <div className={VIDEO_NODE_INFO_DIALOG.fieldLabel}>{t.modelLabel}</div>
            <div className={VIDEO_NODE_INFO_DIALOG.modelRow}>
              <BarChart3 className="h-4 w-4 text-zinc-700" />
              <span className={VIDEO_NODE_INFO_DIALOG.fieldValue}>{metadata.modelLabel}</span>
            </div>
          </div>

          <div>
            <div className={VIDEO_NODE_INFO_DIALOG.fieldLabel}>{t.aspectLabel}</div>
            <div className={VIDEO_NODE_INFO_DIALOG.fieldValue}>{metadata.aspectRatioLabel}</div>
          </div>

          <div>
            <div className={VIDEO_NODE_INFO_DIALOG.fieldLabel}>{t.durationLabel}</div>
            <div className={VIDEO_NODE_INFO_DIALOG.fieldValue}>{metadata.durationLabel}</div>
          </div>

          <div>
            <div className={VIDEO_NODE_INFO_DIALOG.fieldLabel}>{t.qualityLabel}</div>
            <div className={VIDEO_NODE_INFO_DIALOG.fieldValue}>{metadata.qualityLabel}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
