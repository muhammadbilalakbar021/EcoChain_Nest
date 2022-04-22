import { EcohainService } from './../service/ecohain.service';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { ResponseService } from 'src/api/utils/response/response.service';
import { Response } from 'express';

@Controller('ecohain')
export class EcohainController {
  constructor(
    private readonly responseService: ResponseService,
    private ecoService: EcohainService,
  ) {}
  @Post('get-address')
  async getEcoAddress(@Body() req: any, @Res() res: Response) {
    try {
      const address = await this.ecoService.generateEthWallet();
      this.responseService.successResponse(true, address, res);
    } catch (err) {
      return this.responseService.serverFailureResponse(err.message, res);
    }
  }
}
