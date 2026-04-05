import { Controller, Post, Get, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AffiliatesService } from './affiliates.service';

class TrackClickDto {
  productId: string;
  platform: string;
  url: string;
  userId?: string;
}

@ApiTags('affiliates')
@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track an affiliate link click and redirect' })
  trackClick(@Body() body: TrackClickDto, @Req() req: Request) {
    return this.affiliatesService.trackClick({
      ...body,
      referrer: req.headers.referer,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get affiliate click statistics' })
  getStats(@Query('days') days?: number) {
    return this.affiliatesService.getClickStats(days ? Number(days) : undefined);
  }
}
