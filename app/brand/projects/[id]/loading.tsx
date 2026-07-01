export default function BrandProjectHubLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6">
      <div className="h-5 w-28 rounded bg-zinc-100" aria-hidden />
      <div className="h-10 w-72 max-w-full rounded-xl bg-zinc-100" aria-hidden />
      <div className="h-40 rounded-2xl bg-zinc-100" aria-hidden />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-2xl bg-zinc-100" aria-hidden />
        <div className="h-56 rounded-2xl bg-zinc-100" aria-hidden />
      </div>
    </div>
  );
}
