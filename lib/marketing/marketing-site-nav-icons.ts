import { BookMarked, Box, CircleHelp, FileText, Flower2, Info, Tag, type LucideIcon } from "lucide-react";
import type { MarketingSiteNavKey } from "@/lib/marketing/marketing-site-nav";

export const MARKETING_SITE_NAV_ICONS: Record<MarketingSiteNavKey, LucideIcon> = {
  about: Info,
  process: Flower2,
  cases: FileText,
  pricing: Tag,
  resources: Box,
  faq: CircleHelp,
  knowledge: BookMarked
};
