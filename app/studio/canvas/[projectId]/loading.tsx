export default function StudioCanvasProjectLoading() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] animate-pulse flex-col gap-4 p-4">
      <div className="h-12 rounded-2xl bg-zinc-100" />
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="hidden w-72 rounded-2xl bg-zinc-100 lg:block" />
        <div className="min-h-0 flex-1 rounded-2xl bg-zinc-100" />
        <div className="hidden w-80 rounded-2xl bg-zinc-100 xl:block" />
      </div>
    </div>
  );
}
