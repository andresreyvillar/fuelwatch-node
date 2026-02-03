import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { Station } from './entities/station.entity';
import { PriceHistory } from './entities/price-history.entity';
import { FuelService } from './services/fuel.service';
import { FuelController } from './fuel.controller';
import { FuelCron } from './services/fuel.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Station, PriceHistory]),
    ScheduleModule.forRoot(),
    CacheModule.register({
      ttl: 3600 * 1000, // 1 hour in milliseconds
      max: 100, // maximum number of items in cache
    }),
  ],
  providers: [FuelService, FuelCron],
  controllers: [FuelController],
  exports: [FuelService],
})
export class FuelModule {}
