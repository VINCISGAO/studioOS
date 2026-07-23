export default function StudioIncomeLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-48 rounded-xl bg-zinc-200" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 rounded-2xl bg-zinc-100" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-zinc-100" />
    </div>
  );
}
