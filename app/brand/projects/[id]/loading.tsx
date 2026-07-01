import { BrandCreatorGlobeMatchingLoader } from "@/components/studioos/brand-creator-globe-matching-loader";

export default function BrandProjectHubLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="h-5 w-28 animate-pulse rounded bg-zinc-100" aria-hidden />
      <BrandCreatorGlobeMatchingLoader locale="zh" compact />
    </div>
  );
}
