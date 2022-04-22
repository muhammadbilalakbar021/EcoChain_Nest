import { ConfigService } from '../config/config.service';
import { Module } from '@nestjs/common';
import { Web3Controller } from './controller/web3.controller';
import { Web3Service } from './service/web3.service';
const Web3 = require('web3');

@Module({
  controllers: [Web3Controller],
  providers: [
    ConfigService,
    Web3Service,
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
export class Web3Module {}
