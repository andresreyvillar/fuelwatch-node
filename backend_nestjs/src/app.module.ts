import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FuelModule } from './fuel/fuel.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Enabled for automatic table creation
        logging: true, // Enable logging
        ssl: {
          rejectUnauthorized: false, // Required for Supabase
        },
        extra: {
          max: 10, // Connection pool size
          idleTimeoutMillis: 30000,
        },
      }),
      inject: [ConfigService],
    }),
    FuelModule,
  ],
})
export class AppModule {}