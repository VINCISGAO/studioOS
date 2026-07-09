export type MarketingShowcaseWorkDto = {
  id: string;
  title: string;
  description: string;
  category: string;
  platform: string;
  format: string;
  thumbnail_url: string;
  video_url: string;
  tags: string[];
  featured_on_homepage: boolean;
  homepage_sort_order: number;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

export type UpsertMarketingShowcaseWorkInput = {
  title: string;
  description?: string;
  category?: string;
  platform?: string;
  format?: string;
  thumbnail_url?: string;
  thumbnail_key?: string;
  video_url?: string;
  video_key?: string;
  tags?: string[];
  featured_on_homepage?: boolean;
  homepage_sort_order?: number;
  sort_order?: number;
  is_published?: boolean;
};
