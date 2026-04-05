import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SeoService } from './seo.service';

@ApiTags('seo')
@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get SEO page by slug (for frontend rendering)' })
  getPage(@Param('slug') slug: string) {
    return this.seoService.getPageBySlug(slug);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Trigger batch SEO page generation (all or by type)' })
  @ApiQuery({ name: 'type', required: false, description: 'Template type filter: best-under-price, best-for-usecase, vs-comparison, alternatives, spec-feature, brand-category-best' })
  generatePages(@Query('type') type?: string) {
    return this.seoService.batchGeneratePages(type);
  }

  @Post('generate/comparisons')
  @ApiOperation({ summary: 'Auto-generate comparison pages from product database' })
  generateComparisons() {
    return this.seoService.generateComparisonPagesFromDB();
  }

  @Get('templates/stats')
  @ApiOperation({ summary: 'Get template generation statistics' })
  getTemplateStats() {
    return this.seoService.getTemplateStats();
  }
}
