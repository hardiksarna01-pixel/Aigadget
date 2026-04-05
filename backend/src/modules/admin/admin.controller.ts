import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('products/pending')
  @ApiOperation({ summary: 'Get products pending approval' })
  getPendingProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getProductsForApproval(
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Post('products/:id/approve')
  @ApiOperation({ summary: 'Approve a draft product' })
  approveProduct(@Param('id') id: string) {
    return this.adminService.approveProduct(id);
  }

  @Post('products/:id/archive')
  @ApiOperation({ summary: 'Archive a product' })
  archiveProduct(@Param('id') id: string) {
    return this.adminService.archiveProduct(id);
  }

  @Get('analytics/affiliates')
  @ApiOperation({ summary: 'Get affiliate analytics' })
  getAffiliateAnalytics(@Query('days') days?: number) {
    return this.adminService.getAffiliateAnalytics(days ? Number(days) : undefined);
  }
}
