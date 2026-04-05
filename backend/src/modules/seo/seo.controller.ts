import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SeoService } from './seo.service';

@ApiTags('seo')
@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get SEO page by slug' })
  getPage(@Param('slug') slug: string) {
    return this.seoService.getPageBySlug(slug);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Trigger batch SEO page generation' })
  generatePages() {
    return this.seoService.batchGeneratePages();
  }
}
