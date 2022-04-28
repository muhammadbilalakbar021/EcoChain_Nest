const Moralis = require('moralis/node');
import { Module } from '@nestjs/common';
import { MoralisService } from './service/moralis.service';
import { MoralisController } from './controller/moralis.controller';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { any } from 'joi';
import { MoralisHelper } from './helpers/moralis.helper';

@Module({
  controllers: [MoralisController],
  imports: [ConfigModule, ConfigService],
  providers: [
    MoralisService,
    MoralisHelper,
    {
      provide: 'Moralis',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        Moralis.start({
          serverUrl: config.MORALIS_SERVER_URL,
          appId: config.MORALIS_APP_ID,
          masterKey: config.MORALIS_MASTER_KEY,
        });
        return Moralis;
      },
    },
  ],
  exports: [MoralisService, MoralisHelper],
})
export class MoralisModule {}
