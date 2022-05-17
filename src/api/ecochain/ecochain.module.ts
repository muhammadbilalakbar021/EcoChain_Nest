import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '../config/config.service';
import { ResponseService } from '../utils/response/response.service';
import { EcohainController } from './controller/ecohain.controller';
import { EcohainService } from './service/ecohain.service';
const Web3 = require('web3');

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [EcohainController],
  providers: [
    EcohainService,
    ResponseService,
    ConfigService,
    {
      provide: 'EcoWeb3',
      useFactory: (config: ConfigService) => {
        return new Web3('https://rpc.ecochain.network');
      },
      inject: [ConfigService],
    },
  ],
})
export class EcochainModule {}
