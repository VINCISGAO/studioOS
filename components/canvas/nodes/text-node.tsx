"use client";

import { memo, useState } from "react";
import { Type } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import { CanvasNodeFrame } from "@/components/canvas/nodes/canvas-node-frame";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import { canvasNodePropsAreEqual } from "@/lib/canvas/canvas-node-memo";

function TextNodeView({ id, data, selected }: NodeProps<VincisCanvasNode>) {
  const [value, setValue] = useState(data.text ?? "");
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);

  return (
    <CanvasNodeFrame
      data={data}
      selected={selected}
      icon={<Type className="h-4 w-4" />}
      minWidth={220}
      minHeight={100}
    >
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => updateNodeData(id, { text: value })}
        maxLength={12000}
        className="nodrag nopan h-full min-h-[100px] w-full resize-none bg-white p-4 text-sm leading-6 text-zinc-700 outline-none"
        placeholder="输入文字…"
      />
    </CanvasNodeFrame>
  );
}

export const TextNode = memo(TextNodeView, canvasNodePropsAreEqual);
