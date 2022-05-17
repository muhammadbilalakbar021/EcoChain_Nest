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
    let addresses = this.ecohainService.arr;
    await addresses.reduce(async (prom, element) => {
      await prom;
      let balance = await this.ecohainService.getEcoBalance(element?.address);
      if (Number(balance) > element.balance) {
        element.balance = Number(balance);
        element.transactions = await this.ecohainService.getUsersTransactions(
          element?.address,
        );
      }
    }, Promise.resolve());
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCronForTokens() {
    this.logger.debug('CronJob for Token Balances');
    let addresses = this.ecohainService.arr;
    if (this.ecohainService.arr.length == 0) return;
    await addresses.reduce(async (prom, element) => {
      await prom;
      let tokentxs = await this.ecohainService.getTokenTxsOnUser(
        element.address,
      );
      const getUniqueTokens = new Set();
      tokentxs.forEach((e) => {
        getUniqueTokens.add(e.contractAddress);
      });
      getUniqueTokens.forEach((x: string) => {
        const txs = tokentxs.filter(
          (e) => e.contractAddress.toUpperCase() === x.toUpperCase(),
        );
        var balance = 0;
        txs.forEach((e) => {
          if (e.to.toUpperCase() == element.address.toUpperCase())
            balance += +e.value;
          else balance -= +e.value;
        });
        balance = balance / 1e18;
        var ind = element.constract.findIndex(
          (e) => e.address.toUpperCase() == x.toUpperCase(),
        );
        if (ind >= 0) {
          element.constract[ind].address = x.toUpperCase();
          element.constract[ind].balance = balance;
          element.constract[ind].txHashes = txs;
        } else
          element.constract.push({
            address: x.toUpperCase(),
            balance,
            txHashes: txs,
          });
      });
    }, Promise.resolve());
    console.log(JSON.stringify(this.ecohainService.arr));
  }
}
