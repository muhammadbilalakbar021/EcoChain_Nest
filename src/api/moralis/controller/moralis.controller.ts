import { BlockcypherService } from './../../blockcypher/service/blockcypher.service';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MoralisService } from '../service/moralis.service';

@Controller('moralis')
export class MoralisController {
  constructor(private readonly moralisService: MoralisService) {}

  @Post('eth')
  async ethTransactionWebhook(@Body() transaction: any) {
    console.log('ETH transaction:', transaction);
    await this.moralisService.transactionWebhook(transaction.object, 'ETH');
  }
  @Post('bsc')
  async bscTransactionWebhook(@Body() transaction: any) {
    console.log('BNB transaction:', transaction);
    await this.moralisService.transactionWebhook(transaction.object, 'BNB');
  }
}
