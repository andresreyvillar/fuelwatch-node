import { Controller, Get, Query, Post, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { FuelService } from './services/fuel.service';

@Controller('fuel')
//@UseInterceptors(CacheInterceptor)
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @Get('test')
  async test() {
    return { status: 'ok', message: 'API is working' };
  }

  @Get('search')
  @CacheTTL(3600)
  async search(
    @Query('target') target: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    return this.fuelService.findByLocation(target, page, limit);
  }

  @Get('stats')
  @CacheTTL(3600)
  async getStats(@Query('location') location: string) {
    return this.fuelService.getStats(location);
  }

  @Post('sync')
  async sync() {
    return this.fuelService.updateDataFromMinistry();
  }
}
