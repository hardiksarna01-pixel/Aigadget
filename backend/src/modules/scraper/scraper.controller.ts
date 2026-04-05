import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScraperOrchestrator } from './scraper-orchestrator.service';
import { PrismaService } from '@/database/prisma.service';

class ScrapeRequestDto {
  platform: string;
  url: string;
}

@ApiTags('scraper')
@Controller('scraper')
export class ScraperController {
  constructor(
    private readonly orchestrator: ScraperOrchestrator,
    private readonly prisma: PrismaService,
  ) {}

  @Post('run')
  @ApiOperation({ summary: 'Trigger full scraping pipeline for a product URL' })
  async runPipeline(@Body() body: ScrapeRequestDto) {
    return this.orchestrator.runFullPipeline(body.platform, body.url);
  }

  @Post('price-update')
  @ApiOperation({ summary: 'Trigger price update for all published products' })
  async runPriceUpdate() {
    await this.orchestrator.runPriceUpdatePipeline();
    return { status: 'started' };
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get scraper job history' })
  async getJobs(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.prisma.scraperJob.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit ? Number(limit) : 50,
    });
  }
}
