import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProductsModule } from './modules/products/products.module';
import { SearchModule } from './modules/search/search.module';
import { ComparisonModule } from './modules/comparisons/comparison.module';
import { AIModule } from './modules/ai/ai.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { SeoModule } from './modules/seo/seo.module';
import { AdminModule } from './modules/admin/admin.module';
import { AffiliatesModule } from './modules/affiliates/affiliates.module';
import { CronModule } from './modules/cron/cron.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),

    // Database
    DatabaseModule,

    // Feature modules
    ProductsModule,
    SearchModule,
    ComparisonModule,
    AIModule,
    ScraperModule,
    SeoModule,
    AdminModule,
    AffiliatesModule,
    CronModule,
  ],
})
export class AppModule {}
