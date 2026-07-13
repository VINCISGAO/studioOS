"use client";

import { BrandCreativeBriefPrimarySections } from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections-primary";
import { BrandCreativeBriefSecondarySections } from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections-secondary";
import type { BriefSectionsProps } from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections-shared";

export type { BriefSectionsProps } from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections-shared";

export function BrandCreativeBriefSections(props: BriefSectionsProps) {
  return (
    <div className="space-y-6">
      {props.budgetOnly ? null : <BrandCreativeBriefPrimarySections {...props} />}
      <BrandCreativeBriefSecondarySections {...props} />
    </div>
  );
}
