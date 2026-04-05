import { Injectable, Logger } from '@nestjs/common';
import { ScrapedProduct } from '../scraper.service';

/**
 * Flipkart product scraper using Playwright
 */
@Injectable()
export class FlipkartScraper {
  private readonly logger = new Logger(FlipkartScraper.name);

  async scrape(url: string): Promise<ScrapedProduct | null> {
    try {
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
      await page.route('**/*.{png,jpg,jpeg,gif,svg,webp,woff,woff2}', (route) => route.abort());

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const data = await page.evaluate(() => {
        const title = document.querySelector('span.VU-ZEz, h1.yhB1nd')?.textContent?.trim() || '';
        const priceText = document.querySelector('div.Nx9bqj.CxhGGd, div._30jeq3')?.textContent?.trim() || '0';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

        const originalPriceText = document.querySelector('div.yRaY8j, div._3I9_wc')?.textContent?.trim();
        const originalPrice = originalPriceText
          ? parseFloat(originalPriceText.replace(/[^0-9.]/g, ''))
          : undefined;

        const imageUrl = (document.querySelector('img._396cs4, img.DByuf4') as HTMLImageElement)?.src || '';

        // Extract specs
        const specs: Array<{ label: string; value: string; group: string }> = [];
        document.querySelectorAll('div._4BJ2V\\+ table tr, div.GNDEQ- tr').forEach((row) => {
          const label = row.querySelector('td:first-child')?.textContent?.trim() || '';
          const value = row.querySelector('td:last-child')?.textContent?.trim() || '';
          if (label && value && label !== value) {
            specs.push({ label, value, group: 'General' });
          }
        });

        // Extract reviews
        const reviews: Array<{ author: string; rating: number; title: string; content: string }> = [];
        document.querySelectorAll('div._27M-vq, div.col.EPCmJX').forEach((reviewEl) => {
          const ratingText = reviewEl.querySelector('div._3LWZlK')?.textContent?.trim() || '0';
          const title = reviewEl.querySelector('p._2-N8zT')?.textContent?.trim() || '';
          const content = reviewEl.querySelector('div.t-ZTKy div div')?.textContent?.trim() || '';
          reviews.push({
            author: 'Flipkart User',
            rating: parseFloat(ratingText),
            title,
            content,
          });
        });

        return { title, price, originalPrice, imageUrl, specs, reviews };
      });

      await browser.close();

      return {
        name: data.title,
        brand: this.extractBrand(data.title),
        category: 'other',
        price: data.price,
        originalPrice: data.originalPrice,
        currency: 'INR',
        url,
        imageUrl: data.imageUrl,
        specs: data.specs,
        reviews: data.reviews.map((r) => ({ ...r, verifiedPurchase: false })),
        platform: 'flipkart',
        inStock: true,
      };
    } catch (error) {
      this.logger.error(`Flipkart Playwright scrape failed: ${error}`);
      return null;
    }
  }

  private extractBrand(title: string): string {
    const brands = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Sony', 'Bose', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Xiaomi', 'Realme', 'Nothing'];
    for (const brand of brands) {
      if (title.toLowerCase().includes(brand.toLowerCase())) return brand;
    }
    return title.split(' ')[0];
  }
}
