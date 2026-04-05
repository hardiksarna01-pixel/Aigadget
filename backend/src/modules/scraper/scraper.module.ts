import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { AmazonScraper } from './platforms/amazon.scraper';
import { FlipkartScraper } from './platforms/flipkart.scraper';
import { ScraperOrchestrator } from './scraper-orchestrator.service';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [ScraperController],
  providers: [ScraperService, AmazonScraper, FlipkartScraper, ScraperOrchestrator],
  exports: [ScraperService, ScraperOrchestrator],
})
export class ScraperModule {}
