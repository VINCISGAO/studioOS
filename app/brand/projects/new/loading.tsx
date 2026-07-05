export default function BrandWizardLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse">
      <div className="mb-8 space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="h-8 w-24 rounded-full bg-zinc-100" />
          ))}
        </div>
        <div className="h-10 w-72 rounded-xl bg-zinc-200" />
        <div className="mt-3 h-5 w-96 max-w-full rounded-lg bg-zinc-100" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-2xl bg-zinc-100" />
        <div className="h-80 rounded-2xl bg-zinc-100" />
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <div className="h-11 w-28 rounded-xl bg-zinc-100" />
        <div className="h-11 w-32 rounded-xl bg-violet-100" />
      </div>
    </div>
  );
}
