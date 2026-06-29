export type OrderReview = {
  id: string;
  order_id: string;
  creator_id: string;
  client_email: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type OrderRatingStore = {
  reviews: OrderReview[];
};

export type CreatorRatingStats = {
  average: number;
  count: number;
};
