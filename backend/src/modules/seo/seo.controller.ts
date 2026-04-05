import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
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

  @Post('import-keywords')
  @ApiOperation({ summary: 'Bulk import keywords from CSV-style array to generate SEO pages' })
  async importKeywords(
    @Body() body: { keywords: Array<{ keyword: string; slug: string; category: string; price?: string; use_case?: string; location?: string; template: string }> },
  ) {
    let generated = 0;
    let failed = 0;

    for (const kw of body.keywords) {
      try {
        await this.seoService.generatePage({
          slug: kw.slug,
          keyword: kw.keyword,
          template: kw.template,
          parameters: {
            category: kw.category,
            maxPrice: kw.price ? parseInt(kw.price, 10) : undefined,
            useCase: kw.use_case || undefined,
            location: kw.location || undefined,
          },
        });
        generated++;
      } catch {
        failed++;
      }
    }

    return { generated, failed, total: body.keywords.length };
  }
}
