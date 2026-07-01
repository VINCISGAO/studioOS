export default function BrandCheckoutLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-zinc-100" aria-hidden />
        <div className="h-9 w-64 max-w-full rounded-xl bg-zinc-100" aria-hidden />
        <div className="h-4 w-96 max-w-full rounded bg-zinc-100" aria-hidden />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-2xl bg-zinc-100" aria-hidden />
        <div className="h-80 rounded-2xl bg-zinc-100" aria-hidden />
      </div>
    </div>
  );
}
