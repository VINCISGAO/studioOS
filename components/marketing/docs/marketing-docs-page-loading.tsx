export function MarketingDocsPageLoading() {
  return (
    <div className="min-h-screen bg-[#f6f6f3]">
      <div className="flex w-full">
        <div className="hidden w-[248px] shrink-0 border-r border-zinc-200/80 bg-white md:block" />
        <div className="min-w-0 flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-40 rounded-[1.75rem] bg-white" />
            <div className="h-24 rounded-2xl bg-white/80" />
            <div className="h-24 rounded-2xl bg-white/80" />
            <div className="h-24 rounded-2xl bg-white/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
