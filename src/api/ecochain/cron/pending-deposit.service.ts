import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EcohainService } from '../service/ecohain.service';

@Injectable()
export class PendingDepositService {
  private _jobIsRunning = false;
  private readonly logger = new Logger(PendingDepositService.name);

  constructor(private readonly ecohainService: EcohainService) {
    console.log('hello from ');
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    this.logger.debug('CronJob for Pending Deposit for Eco');
    let addresses = this.ecohainService.addresses;
    console.log(addresses);
    addresses.forEach(async (element) => {
      let balance = await this.ecohainService.getEcoBalance(element?.address);
      if (Number(balance) > element.balance) {
        element.balance = Number(balance);
        element.transactions = await this.ecohainService.getUsersTransactions(
          element?.address,
        );
      }
    });
  }
}
