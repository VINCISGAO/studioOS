export type WorkEngagementSnapshot = {
  likeCount: number;
  likedByMe: boolean;
  views: number;
};

function hashSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function baseViewCount(workId: string) {
  const seed = hashSeed(workId);
  return 8_000 + (seed % 90_000);
}

export function seedWorkViews(workId: string) {
  return formatEngagementCount(baseViewCount(workId));
}

export function seedWorkDuration(workId: string) {
  const seconds = 18 + (hashSeed(workId) % 42);
  return `00:${String(seconds).padStart(2, "0")}`;
}

export function formatEngagementCount(value: number) {
  if (value >= 10_000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  if (value >= 1_000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return String(value);
}
