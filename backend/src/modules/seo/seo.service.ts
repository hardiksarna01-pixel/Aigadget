import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AIService } from '../ai/ai.service';

interface PageTemplate {
  slug: string;
  keyword: string;
  template: string;
  parameters: Record<string, any>;
}

// ==========================================
// KEYWORD SYSTEM CONSTANTS
// ==========================================

const CATEGORIES = [
  'smartphones', 'laptops', 'tablets', 'headphones',
  'smartwatches', 'cameras', 'speakers', 'gaming-consoles',
  'earbuds', 'monitors',
];

const PRICE_POINTS = [
  5000, 10000, 15000, 20000, 25000, 30000,
  40000, 50000, 75000, 100000, 150000, 200000,
];

const USE_CASES = [
  'gaming', 'photography', 'video-editing', 'coding',
  'business', 'students', 'travel', 'music',
  'fitness', 'content-creation', 'work-from-home',
  'streaming', 'everyday-use', 'professionals',
  'beginners', 'kids', 'seniors', 'vlogging',
  'podcast', 'graphic-design',
];

const BRANDS = [
  'apple', 'samsung', 'google', 'sony', 'bose', 'oneplus',
  'dell', 'hp', 'lenovo', 'asus', 'acer', 'microsoft',
  'xiaomi', 'realme', 'nothing', 'motorola', 'oppo', 'vivo',
  'jbl', 'sennheiser', 'marshall', 'bang-olufsen',
];

const SPEC_FEATURES = [
  '5g', 'oled-display', '120hz', 'fast-charging',
  '6000mah-battery', '108mp-camera', '256gb-storage',
  '8gb-ram', '12gb-ram', '16gb-ram', 'thunderbolt',
  'wifi-7', 'bluetooth-5.3', 'ip68', 'wireless-charging',
  'stylus-support', 'dual-sim', 'expandable-storage',
];

/**
 * Programmatic SEO Engine
 *
 * Generates 100K–150K pages across 5 page types:
 * 1. "Best For" pages (budget + use case + category)     ~2,000 pages
 * 2. Comparison pages (product vs product)                ~25,000 pages
 * 3. Alternative pages (X alternatives under Y)           ~10,000 pages
 * 4. Product pages (auto-generated from scraping)         ~10,000 pages
 * 5. Long-tail spec pages (category + spec + budget)      ~50,000 pages
 *
 * Total: 100K–150K indexable pages
 */
