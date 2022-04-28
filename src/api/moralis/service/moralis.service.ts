import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  paymentTypeEnum,
  PaymentStatusEnum,
  memoTypeEnum,
} from 'src/api/utils/misc/enums';

@Injectable()
export class MoralisService {
  constructor() {}

  async transactionWebhook(trx, assetCode) {
    console.log('Transaction Received on Moralis Hook');
    const transformedTransaction = await this.moralisTransactionTransformer(
      trx,
      assetCode,
    );

    await this.createMoralisTransaction(transformedTransaction);
  }

  async moralisTransactionTransformer(tx, assetCode): Promise<any> {
    return {
      assetCode: assetCode.toUpperCase(),
      type: 'Received',
      hash: tx.hash,
      confirmed: tx.confirmed,
      confirmations: 6,
      fromAddress: tx.from_address,
      address: tx.to_address,
      lock_time: tx.block_number,
      fees: 0,
      amount: Number(tx.value) / 1e18,
    };
  }

  async createMoralisTransaction(transaction) {
    console.log('Going to create the transaction');

    const newTransaction = {
      from: transaction.fromAddress,
      assetCode: transaction.assetCode.toUpperCase(),
      externalTransactionId: transaction.hash,
      confirmations: 6,
      to: transaction.address,
      kind: paymentTypeEnum.deposit,
      status:
        transaction.amount > 0
          ? PaymentStatusEnum.pending_anchor
          : PaymentStatusEnum.too_small,
      statusMessage: `${transaction.amount}-${transaction.assetCode}-deposit received`,
      amountIn: transaction.amount,
      externalExtra: 'externalToAddress',
      externalExtraText: transaction.address,
      amountFee: 'otherFee',
      xaccount: 'userId',
      // As we are keeping the user stellar wallet in user so adding userId deposit memo.
      depositMemo: createHash('sha256')
        .update('userId' + Date.now().toString())
        .digest('hex'),
      depositMemoType: memoTypeEnum.text,
      externalTransactionBlockNo: transaction.lock_time,
    };

    console.log('Recieved Transaction : ', newTransaction);
  }
}
