export function marketingHeadlineClassName(locale: "en" | "zh") {
  return locale === "en" ? "font-marketing-headline" : undefined;
}

/** Vertical silver metallic gradient for cinematic hero headlines. */
export function marketingSilverGradientClassName() {
  return "bg-[linear-gradient(180deg,#FFFFFF_0%,#ECEEF2_36%,#B8BEC8_100%)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]";
}
