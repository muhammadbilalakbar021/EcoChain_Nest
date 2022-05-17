import { EcohainService } from './../service/ecohain.service';
import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ResponseService } from 'src/api/utils/response/response.service';
import { Response } from 'express';

@Controller('ecochain')
export class EcohainController {
  constructor(
    private readonly responseService: ResponseService,
    private ecoService: EcohainService,
  ) {}

  @Post('wallet')
  async getEcoAddress(@Body() req: any, @Res() res: Response) {
    try {
      const address = await this.ecoService.generateEthWallet(req.mnemonic);
      this.responseService.successResponse(true, address, res);
    } catch (err) {
      return this.responseService.serverFailureResponse(err.message, res);
    }
  }

  @Get('mnemonic')
  async getEcoMnemonic(@Body() req: any, @Res() res: Response) {
    try {
      const address = await this.ecoService.mnemonic();
      this.responseService.successResponse(true, address, res);
    } catch (err) {
      return this.responseService.serverFailureResponse(err.message, res);
    }
  }

  @Post('withdraw')
  async withdrawEco(@Body() req: any, @Res() res: Response) {
    try {
      console.log('hello');
      const address = await this.ecoService.coinTransfer(req);
      this.responseService.successResponse(true, address, res);
    } catch (err) {
      return this.responseService.serverFailureResponse(err.message, res);
    }
  }

  @Get('amount')
  async getAddressBalance(@Query() req: any, @Res() res: Response) {
    try {
      const address = await this.ecoService.getEcoBalance(req.address);
      this.responseService.successResponse(true, address, res);
    } catch (err) {
      return this.responseService.serverFailureResponse(err.message, res);
    }
  }

  @Get('user-transactions')
  async getUserTransaction(@Query() req: any, @Res() res: Response) {
    try {
      const address = await this.ecoService.getUsersTransactions(req.address);
      this.responseService.successResponse(true, address, res);
    } catch (err) {
      return this.responseService.serverFailureResponse(err.message, res);
    }
  }

  @Get('all-transactions')
  async getAllTransactions(@Query() req: any, @Res() res: Response) {
    try {
      const txs = await this.ecoService.getTransactions();
      this.responseService.successResponse(true, txs, res);
    } catch (err) {
      return this.responseService.serverFailureResponse(err.message, res);
    }
  }
  @Get('all-balances')
  async getAllBalances(@Query() req: any, @Res() res: Response) {
    try {
      const txs = await this.ecoService.accountBalances();
      this.responseService.successResponse(true, txs, res);
    } catch (err) {
      return this.responseService.serverFailureResponse(err.message, res);
    }
  }
}
