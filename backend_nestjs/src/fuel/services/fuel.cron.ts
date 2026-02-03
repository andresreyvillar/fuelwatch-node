import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FuelService } from './fuel.service';

@Injectable()
export class FuelCron {
  private readonly logger = new Logger(FuelCron.name);

  constructor(private readonly fuelService: FuelService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleDailyUpdate() {
    this.logger.log('Executing scheduled hourly update...');
    await this.fuelService.updateDataFromMinistry();
  }
}
