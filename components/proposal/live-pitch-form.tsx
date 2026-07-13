import { submitLivePitchAction } from "@/app/proposal-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n";
import { Video } from "lucide-react";

export function LivePitchForm({
  locale,
  inquiryId,
  disabled
}: {
  locale: Locale;
  inquiryId: string;
  disabled?: boolean;
}) {
  if (disabled) return null;

  return (
    <Card className="mt-4 border-violet-100 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 font-semibold">
          <Video className="h-4 w-4 text-violet-600" />
          Live Pitch
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {locale === "zh"
            ? "上传 60 秒视频链接 — 比长文字更有说服力。"
            : "Upload a 60s video pitch — more convincing than walls of text."}
        </p>
        <form action={submitLivePitchAction} className="mt-4 grid gap-3">
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="inquiry_id" value={inquiryId} />
          <div>
            <Label htmlFor="video_url">{locale === "zh" ? "视频链接" : "Video URL"}</Label>
            <Input
              id="video_url"
              name="video_url"
              type="url"
              placeholder="YouTube, Vimeo, Drive, or mp4 URL"
              required
            />
          </div>
          <div>
            <Label htmlFor="caption">{locale === "zh" ? "简短说明" : "Caption"}</Label>
            <Textarea
              id="caption"
              name="caption"
              rows={2}
              placeholder={
                locale === "zh"
                  ? "我们是某某创作者团队，建议这样开场..."
                  : "We're Studio X. Here's how we'd open the ad..."
              }
            />
          </div>
          <Button type="submit" variant="outline">
            {locale === "zh" ? "发送 Live Pitch" : "Send Live Pitch"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
