"use client";

import { useMemo, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import type { CanvasNodeData } from "@/lib/canvas/types";
import { useCanvasNodeActions } from "@/components/canvas/canvas-node-actions-context";
import { MusicNodeAudioPlayer } from "@/components/canvas/nodes/music-node-audio-player";
import { MusicRegenerateConfirmDialog } from "@/components/canvas/nodes/music-regenerate-confirm-dialog";
import { MusicNodeReadyHeader } from "@/components/canvas/nodes/music-node-ready-header";
import {
  canDownloadCanvasNode,
  triggerCanvasNodeDownload
} from "@/lib/canvas/node-download";
import {
  canRegenerateMusicNode,
  resolveMusicRegenerateCreditsFromData
} from "@/lib/canvas/music-regenerate";
import { MUSIC_NODE_READY_UI, musicNodeCopy } from "@/lib/canvas/music-node-design";
import { cn } from "@/lib/utils";

export function MusicNodeReadyView({
  nodeId,
  data
}: {
  nodeId: string;
  data: CanvasNodeData;
}) {
  const t = musicNodeCopy.zh;
  const actions = useCanvasNodeActions();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canDownload = canDownloadCanvasNode(data);
  const canRegenerate = canRegenerateMusicNode(data);
  const regenerateCredits = useMemo(
    () => resolveMusicRegenerateCreditsFromData(data, data.generationModel),
    [data]
  );

  return (
    <>
      <div className={MUSIC_NODE_READY_UI.body}>
        <MusicNodeReadyHeader title={data.title || t.title} subtitle={t.readySubtitle} />

        {data.url ? (
          <div className={cn(MUSIC_NODE_READY_UI.sectionGap, MUSIC_NODE_READY_UI.playerShell)}>
            <MusicNodeAudioPlayer variant="ready" url={data.url} />
          </div>
        ) : null}

        <div className={MUSIC_NODE_READY_UI.footer}>
          <button
            type="button"
            disabled={!canRegenerate}
            onClick={() => setConfirmOpen(true)}
            className={MUSIC_NODE_READY_UI.regenerateButton}
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            {t.regenerate}
          </button>
          <button
            type="button"
            disabled={!canDownload}
            onClick={() => triggerCanvasNodeDownload(data)}
            className={MUSIC_NODE_READY_UI.downloadButton}
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            {t.download}
          </button>
        </div>
      </div>

      <MusicRegenerateConfirmDialog
        open={confirmOpen}
        credits={regenerateCredits}
        onOpenChange={setConfirmOpen}
        onConfirm={() => actions?.regenerate(nodeId)}
      />
    </>
  );
}

export { MusicNodeIdleView, MusicNodeFailedView } from "@/components/canvas/nodes/music-node-ready-states";
