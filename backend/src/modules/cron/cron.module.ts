import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { ScraperModule } from '../scraper/scraper.module';
import { SeoModule } from '../seo/seo.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ScraperModule,
    SeoModule,
  ],
  providers: [CronService],
})
export class CronModule {}
