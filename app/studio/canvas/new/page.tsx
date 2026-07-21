import { redirectToNewBlankCanvas } from "@/features/canvas/create-blank-canvas.action";

export default async function StudioCanvasNewPage() {
  await redirectToNewBlankCanvas();
}
