export interface SeedPage {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heading: string;
  content: string;
  faqContent: Array<{ question: string; answer: string }>;
  productSlugs: string[];
  internalLinks: string[];
}

export const seedPages: SeedPage[] = [];

export function getSeedPage(slug: string): SeedPage | null {
  return seedPages.find((p) => p.slug === slug) || null;
}
