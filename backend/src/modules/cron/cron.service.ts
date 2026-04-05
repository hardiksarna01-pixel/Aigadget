import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/database/prisma.service';
import { ScraperOrchestrator } from '../scraper/scraper-orchestrator.service';
import { SeoService } from '../seo/seo.service';

/**
 * Auto-Publishing Cron System
 *
 * Pipeline:
 *   SCRAPER (Apify) → DATABASE (Postgres) → AI ENGINE (Claude)
 *   → SEO PAGE GENERATOR → NEXT.JS FRONTEND (ISR) → GOOGLE INDEX
 *
 * Schedule:
 *   Every 6 hours:  Scrape new products + AI analyze + auto-publish
 *   Every 24 hours: Batch generate/refresh SEO pages
 *   Every 1 hour:   Price update check across all platforms
 */
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private prisma: PrismaService,
    private scraperOrchestrator: ScraperOrchestrator,
    private seoService: SeoService,
  ) {
    this.logger.log('CronService initialized');
    this.logger.log('Scheduled: product scrape @6h, SEO generation @24h, price update @1h');
  }

  // ==========================================
  // JOB 1: Product Scraping (Every 6 hours)
  // ==========================================
  @Cron('0 */6 * * *', { name: 'product-scrape' })
  async handleProductScrape() {
    this.logger.log('[Cron] Starting product scrape pipeline...');

    try {
      // Fetch pending scraper jobs
      const pendingJobs = await this.prisma.scraperJob.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 20, // Process max 20 per run
      });

      if (pendingJobs.length === 0) {
        this.logger.log('[Cron] No pending scraper jobs');
        return;
      }

      this.logger.log(`[Cron] Processing ${pendingJobs.length} scraper jobs`);

      let success = 0;
      let failed = 0;

      for (const job of pendingJobs) {
        try {
          await this.scraperOrchestrator.runFullPipeline(job.platform, job.target);
          success++;
        } catch (error) {
          failed++;
          this.logger.error(`[Cron] Pipeline failed for ${job.target}: ${error}`);
        }
      }

      this.logger.log(`[Cron] Scrape complete: ${success} succeeded, ${failed} failed`);

      // After scraping, trigger SEO page generation for new products
      if (success > 0) {
        this.logger.log('[Cron] Triggering comparison page generation for new products...');
        const comparisons = await this.seoService.generateComparisonPagesFromDB();
        this.logger.log(`[Cron] Generated ${comparisons} new comparison pages`);
      }
    } catch (error) {
      this.logger.error(`[Cron] Product scrape job failed: ${error}`);
    }
  }

  // ==========================================
  // JOB 2: SEO Page Generation (Every 24 hours)
  // ==========================================
  @Cron('0 0 * * *', { name: 'seo-generation' })
  async handleSeoPageGeneration() {
    this.logger.log('[Cron] Starting daily SEO page generation...');

    try {
      // Batch generate/refresh stale SEO pages
      const result = await this.seoService.batchGeneratePages();

      this.logger.log(
        `[Cron] SEO generation complete: ${result.generated} generated, ${result.failed} failed, ${result.skipped} skipped (total templates: ${result.total})`,
      );

      // Also generate comparison pages from any new product combos
      const comparisons = await this.seoService.generateComparisonPagesFromDB();
      this.logger.log(`[Cron] Generated ${comparisons} new comparison pages from DB`);
    } catch (error) {
      this.logger.error(`[Cron] SEO generation job failed: ${error}`);
    }
  }

  // ==========================================
  // JOB 3: Price Updates (Every hour)
  // ==========================================
  @Cron('0 * * * *', { name: 'price-update' })
  async handlePriceUpdate() {
    this.logger.log('[Cron] Starting hourly price update...');

    try {
      await this.scraperOrchestrator.runPriceUpdatePipeline();
      this.logger.log('[Cron] Price update complete');
    } catch (error) {
      this.logger.error(`[Cron] Price update job failed: ${error}`);
    }
  }

  // ==========================================
  // JOB 4: Stale Product Cleanup (Weekly)
  // ==========================================
  @Cron('0 3 * * 0', { name: 'stale-cleanup' })
  async handleStaleCleanup() {
    this.logger.log('[Cron] Starting weekly stale product cleanup...');

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Archive products with all prices out of stock and not updated in 30 days
      const staleProducts = await this.prisma.product.updateMany({
        where: {
          status: 'PUBLISHED',
          updatedAt: { lt: thirtyDaysAgo },
          prices: { every: { inStock: false } },
        },
        data: { status: 'ARCHIVED' },
      });

      // Clean up old completed scraper jobs (keep last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const deletedJobs = await this.prisma.scraperJob.deleteMany({
        where: {
          status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] },
          completedAt: { lt: sevenDaysAgo },
        },
      });

      this.logger.log(
        `[Cron] Cleanup: archived ${staleProducts.count} stale products, deleted ${deletedJobs.count} old jobs`,
      );
    } catch (error) {
      this.logger.error(`[Cron] Stale cleanup failed: ${error}`);
    }
  }
}
