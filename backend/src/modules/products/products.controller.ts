import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService, ProductFilters } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'brand', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'minScore', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['price_low', 'price_high', 'score', 'trending', 'newest'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() filters: ProductFilters) {
    return this.productsService.findAll(filters);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTrending(@Query('limit') limit?: number) {
    return this.productsService.getTrending(limit);
  }

  @Get('deals')
  @ApiOperation({ summary: 'Get products with active deals' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getDeals(@Query('limit') limit?: number) {
    return this.productsService.getDeals(limit);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  getByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getByCategory(category, limit);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
