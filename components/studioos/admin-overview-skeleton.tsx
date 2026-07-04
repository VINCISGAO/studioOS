import { Card, CardContent } from "@/components/ui/card";

export function AdminOverviewSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="border-zinc-200/80 shadow-none">
            <CardContent className="p-5">
              <div className="h-4 w-24 rounded bg-zinc-200" />
              <div className="mt-3 h-8 w-32 rounded bg-zinc-200" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="h-80 rounded-xl border border-zinc-200 bg-zinc-100" />
        <div className="h-80 rounded-xl border border-zinc-200 bg-zinc-100" />
      </div>
    </div>
  );
}
