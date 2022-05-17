import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EcochainModule } from './api/ecochain/ecochain.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [EcochainModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
