import { Module } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { ResponseService } from '../utils/response/response.service';
import { EcohainController } from './controller/ecohain.controller';
import { EcohainService } from './service/ecohain.service';
import { PendingDepositService } from './cron/pending-deposit.service';
const Web3 = require('web3');

@Module({
  imports: [],
  controllers: [EcohainController],
  providers: [
    EcohainService,
    ResponseService,
    ConfigService,
    PendingDepositService,
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
