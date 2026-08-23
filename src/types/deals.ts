export type DealRating = "Exceptional Buy" | "Strong Buy" | "Possible Buy" | "Risky" | "Avoid";

export type DisplayDeal = {
  id: string;
  title: string;
  marketplace: string;
  buyPrice: number;
  resaleValue: number;
  estimatedProfit: number;
  roi: number;
  demand: string;
  listingAge: string;
  location: string;
  distance: string;
  rating: DealRating;
  flipScore?: number;
  confidence?: string;
  image: string;
  itemUrl?: string;
  category?: string;
  source?: "demo" | "ebay";
};
