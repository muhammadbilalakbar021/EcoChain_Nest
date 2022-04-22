import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EcochainModule } from './api/ecochain/ecochain.module';
import { Web3Module } from './api/web3/web3.module';

@Module({
  imports: [EcochainModule, Web3Module],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
