import { JsonLdScript } from "@/lib/marketing/structured-data/json-ld-script";
import { buildHomepageJsonLdGraph } from "@/lib/marketing/structured-data/homepage";

export function HomePageJsonLd() {
  return <JsonLdScript data={buildHomepageJsonLdGraph()} />;
}
