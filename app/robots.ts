import type { MetadataRoute } from "next";
import { VINCIS_SITE_ORIGIN } from "@/lib/marketing/organization-schema";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/workspace/", "/brand", "/studio", "/login", "/signup"]
    },
    sitemap: `${VINCIS_SITE_ORIGIN}/sitemap.xml`,
    host: VINCIS_SITE_ORIGIN
  };
}
