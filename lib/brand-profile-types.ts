export type BrandShowcaseAd = {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
  creator_id: string;
  creator_name: string;
  project_id: string | null;
  order_id: string | null;
  platform?: string;
  published_at: string;
  visible: boolean;
};

export type StoredBrandProfile = {
  id: string;
  client_email: string;
  company_name: string;
  display_name: string;
  headline: string;
  bio: string;
  website: string;
  industry: string;
  country: string;
  city: string;
  logo_url: string;
  cover_url: string;
  profile_completed_at: string | null;
  showcase_ads: BrandShowcaseAd[];
  updated_at: string;
};

export type BrandProfileStore = {
  profiles: Record<string, StoredBrandProfile>;
};
