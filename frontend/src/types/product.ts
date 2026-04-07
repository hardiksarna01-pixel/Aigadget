export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  imageUrl: string;
  images: string[];
  aiScore: number;
  aiSummary: string;
  pros: string[];
  cons: string[];
  specs: ProductSpec[];
  prices: ProductPrice[];
  reviewSentiment: ReviewSentiment;
  affiliateLinks: AffiliateLink[];
  tags: string[];
  trending: boolean;
  featured: boolean;
  badge?: "trending" | "best-deal" | "ai-pick";
  buyCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSpec {
  group: string;
  label: string;
  value: string;
  highlight?: boolean;
}

export interface ProductPrice {
  platform: "amazon" | "flipkart" | "walmart" | "apple" | "other";
  price: number;
  originalPrice?: number;
  currency: string;
  url: string;
  inStock: boolean;
  lastUpdated: string;
}

export interface ReviewSentiment {
  overallScore: number;
  totalReviews: number;
  positive: number;
  neutral: number;
  negative: number;
  commonPraises: string[];
  commonComplaints: string[];
  insights: string[];
}

export interface AffiliateLink {
  platform: string;
  url: string;
  price: number;
  logo: string;
}

export interface Comparison {
  id: string;
  slug: string;
  title: string;
  products: Product[];
  aiVerdict: string;
  verdictDetails: VerdictDetail[];
  winner: string;
  createdAt: string;
}

export interface VerdictDetail {
  category: string;
  winner: string;
  explanation: string;
}

export interface SearchQuery {
  text?: string;
  imageUrl?: string;
  voiceTranscript?: string;
  filters?: SearchFilters;
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  minScore?: number;
  sortBy?: "relevance" | "price_low" | "price_high" | "score" | "trending";
}

export interface AIRecommendation {
  products: Product[];
  explanation: string;
  confidence: number;
  alternatives: Product[];
  followUpQuestions: string[];
}

export interface DealProduct extends Product {
  discount: number;
  dealEndsAt: string;
}

export type CategorySlug =
  | "smartphones"
  | "laptops"
  | "tablets"
  | "headphones"
  | "smartwatches"
  | "cameras"
  | "speakers"
  | "gaming";

export interface Category {
  slug: CategorySlug;
  name: string;
  icon: string;
  productCount: number;
}
