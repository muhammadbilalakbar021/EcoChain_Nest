import { EcohainService } from './../service/ecohain.service';
import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('ecohain')
export class EcohainController {
  constructor(
    private ecoService: EcohainService,
  ) { }

  @Post('wallet')
  async getEcoAddress(@Body() req: any, @Res() res: Response) {
    try {
      const address = await this.ecoService.generateEthWallet(req.mnemonic);
      return res.status(HttpStatus.OK).json(address);
    } catch (err) {
      return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ Error: err.message });
    }
  }

  @Get('mnemonic')
  async getEcoMnemonic(@Body() req: any, @Res() res: Response) {
    try {
      const address = await this.ecoService.mnemonic();
      return res.status(HttpStatus.OK).json(address);
    } catch (err) {
      return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ Error: err.message });
    }
  }
}