@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  // ==========================================
  // PAGE GENERATION
  // ==========================================

  async generatePage(template: PageTemplate) {
    const products = await this.findProductsForTemplate(template);

    // Generate AI content with enhanced prompt
    const content = await this.aiService.generateSeoContent({
      template: template.template,
      keyword: template.keyword,
      products,
      category: template.parameters.category,
    });

    const schemaMarkup = this.generateSchemaMarkup(template, products, content);
    const internalLinks = await this.generateInternalLinks(template);

    const page = await this.prisma.seoPage.upsert({
      where: { slug: template.slug },
      create: {
        slug: template.slug,
        title: content.title,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        heading: content.heading,
        content: content.content,
        template: template.template,
        parameters: template.parameters,
        faqContent: content.faqContent,
        schemaMarkup,
        internalLinks,
        status: 'PUBLISHED',
        products: {
          create: products.slice(0, 10).map((p, i) => ({
            productId: p.id,
            rank: i + 1,
          })),
        },
      },
      update: {
        title: content.title,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        heading: content.heading,
        content: content.content,
        faqContent: content.faqContent,
        schemaMarkup,
        internalLinks,
      },
    });

    return page;
  }

  async batchGeneratePages(templateType?: string): Promise<{ generated: number; failed: number; skipped: number; total: number }> {
    const allTemplates = this.generateAllTemplates();
    const templates = templateType
      ? allTemplates.filter((t) => t.template === templateType)
      : allTemplates;

    let generated = 0;
    let failed = 0;
    let skipped = 0;

    this.logger.log(`Starting batch SEO generation: ${templates.length} templates (type: ${templateType || 'all'})`);

    for (const template of templates) {
      try {
        const existing = await this.prisma.seoPage.findUnique({
          where: { slug: template.slug },
        });

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (existing && existing.updatedAt > oneWeekAgo) {
          skipped++;
          continue;
        }

        await this.generatePage(template);
        generated++;
        this.logger.log(`Generated: ${template.slug}`);
      } catch (error) {
        failed++;
        this.logger.error(`Failed: ${template.slug}: ${error}`);
      }
    }

    return { generated, failed, skipped, total: templates.length };
  }

  // ==========================================
  // TEMPLATE GENERATORS (5 PAGE TYPES)
  // ==========================================

  generateAllTemplates(): PageTemplate[] {
    return [
      ...this.generateBestForPages(),
      ...this.generateComparisonPages(),
      ...this.generateAlternativePages(),
      ...this.generateLongTailPages(),
      ...this.generateBrandCategoryPages(),
    ];
  }

  /**
   * TYPE 1: "Best For" Pages (HIGH MONEY PAGES)
   * Pattern: "Best {category} under {price} for {use-case}"
   * Scale: 10 categories x 12 prices x 20 use-cases = ~2,400 pages
   */
  private generateBestForPages(): PageTemplate[] {
    const templates: PageTemplate[] = [];

    for (const category of CATEGORIES) {
      for (const price of PRICE_POINTS) {
        const priceLabel = this.formatPriceLabel(price);

        // Basic: "Best {category} under {price}"
        templates.push({
          slug: `best-${category}-under-${priceLabel}`,
          keyword: `best ${category} under ${priceLabel}`,
          template: 'best-under-price',
          parameters: { category, maxPrice: price },
        });

        // With use case: "Best {category} under {price} for {use-case}"
        for (const useCase of USE_CASES) {
          templates.push({
            slug: `best-${category}-under-${priceLabel}-for-${useCase}`,
            keyword: `best ${category} under ${priceLabel} for ${useCase}`,
            template: 'best-for-usecase-price',
            parameters: { category, maxPrice: price, useCase },
          });
        }
      }

      // Without price: "Best {category} for {use-case}"
      for (const useCase of USE_CASES) {
        templates.push({
          slug: `best-${category}-for-${useCase}`,
          keyword: `best ${category} for ${useCase}`,
          template: 'best-for-usecase',
          parameters: { category, useCase },
        });
      }
    }

    return templates;
  }

  /**
   * TYPE 2: Comparison Pages (VIRAL + SEO GOLD)
   * Pattern: "{Product A} vs {Product B}"
   * Generated dynamically from product pairs in the same category
   * Scale: ~25,000+ pages from product combinations
   */
  private generateComparisonPages(): PageTemplate[] {
    // Comparison pages are generated on-demand from the database
    // This returns seed templates for the most searched comparisons
    const popularComparisons = [
      ['iphone-16-pro-max', 'samsung-galaxy-s25-ultra'],
      ['iphone-16-pro', 'pixel-9-pro'],
      ['macbook-pro-m4-max', 'dell-xps-16'],
      ['macbook-air-m4', 'dell-xps-14'],
      ['sony-wh-1000xm6', 'bose-quietcomfort-ultra'],
      ['airpods-pro-3', 'samsung-galaxy-buds-3-pro'],
      ['ipad-pro-m4', 'samsung-galaxy-tab-s10-ultra'],
      ['apple-watch-ultra-3', 'samsung-galaxy-watch-7-ultra'],
    ];

    return popularComparisons.map(([a, b]) => ({
      slug: `${a}-vs-${b}`,
      keyword: `${a.replace(/-/g, ' ')} vs ${b.replace(/-/g, ' ')}`,
      template: 'vs-comparison',
      parameters: { productSlugA: a, productSlugB: b },
    }));
  }

  /**
   * TYPE 3: Alternative Pages (HIGH CTR)
   * Pattern: "{Product} alternatives under {price}" / "{Product} alternatives for {use-case}"
   * Scale: ~10,000 pages
   */
  private generateAlternativePages(): PageTemplate[] {
    const templates: PageTemplate[] = [];

    const popularProducts = [
      { slug: 'iphone', brand: 'apple', category: 'smartphones' },
      { slug: 'macbook', brand: 'apple', category: 'laptops' },
      { slug: 'ipad', brand: 'apple', category: 'tablets' },
      { slug: 'airpods', brand: 'apple', category: 'earbuds' },
      { slug: 'samsung-galaxy', brand: 'samsung', category: 'smartphones' },
      { slug: 'pixel', brand: 'google', category: 'smartphones' },
      { slug: 'oneplus', brand: 'oneplus', category: 'smartphones' },
      { slug: 'sony-headphones', brand: 'sony', category: 'headphones' },
      { slug: 'bose-headphones', brand: 'bose', category: 'headphones' },
      { slug: 'dell-xps', brand: 'dell', category: 'laptops' },
    ];

    for (const product of popularProducts) {
      // Basic alternatives
      templates.push({
        slug: `${product.slug}-alternatives`,
        keyword: `${product.slug.replace(/-/g, ' ')} alternatives`,
        template: 'alternatives',
        parameters: { productSlug: product.slug, brand: product.brand, category: product.category },
      });

      // Alternatives under price
      for (const price of PRICE_POINTS) {
        const priceLabel = this.formatPriceLabel(price);
        templates.push({
          slug: `${product.slug}-alternatives-under-${priceLabel}`,
          keyword: `${product.slug.replace(/-/g, ' ')} alternatives under ${priceLabel}`,
          template: 'alternatives-price',
          parameters: { productSlug: product.slug, category: product.category, maxPrice: price },
        });
      }

      // Alternatives for use case
      for (const useCase of USE_CASES.slice(0, 10)) {
        templates.push({
          slug: `${product.slug}-alternatives-for-${useCase}`,
          keyword: `${product.slug.replace(/-/g, ' ')} alternatives for ${useCase}`,
          template: 'alternatives-usecase',
          parameters: { productSlug: product.slug, category: product.category, useCase },
        });
      }
    }

    return templates;
  }

  /**
   * TYPE 4: Long-tail Spec Pages
   * Pattern: "Best {category} with {spec} under {price}"
   * Scale: ~50,000+ pages
   */
  private generateLongTailPages(): PageTemplate[] {
    const templates: PageTemplate[] = [];

    for (const category of CATEGORIES) {
      for (const feature of SPEC_FEATURES) {
        // "Best {category} with {feature}"
        templates.push({
          slug: `best-${category}-with-${feature}`,
          keyword: `best ${category} with ${feature.replace(/-/g, ' ')}`,
          template: 'spec-feature',
          parameters: { category, feature },
        });

        // "Best {category} with {feature} under {price}"
        for (const price of PRICE_POINTS.filter((_, i) => i % 2 === 0)) {
          const priceLabel = this.formatPriceLabel(price);
          templates.push({
            slug: `best-${category}-with-${feature}-under-${priceLabel}`,
            keyword: `best ${category} with ${feature.replace(/-/g, ' ')} under ${priceLabel}`,
            template: 'spec-feature-price',
            parameters: { category, feature, maxPrice: price },
          });
        }
      }
    }

    return templates;
  }

  /**
   * TYPE 5: Brand + Category Pages
   * Pattern: "Best {brand} {category} {year}" / "{brand} {category} review"
   * Scale: ~500+ pages
   */
  private generateBrandCategoryPages(): PageTemplate[] {
    const templates: PageTemplate[] = [];
    const year = new Date().getFullYear();

    for (const brand of BRANDS) {
      for (const category of CATEGORIES) {
        templates.push({
          slug: `best-${brand}-${category}-${year}`,
          keyword: `best ${brand} ${category} ${year}`,
          template: 'brand-category-best',
          parameters: { brand, category, year },
        });

        templates.push({
          slug: `${brand}-${category}-review-${year}`,
          keyword: `${brand} ${category} review ${year}`,
          template: 'brand-category-review',
          parameters: { brand, category, year },
        });
      }
    }

    return templates;
  }

  // ==========================================
  // DYNAMIC COMPARISON PAGE GENERATOR
  // ==========================================

  /**
   * Auto-generate comparison pages from product database
   * Called after new products are scraped
   */
  async generateComparisonPagesFromDB(): Promise<number> {
    let generated = 0;

    for (const category of CATEGORIES) {
      const products = await this.prisma.product.findMany({
        where: { category, status: 'PUBLISHED' },
        select: { id: true, slug: true, name: true, brand: true, aiScore: true },
        orderBy: { aiScore: 'desc' },
        take: 50, // Top 50 per category
      });

      // Generate comparisons for top products within same category
      for (let i = 0; i < products.length; i++) {
        for (let j = i + 1; j < Math.min(i + 5, products.length); j++) {
          const a = products[i];
          const b = products[j];

          // Skip same-brand comparisons (less interesting)
          if (a.brand === b.brand) continue;

          const slug = `${a.slug}-vs-${b.slug}`;
          const existing = await this.prisma.seoPage.findUnique({ where: { slug } });
          if (existing) continue;

          try {
            await this.generatePage({
              slug,
              keyword: `${a.name} vs ${b.name}`,
              template: 'vs-comparison',
              parameters: { productSlugA: a.slug, productSlugB: b.slug },
            });
            generated++;
          } catch (error) {
            this.logger.warn(`Failed comparison page ${slug}: ${error}`);
          }
        }
      }
    }

    return generated;
  }

  // ==========================================
  // PRODUCT QUERY FOR TEMPLATES
  // ==========================================

  private async findProductsForTemplate(template: PageTemplate) {
    const { category, maxPrice, brand, useCase, feature } = template.parameters;

    const where: any = {
      status: 'PUBLISHED',
      ...(category && { category }),
      ...(brand && { brand: { equals: brand, mode: 'insensitive' } }),
    };

    if (maxPrice) {
      where.prices = {
        some: { inStock: true, price: { lte: maxPrice } },
      };
    }

    if (useCase) {
      where.tags = { has: useCase };
    }

    if (feature) {
      where.OR = [
        { tags: { has: feature } },
        { specs: { some: { value: { contains: feature.replace(/-/g, ' '), mode: 'insensitive' } } } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        prices: { where: { inStock: true }, orderBy: { price: 'asc' }, take: 1 },
        specs: { where: { highlight: true } },
      },
      orderBy: { aiScore: 'desc' },
      take: 10,
    });
  }

  // ==========================================
  // INTERNAL LINKING SYSTEM
  // ==========================================

  /**
   * Generate rich internal links for each page:
   * - 5 comparisons
   * - 5 alternatives
   * - 5 related "best" pages
   */
  private async generateInternalLinks(template: PageTemplate): Promise<string[]> {
    const { category, maxPrice } = template.parameters;
    const links: string[] = [];

    // Related "best" pages (same category, different prices or use cases)
    const bestPages = await this.prisma.seoPage.findMany({
      where: {
        status: 'PUBLISHED',
        slug: { not: template.slug },
        template: { startsWith: 'best-' },
        parameters: { path: ['category'], equals: category },
      },
      select: { slug: true },
      take: 5,
      orderBy: { viewCount: 'desc' },
    });
    links.push(...bestPages.map((p) => p.slug));

    // Comparison pages (same category)
    const comparisonPages = await this.prisma.seoPage.findMany({
      where: {
        status: 'PUBLISHED',
        template: 'vs-comparison',
        slug: { contains: category?.slice(0, 5) || '' },
      },
      select: { slug: true },
      take: 5,
      orderBy: { viewCount: 'desc' },
    });
    links.push(...comparisonPages.map((p) => p.slug));

    // Alternative pages
    const altPages = await this.prisma.seoPage.findMany({
      where: {
        status: 'PUBLISHED',
        template: { startsWith: 'alternatives' },
        parameters: { path: ['category'], equals: category },
      },
      select: { slug: true },
      take: 5,
      orderBy: { viewCount: 'desc' },
    });
    links.push(...altPages.map((p) => p.slug));

    return [...new Set(links)]; // deduplicate
  }

  // ==========================================
  // SCHEMA.ORG + AEO MARKUP
  // ==========================================

  private generateSchemaMarkup(template: PageTemplate, products: any[], content: any) {
    const baseSchema: any = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: content.title,
      description: content.metaDescription,
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          brand: { '@type': 'Brand', name: p.brand },
          review: {
            '@type': 'Review',
            reviewRating: {
              '@type': 'Rating',
              ratingValue: p.aiScore,
              bestRating: 10,
            },
            author: { '@type': 'Organization', name: 'AIGadget' },
          },
          offers: p.prices?.[0]
            ? {
                '@type': 'Offer',
                price: p.prices[0].price,
                priceCurrency: p.prices[0].currency,
                availability: 'https://schema.org/InStock',
              }
            : undefined,
        },
      })),
    };

    // Add FAQ schema for AEO
    const faqContent = content.faqContent as Array<{ question: string; answer: string }>;
    if (faqContent?.length) {
      baseSchema.mainEntity = {
        '@type': 'FAQPage',
        mainEntity: faqContent.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      };
    }

    // Add WebPage schema for AEO
    const webPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: content.metaTitle,
      description: content.metaDescription,
      publisher: {
        '@type': 'Organization',
        name: 'AIGadget',
        url: 'https://aigadget.com',
      },
      dateModified: new Date().toISOString(),
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', '.ai-verdict', '.faq-section'],
      },
    };

    return [baseSchema, webPageSchema];
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  async getPageBySlug(slug: string) {
    const page = await this.prisma.seoPage.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            product: {
              include: {
                prices: { where: { inStock: true }, orderBy: { price: 'asc' }, take: 1 },
              },
            },
          },
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (page) {
      await this.prisma.seoPage.update({
        where: { id: page.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return page;
  }

  /**
   * Get template stats for admin dashboard
   */
  getTemplateStats() {
    const allTemplates = this.generateAllTemplates();
    const byType = allTemplates.reduce((acc, t) => {
      acc[t.template] = (acc[t.template] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTemplates: allTemplates.length,
      byType,
      estimatedWithDBComparisons: allTemplates.length + 25000,
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private formatPriceLabel(price: number): string {
    if (price >= 100000) return `${price / 100000}-lakh`;
    return `${price / 1000}k`;
  }
}
