import { redirectToCanvasEditor } from "@/features/canvas/create-blank-canvas.action";

export default async function StudioCanvasEnterPage() {
  await redirectToCanvasEditor();
}
