import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ComparisonService } from './comparison.service';

class CreateComparisonDto {
  productIds: string[];
}

@ApiTags('comparisons')
@Controller('comparisons')
export class ComparisonController {
  constructor(private readonly comparisonService: ComparisonService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product comparison with AI verdict' })
  create(@Body() body: CreateComparisonDto) {
    return this.comparisonService.create(body.productIds);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular comparisons' })
  getPopular(@Query('limit') limit?: number) {
    return this.comparisonService.getPopular(limit ? Number(limit) : undefined);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get comparison by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.comparisonService.findBySlug(slug);
  }
}
