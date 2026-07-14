export default function BrandCheckoutLoading() {
  return (
    <div className="w-full min-w-0 overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-6xl animate-pulse space-y-5">
        <div className="h-10 rounded-xl bg-zinc-100" aria-hidden />
        <div className="h-12 rounded-xl bg-zinc-100" aria-hidden />
        <div className="space-y-4">
          <div className="h-44 rounded-[1.75rem] bg-zinc-100" aria-hidden />
          <div className="h-64 rounded-[1.75rem] bg-zinc-100" aria-hidden />
          <div className="h-52 rounded-[1.75rem] bg-zinc-100" aria-hidden />
        </div>
      </div>
    </div>
  );
}
