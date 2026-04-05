const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function apiFetch<T>(path: string, revalidate = 86400): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1${path}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ==========================================
// SEO Pages
// ==========================================

export interface SeoPageData {
  id: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  heading: string;
  content: string;
  template: string;
  parameters: Record<string, any>;
  faqContent: Array<{ question: string; answer: string }> | null;
  schemaMarkup: any;
  internalLinks: string[];
  viewCount: number;
  products: Array<{
    rank: number;
    product: ApiProduct;
  }>;
}

export async function getPageData(slug: string): Promise<SeoPageData | null> {
  return apiFetch<SeoPageData>(`/seo/pages/${slug}`);
}

// ==========================================
// Products
// ==========================================

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  imageUrl: string | null;
  images: string[];
  aiScore: number | null;
  aiSummary: string | null;
  pros: string[];
  cons: string[];
  tags: string[];
  trending: boolean;
  featured: boolean;
  specs: Array<{
    groupName: string;
    label: string;
    value: string;
    highlight: boolean;
  }>;
  prices: Array<{
    platform: string;
    price: number;
    originalPrice: number | null;
    currency: string;
    url: string;
    inStock: boolean;
  }>;
}

export interface ProductListResponse {
  data: ApiProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getProduct(slug: string): Promise<ApiProduct | null> {
  return apiFetch<ApiProduct>(`/products/${slug}`);
}

export async function getProducts(params?: {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}): Promise<ProductListResponse | null> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.brand) query.set("brand", params.brand);
  if (params?.minPrice) query.set("minPrice", String(params.minPrice));
  if (params?.maxPrice) query.set("maxPrice", String(params.maxPrice));
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiFetch<ProductListResponse>(`/products${qs ? `?${qs}` : ""}`);
}

export async function getTrending(limit = 10): Promise<ApiProduct[] | null> {
  return apiFetch<ApiProduct[]>(`/products/trending?limit=${limit}`);
}

export async function getDeals(limit = 10): Promise<ApiProduct[] | null> {
  return apiFetch<ApiProduct[]>(`/products/deals?limit=${limit}`);
}

export async function getProductsByCategory(
  category: string,
  limit = 20
): Promise<ApiProduct[] | null> {
  return apiFetch<ApiProduct[]>(`/products/category/${category}?limit=${limit}`);
}

// ==========================================
// Search
// ==========================================

export interface SearchResponse {
  products: ApiProduct[];
  aiExplanation: string;
  confidence: number;
  alternatives: ApiProduct[];
  followUpQuestions: string[];
  totalResults: number;
}

export async function search(
  query: string,
  params?: { category?: string; minPrice?: number; maxPrice?: number }
): Promise<SearchResponse | null> {
  const q = new URLSearchParams({ q: query });
  if (params?.category) q.set("category", params.category);
  if (params?.minPrice) q.set("minPrice", String(params.minPrice));
  if (params?.maxPrice) q.set("maxPrice", String(params.maxPrice));

  return apiFetch<SearchResponse>(`/search?${q.toString()}`, 3600);
}
