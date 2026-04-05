import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AIService } from '../ai/ai.service';

interface PageTemplate {
  slug: string;
  keyword: string;
  template: string;
  parameters: Record<string, any>;
}

/**
 * Programmatic SEO engine
 * Generates 100k+ pages from templates + AI content
 */
@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  /**
   * Generate page from template
   */
  async generatePage(template: PageTemplate) {
    // Find relevant products for this page
    const products = await this.findProductsForTemplate(template);

    // Generate AI content
    const content = await this.aiService.generateSeoContent({
      template: template.template,
      keyword: template.keyword,
      products,
      category: template.parameters.category,
    });

    // Generate schema.org markup
    const schemaMarkup = this.generateSchemaMarkup(template, products, content);

    // Generate internal links
    const internalLinks = await this.generateInternalLinks(template);

    // Persist SEO page
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

  /**
   * Batch generate pages from keyword templates
   * This is how we scale to 100k+ pages
   */
  async batchGeneratePages(): Promise<{ generated: number; failed: number }> {
    const templates = this.generateTemplates();
    let generated = 0;
    let failed = 0;

    for (const template of templates) {
      try {
        // Check if page already exists and is recent
        const existing = await this.prisma.seoPage.findUnique({
          where: { slug: template.slug },
        });

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (existing && existing.updatedAt > oneWeekAgo) {
          continue; // Skip recently updated pages
        }

        await this.generatePage(template);
        generated++;
        this.logger.log(`Generated SEO page: ${template.slug}`);
      } catch (error) {
        failed++;
        this.logger.error(`Failed to generate SEO page ${template.slug}: ${error}`);
      }
    }

    return { generated, failed };
  }

  /**
   * Generate all template combinations
   */
  private generateTemplates(): PageTemplate[] {
    const templates: PageTemplate[] = [];

    const categories = ['smartphones', 'laptops', 'tablets', 'headphones', 'smartwatches', 'cameras'];
    const pricePoints = [10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 150000];
    const useCases = ['gaming', 'photography', 'business', 'students', 'video-editing', 'music'];

    // Template: "Best [category] under [price]"
    for (const category of categories) {
      for (const price of pricePoints) {
        const priceLabel = price >= 100000 ? `${price / 100000}-lakh` : `${price / 1000}k`;
        templates.push({
          slug: `best-${category}-under-${priceLabel}`,
          keyword: `best ${category} under ${priceLabel}`,
          template: 'best-under-price',
          parameters: { category, maxPrice: price },
        });
      }
    }

    // Template: "Best [category] for [use-case]"
    for (const category of categories) {
      for (const useCase of useCases) {
        templates.push({
          slug: `best-${category}-for-${useCase}`,
          keyword: `best ${category} for ${useCase}`,
          template: 'best-for-usecase',
          parameters: { category, useCase },
        });
      }
    }

    // Template: "[Brand] [Category] review"
    const brands = ['apple', 'samsung', 'google', 'sony', 'dell', 'hp', 'lenovo'];
    for (const brand of brands) {
      for (const category of categories) {
        templates.push({
          slug: `${brand}-${category}-review`,
          keyword: `${brand} ${category} review 2026`,
          template: 'brand-category-review',
          parameters: { brand, category },
        });
      }
    }

    return templates;
  }

  private async findProductsForTemplate(template: PageTemplate) {
    const { category, maxPrice, brand, useCase } = template.parameters;

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

  private generateSchemaMarkup(template: PageTemplate, products: any[], content: any) {
    return {
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
  }

  private async generateInternalLinks(template: PageTemplate): Promise<string[]> {
    // Find related SEO pages for internal linking
    const related = await this.prisma.seoPage.findMany({
      where: {
        status: 'PUBLISHED',
        slug: { not: template.slug },
        template: template.template,
      },
      select: { slug: true },
      take: 5,
    });

    return related.map((r) => r.slug);
  }

  /**
   * Get page by slug (for frontend rendering)
   */
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
}
