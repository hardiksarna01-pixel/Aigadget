import { Injectable, Logger } from '@nestjs/common';
import { ScrapedProduct } from '../scraper.service';

/**
 * Amazon product scraper using Playwright
 * Fallback when Apify is unavailable
 */
@Injectable()
export class AmazonScraper {
  private readonly logger = new Logger(AmazonScraper.name);

  async scrape(url: string): Promise<ScrapedProduct | null> {
    try {
      // Dynamic import to avoid loading Playwright in non-scraping environments
      const { chromium } = await import('playwright');

      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();

      // Block unnecessary resources
      await page.route('**/*.{png,jpg,jpeg,gif,svg,webp,woff,woff2}', (route) => route.abort());
      await page.route('**/ads/**', (route) => route.abort());

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Extract product data
      const data = await page.evaluate(() => {
        const title = document.querySelector('#productTitle')?.textContent?.trim() || '';
        const priceWhole = document.querySelector('.a-price-whole')?.textContent?.trim() || '0';
        const priceFraction = document.querySelector('.a-price-fraction')?.textContent?.trim() || '00';
        const price = parseFloat(priceWhole.replace(/[^0-9]/g, '') + '.' + priceFraction);

        const originalPriceEl = document.querySelector('.a-text-price .a-offscreen');
        const originalPrice = originalPriceEl
          ? parseFloat(originalPriceEl.textContent?.replace(/[^0-9.]/g, '') || '0')
          : undefined;

        const imageUrl = (document.querySelector('#landingImage') as HTMLImageElement)?.src || '';

        // Extract specs from product details table
        const specs: Array<{ label: string; value: string; group: string }> = [];
        document.querySelectorAll('#productDetails_techSpec_section_1 tr, #detailBullets_feature_div li').forEach((row) => {
          const label = row.querySelector('th, .a-text-bold')?.textContent?.trim() || '';
          const value = row.querySelector('td, span:last-child')?.textContent?.trim() || '';
          if (label && value) {
            specs.push({ label: label.replace(/[:\u200F]/g, '').trim(), value, group: 'General' });
          }
        });

        // Extract reviews
        const reviews: Array<{ author: string; rating: number; title: string; content: string }> = [];
        document.querySelectorAll('[data-hook="review"]').forEach((reviewEl) => {
          const author = reviewEl.querySelector('.a-profile-name')?.textContent?.trim() || '';
          const ratingText = reviewEl.querySelector('[data-hook="review-star-rating"]')?.textContent?.trim() || '0';
          const rating = parseFloat(ratingText);
          const title = reviewEl.querySelector('[data-hook="review-title"]')?.textContent?.trim() || '';
          const content = reviewEl.querySelector('[data-hook="review-body"]')?.textContent?.trim() || '';
          reviews.push({ author, rating, title, content });
        });

        const inStock = !document.querySelector('#outOfStock');

        return { title, price, originalPrice, imageUrl, specs, reviews, inStock };
      });

      await browser.close();

      return {
        name: data.title,
        brand: this.extractBrand(data.title),
        category: 'other', // Will be re-classified by AI
        price: data.price,
        originalPrice: data.originalPrice,
        currency: 'INR',
        url,
        imageUrl: data.imageUrl,
        specs: data.specs,
        reviews: data.reviews.map((r) => ({ ...r, verifiedPurchase: false })),
        platform: 'amazon',
        inStock: data.inStock,
      };
    } catch (error) {
      this.logger.error(`Amazon Playwright scrape failed: ${error}`);
      return null;
    }
  }

  private extractBrand(title: string): string {
    const brands = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Sony', 'Bose', 'Dell', 'HP', 'Lenovo', 'ASUS'];
    for (const brand of brands) {
      if (title.toLowerCase().includes(brand.toLowerCase())) return brand;
    }
    return title.split(' ')[0];
  }
}
