import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'AI-powered product search' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (natural language)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.search({
      query,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular search queries' })
  getPopularSearches(@Query('limit') limit?: number) {
    return this.searchService.getPopularSearches(limit ? Number(limit) : undefined);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Get autocomplete suggestions' })
  @ApiQuery({ name: 'q', required: true })
  getAutocomplete(@Query('q') prefix: string, @Query('limit') limit?: number) {
    return this.searchService.getAutocompleteSuggestions(prefix, limit ? Number(limit) : undefined);
  }
}
