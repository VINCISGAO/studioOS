/** Static legacy path map (middleware + notification href normalization). */

export const STATIC_LEGACY_REDIRECTS: ReadonlyArray<{
  match: RegExp;
  target: (pathname: string, match: RegExpMatchArray) => string;
}> = [
  {
    match: /^\/creator\/onboarding\/?$/,
    target: () => "/studio/onboarding"
  },
  {
    match: /^\/projects\/?$/,
    target: () => "/brand/projects"
  },
  {
    match: /^\/projects\/([^/]+)\/?$/,
    target: (_pathname, groups) => `/brand/projects/${groups[1]}`
  },
  {
    match: /^\/match\/([^/]+)\/?$/,
    target: (_pathname, groups) => `/brand/projects/${groups[1]}/studios`
  },
  {
    match: /^\/workspace\/admin\/?$/,
    target: () => "/admin"
  },
  {
    match: /^\/workspace\/?$/,
    target: () => "/brand"
  },
  {
    match: /^\/dashboard\/?$/,
    target: () => "/brand"
  }
];

export function resolveStaticLegacyRedirect(pathname: string): string | null {
  for (const rule of STATIC_LEGACY_REDIRECTS) {
    const groups = pathname.match(rule.match);
    if (groups) {
      return rule.target(pathname, groups);
    }
  }
  return null;
}
