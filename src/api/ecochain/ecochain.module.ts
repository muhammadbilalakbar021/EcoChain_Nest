import { Module } from '@nestjs/common';
import { MoralisModule } from '../moralis/moralis.module';
import { ResponseService } from '../utils/response/response.service';
import { EcohainController } from './controller/ecohain.controller';
import { EcohainService } from './service/ecohain.service';

@Module({
  imports: [MoralisModule],
  controllers: [EcohainController],
  providers: [EcohainService, ResponseService],
})
export class EcochainModule {}
