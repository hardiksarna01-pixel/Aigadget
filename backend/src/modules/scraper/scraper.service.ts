import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';

export interface ScrapedProduct {
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  currency: string;
  url: string;
  imageUrl?: string;
  specs: Array<{ label: string; value: string; group?: string }>;
  reviews: Array<{
    author?: string;
    rating: number;
    title?: string;
    content?: string;
    verifiedPurchase?: boolean;
    date?: string;
  }>;
  platform: string;
  inStock: boolean;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /**
   * Primary scraping via Apify
   * Uses pre-built Apify actors for each platform
   */
  async scrapeViaApify(platform: string, url: string): Promise<ScrapedProduct | null> {
    const apifyToken = this.config.get<string>('APIFY_API_TOKEN');
    if (!apifyToken) {
      this.logger.warn('Apify token not configured, falling back to Playwright');
      return null;
    }

    const actorIds: Record<string, string> = {
      amazon: 'junglee/amazon-product-scraper',
      flipkart: 'custom/flipkart-scraper',
      walmart: 'epctex/walmart-scraper',
    };

    const actorId = actorIds[platform];
    if (!actorId) return null;

    try {
      // Start Apify actor run
      const runResponse = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startUrls: [{ url }],
            maxItems: 1,
          }),
        },
      );

      const run = await runResponse.json();
      const runId = run.data?.id;
      if (!runId) throw new Error('Failed to start Apify run');

      // Poll for completion (with timeout)
      let status = 'RUNNING';
      let attempts = 0;
      while (status === 'RUNNING' && attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const statusRes = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`,
        );
        const statusData = await statusRes.json();
        status = statusData.data?.status;
        attempts++;
      }

      if (status !== 'SUCCEEDED') {
        throw new Error(`Apify run ${runId} finished with status: ${status}`);
      }

      // Fetch results
      const datasetRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}`,
      );
      const items = await datasetRes.json();

      if (!items.length) return null;

      return this.normalizeApifyData(items[0], platform);
    } catch (error) {
      this.logger.error(`Apify scraping failed for ${platform}: ${error}`);
      return null;
    }
  }

  /**
   * Normalize Apify output to our standard format
   */
  private normalizeApifyData(raw: any, platform: string): ScrapedProduct {
    // Each platform has different data shapes - normalize here
    return {
      name: raw.title || raw.name || '',
      brand: raw.brand || this.extractBrand(raw.title || ''),
      category: this.inferCategory(raw.title || '', raw.breadcrumbs || ''),
      price: parseFloat(raw.price || raw.currentPrice || '0'),
      originalPrice: raw.originalPrice ? parseFloat(raw.originalPrice) : undefined,
      currency: raw.currency || 'INR',
      url: raw.url || '',
      imageUrl: raw.image || raw.mainImage || '',
      specs: this.normalizeSpecs(raw.specifications || raw.features || []),
      reviews: (raw.reviews || []).map((r: any) => ({
        author: r.author || r.reviewer,
        rating: parseFloat(r.rating || '0'),
        title: r.title,
        content: r.text || r.body || r.content,
        verifiedPurchase: r.verified || false,
        date: r.date,
      })),
      platform,
      inStock: raw.inStock !== false && raw.availability !== 'Out of Stock',
    };
  }

  private extractBrand(title: string): string {
    const knownBrands = [
      'Apple', 'Samsung', 'Google', 'OnePlus', 'Sony', 'Bose',
      'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Microsoft',
      'Xiaomi', 'Realme', 'Nothing', 'Motorola', 'Oppo', 'Vivo',
    ];
    for (const brand of knownBrands) {
      if (title.toLowerCase().includes(brand.toLowerCase())) return brand;
    }
    return title.split(' ')[0]; // fallback: first word
  }

  private inferCategory(title: string, breadcrumbs: string): string {
    const text = `${title} ${breadcrumbs}`.toLowerCase();
    if (text.includes('phone') || text.includes('iphone') || text.includes('galaxy')) return 'smartphones';
    if (text.includes('laptop') || text.includes('macbook') || text.includes('notebook')) return 'laptops';
    if (text.includes('tablet') || text.includes('ipad')) return 'tablets';
    if (text.includes('headphone') || text.includes('earphone') || text.includes('earbud')) return 'headphones';
    if (text.includes('watch') || text.includes('band')) return 'smartwatches';
    if (text.includes('camera') || text.includes('dslr') || text.includes('mirrorless')) return 'cameras';
    if (text.includes('speaker')) return 'speakers';
    if (text.includes('gaming') || text.includes('console') || text.includes('controller')) return 'gaming';
    return 'other';
  }

  private normalizeSpecs(raw: any[]): Array<{ label: string; value: string; group?: string }> {
    if (Array.isArray(raw)) {
      return raw.map((s) => ({
        label: s.name || s.label || s.key || '',
        value: s.value || '',
        group: s.group || s.category || 'General',
      }));
    }
    // Handle object-style specs { "RAM": "8GB", "Storage": "256GB" }
    if (typeof raw === 'object') {
      return Object.entries(raw).map(([label, value]) => ({
        label,
        value: String(value),
        group: 'General',
      }));
    }
    return [];
  }

  /**
   * Save scraped product data to database
   */
  async persistScrapedProduct(data: ScrapedProduct, existingProductId?: string): Promise<string> {
    const slug = this.generateSlug(data.name);

    if (existingProductId) {
      // Update price for existing product
      await this.prisma.productPrice.upsert({
        where: {
          productId_platform: {
            productId: existingProductId,
            platform: data.platform,
          },
        },
        create: {
          productId: existingProductId,
          platform: data.platform,
          price: data.price,
          originalPrice: data.originalPrice,
          currency: data.currency,
          url: data.url,
          inStock: data.inStock,
        },
        update: {
          price: data.price,
          originalPrice: data.originalPrice,
          inStock: data.inStock,
          lastChecked: new Date(),
        },
      });

      return existingProductId;
    }

    // Create new product
    const product = await this.prisma.product.create({
      data: {
        slug,
        name: data.name,
        brand: data.brand,
        category: data.category,
        imageUrl: data.imageUrl,
        status: 'DRAFT', // Needs admin approval or AI analysis
        specs: {
          create: data.specs.map((s, i) => ({
            groupName: s.group || 'General',
            label: s.label,
            value: s.value,
            sortOrder: i,
          })),
        },
        prices: {
          create: {
            platform: data.platform,
            price: data.price,
            originalPrice: data.originalPrice,
            currency: data.currency,
            url: data.url,
            inStock: data.inStock,
          },
        },
        reviews: {
          create: data.reviews.slice(0, 50).map((r) => ({
            source: data.platform,
            author: r.author,
            rating: r.rating,
            title: r.title,
            content: r.content,
            verifiedPurchase: r.verifiedPurchase || false,
          })),
        },
      },
    });

    return product.id;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100);
  }

  /**
   * Record scraper job
   */
  async createJob(type: string, platform: string, target: string) {
    return this.prisma.scraperJob.create({
      data: {
        type: type as any,
        platform,
        target,
        status: 'PENDING',
      },
    });
  }

  async updateJobStatus(jobId: string, status: string, result?: any, error?: string) {
    return this.prisma.scraperJob.update({
      where: { id: jobId },
      data: {
        status: status as any,
        result: result || undefined,
        error: error || undefined,
        ...(status === 'RUNNING' ? { startedAt: new Date() } : {}),
        ...(status === 'COMPLETED' || status === 'FAILED' ? { completedAt: new Date() } : {}),
      },
    });
  }
}
