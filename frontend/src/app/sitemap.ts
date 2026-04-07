import { MetadataRoute } from "next";
import { trendingProducts, categories } from "@/data/mock";
import { seedPages } from "@/data/seed-pages";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aigadget.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Homepage
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/category/${cat.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Product pages
  const productPages: MetadataRoute.Sitemap = trendingProducts.map((product) => ({
    url: `${BASE_URL}/product/${product.slug}`,
    lastModified: product.updatedAt || now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // SEO "best" pages
  const seoPages: MetadataRoute.Sitemap = seedPages.map((page) => ({
    url: `${BASE_URL}/best/${page.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...seoPages, ...productPages, ...categoryPages];
}
