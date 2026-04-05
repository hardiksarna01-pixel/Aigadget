import { Injectable, Logger } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { AmazonScraper } from './platforms/amazon.scraper';
import { FlipkartScraper } from './platforms/flipkart.scraper';
import { AIService } from '../ai/ai.service';
import { ReviewSynthesizer } from '../ai/review-synthesizer.service';
import { VectorSearchService } from '../ai/vector-search.service';
import { PrismaService } from '@/database/prisma.service';

/**
 * Orchestrates the full scraping + AI analysis pipeline:
 *
 * 1. Scrape product data from platform (Apify primary, Playwright fallback)
 * 2. Normalize and persist to database
 * 3. Trigger AI analysis (score, summary, pros/cons)
 * 4. Synthesize reviews
 * 5. Generate vector embeddings for semantic search
 * 6. Auto-publish if score threshold met
 */
@Injectable()
export class ScraperOrchestrator {
  private readonly logger = new Logger(ScraperOrchestrator.name);

  constructor(
    private scraperService: ScraperService,
    private amazonScraper: AmazonScraper,
    private flipkartScraper: FlipkartScraper,
    private aiService: AIService,
    private reviewSynthesizer: ReviewSynthesizer,
    private vectorSearch: VectorSearchService,
    private prisma: PrismaService,
  ) {}

  /**
   * Full pipeline: Scrape -> Store -> AI Analyze -> Publish
   */
  async runFullPipeline(platform: string, url: string): Promise<{ productId: string; status: string }> {
    const job = await this.scraperService.createJob('PRODUCT_DATA', platform, url);

    try {
      await this.scraperService.updateJobStatus(job.id, 'RUNNING');

      // Step 1: Scrape
      this.logger.log(`[Pipeline] Scraping ${platform}: ${url}`);
      let scrapedData = await this.scraperService.scrapeViaApify(platform, url);

      // Fallback to Playwright
      if (!scrapedData) {
        this.logger.log(`[Pipeline] Apify failed, trying Playwright fallback`);
        scrapedData = await this.scrapeWithPlaywright(platform, url);
      }

      if (!scrapedData) {
        throw new Error('Both Apify and Playwright scraping failed');
      }

      // Step 2: Persist
      this.logger.log(`[Pipeline] Persisting: ${scrapedData.name}`);
      const productId = await this.scraperService.persistScrapedProduct(scrapedData);

      // Step 3: AI Analysis
      this.logger.log(`[Pipeline] AI analyzing: ${scrapedData.name}`);
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { specs: true, reviews: true, prices: true },
      });

      if (product) {
        const analysis = await this.aiService.analyzeProduct({
          name: product.name,
          brand: product.brand,
          category: product.category,
          specs: product.specs,
          reviews: product.reviews,
          prices: product.prices,
        });

        await this.prisma.product.update({
          where: { id: productId },
          data: {
            aiScore: analysis.aiScore,
            aiSummary: analysis.summary,
            pros: analysis.pros,
            cons: analysis.cons,
            tags: analysis.bestFor,
            // Auto-publish if AI score is above threshold
            status: analysis.aiScore >= 5.0 ? 'PUBLISHED' : 'DRAFT',
            publishedAt: analysis.aiScore >= 5.0 ? new Date() : undefined,
          },
        });

        // Step 4: Review synthesis
        this.logger.log(`[Pipeline] Synthesizing reviews`);
        await this.reviewSynthesizer.synthesizeReviews(productId);

        // Step 5: Vector embedding
        this.logger.log(`[Pipeline] Generating embedding`);
        const embeddingText = `${product.name} ${product.brand} ${product.category} ${analysis.summary} ${analysis.pros.join(' ')} ${analysis.cons.join(' ')}`;
        await this.vectorSearch.upsertProductEmbedding(productId, embeddingText);
      }

      await this.scraperService.updateJobStatus(job.id, 'COMPLETED', { productId });
      this.logger.log(`[Pipeline] Complete for: ${scrapedData.name}`);

      return { productId, status: 'completed' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.scraperService.updateJobStatus(job.id, 'FAILED', null, errorMsg);
      this.logger.error(`[Pipeline] Failed: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Price update pipeline: Re-check prices across all platforms
   */
  async runPriceUpdatePipeline(): Promise<void> {
    const products = await this.prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      include: { prices: true },
    });

    this.logger.log(`[PriceUpdate] Updating prices for ${products.length} products`);

    for (const product of products) {
      for (const price of product.prices) {
        try {
          const freshData = await this.scraperService.scrapeViaApify(
            price.platform,
            price.url,
          );
          if (freshData) {
            await this.prisma.productPrice.update({
              where: { id: price.id },
              data: {
                price: freshData.price,
                originalPrice: freshData.originalPrice,
                inStock: freshData.inStock,
                lastChecked: new Date(),
                priceHistory: {
                  // Append to price history
                  ...(price.priceHistory as any || []),
                  push: { date: new Date().toISOString(), price: freshData.price },
                },
              },
            });
          }
        } catch (error) {
          this.logger.warn(`Price update failed for ${product.name} on ${price.platform}`);
        }
      }
    }
  }

  private async scrapeWithPlaywright(platform: string, url: string) {
    switch (platform) {
      case 'amazon':
        return this.amazonScraper.scrape(url);
      case 'flipkart':
        return this.flipkartScraper.scrape(url);
      default:
        return null;
    }
  }
}
