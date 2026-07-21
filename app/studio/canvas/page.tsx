import { CanvasListBoard } from "@/components/canvas/canvas-list-board";
import { listCanvasHomeAction } from "@/features/canvas/canvas.actions";
import { getAppUiLocale } from "@/lib/app-language";

export default async function StudioCanvasIndexPage() {
  const [locale, home] = await Promise.all([getAppUiLocale(), listCanvasHomeAction()]);

  return (
    <div className="h-full overflow-y-auto bg-[#f7f7f6] px-5 py-8 sm:px-8 lg:px-10">
      <CanvasListBoard locale={locale} recentCanvases={home.recentCanvases} />
    </div>
  );
}
