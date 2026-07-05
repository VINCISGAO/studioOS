export default function BrandHomeLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-4">
        <div className="h-9 w-64 rounded-xl bg-zinc-200" />
        <div className="h-5 w-48 rounded-lg bg-zinc-100" />
        <div className="flex gap-3">
          <div className="h-12 w-40 rounded-2xl bg-violet-100" />
          <div className="h-12 w-36 rounded-2xl bg-zinc-100" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-28 rounded-2xl bg-zinc-100" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-zinc-100" />
    </div>
  );
}
