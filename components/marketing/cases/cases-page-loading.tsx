export function CasesPageLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FAFAFA_0%,#F5F5F5_100%)]">
      <div className="border-b border-zinc-200/80 bg-white">
        <div className="marketing-content-shell h-16 animate-pulse bg-zinc-100/40" />
      </div>
      <div className="marketing-content-shell py-8 sm:py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-56 rounded-[1.75rem] bg-white" />
          <div className="flex gap-2">
            <div className="h-10 w-20 rounded-full bg-white" />
            <div className="h-10 w-24 rounded-full bg-white" />
            <div className="h-10 w-24 rounded-full bg-white" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-56 rounded-2xl bg-white" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
