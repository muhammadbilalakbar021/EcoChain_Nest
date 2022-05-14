import { Module } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { EcohainController } from './controller/ecohain.controller';
import { EcohainService } from './service/ecohain.service';
const Web3 = require('web3')

@Module({
  imports: [],
  controllers: [EcohainController],
  providers: [
    ConfigService,
    EcohainService,
    {
      provide: 'EcoWeb3',
      useFactory: (config: ConfigService) => {
        return new Web3(
          new Web3.providers.HttpProvider('https://rpc.ecochain.network'),
        );
      },
      inject: [ConfigService],
    },
  ],
})
export class EcochainModule { }
