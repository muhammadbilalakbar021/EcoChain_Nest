import { Module } from '@nestjs/common';
import { ResponseService } from '../utils/response/response.service';
import { EcohainController } from './controller/ecohain.controller';
import { EcohainService } from './service/ecohain.service';

@Module({
  controllers: [EcohainController],
  providers: [EcohainService, ResponseService],
})
export class EcochainModule {}
