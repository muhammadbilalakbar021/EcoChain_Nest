import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EcochainModule } from './api/ecochain/ecochain.module';

@Module({
  imports: [EcochainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
