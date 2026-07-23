export default function StudioReviewOrderLoading() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-12 rounded-2xl bg-zinc-100" />
      <div className="aspect-video rounded-2xl bg-zinc-200" />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-64 rounded-2xl bg-zinc-100" />
        <div className="h-64 rounded-2xl bg-zinc-100" />
      </div>
    </div>
  );
}
