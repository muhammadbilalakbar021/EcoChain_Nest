import { Inject, Injectable } from '@nestjs/common';
import Web3 from 'web3';
import Common from '@ethereumjs/common'; //NEW ADDITION
import { SendEthInterface } from '../interfaces/send-eth.interface';
import { Transaction as EthereumTx } from '@ethereumjs/tx';
import { SendErc20Interface } from '../interfaces/send-erc20.interface';
import erc20Abi from '../abis/erc20.abi';
import axios from 'axios';
import { TransactionResponse } from '../../utils/misc/enums';
import { ConfigService } from 'src/api/config/config.service';

@Injectable()
export class Web3Service {
  constructor(
    @Inject('EcoWeb3')
    private readonly ecoWeb3: Web3,
    private readonly conifg: ConfigService,
  ) {}

  async getTxConfirmations(blockNumber: number, blockchain: string) {
    if (blockchain === 'ecochain') {
      const currentBlock = await this.ecoWeb3.eth.getBlockNumber();
      return currentBlock - blockNumber;
    } else {
      return 'web3 does not support this blockchain';
    }
  }

  async getEcoBalance(walletAddress: string) {
    const balance = await this.ecoWeb3.eth.getBalance(walletAddress);
    return String(balance);
  }

  async getNetworkFee() {
    try {
      const gasPrice = await axios.get(
        'https://ethgasstation.info/api/ethgasAPI.json?',
      );
      return {
        networkFeeAvg: gasPrice.data.average,
        networkFeeMax: gasPrice.data.fastest,
        networkFeeMin: gasPrice.data.safeLow,
      };
    } catch (error) {
      console.log('Error in getting fee');
    }
  }

  async sendEthTrx(trxDetail: SendEthInterface) {
    console.log(trxDetail);
    try {
      const nonce = await this.ecoWeb3.eth.getTransactionCount(
        trxDetail.from,
        'latest',
      );
      let gasPriceInWei = Number(await this.ecoWeb3.eth.getGasPrice());
      let gasPriceFiat = this.ecoWeb3.utils.fromWei(gasPriceInWei.toString());
      const gasPrice = await axios.get(
        'https://ethgasstation.info/api/ethgasAPI.json?',
      );
      console.log('Eth gas Station', gasPrice.data.average);

      /* create tx payload */
      console.log('create tx payload');
      const trx = {
        to: trxDetail.to,
        value: this.ecoWeb3.utils.toHex(
          this.ecoWeb3.utils.toWei(trxDetail.value?.toString(), 'ether'),
        ),
        gasLimit: 21000,
        gasPrice: gasPrice.data.average * 1000000000,
        nonce: nonce,
        chainId: this.conifg.ETH_CHAIN_ID,
      };
      console.log('trx', trx);
      const common = new Common({ chain: this.conifg.ETH_CHAIN });
      /* sign tx */
      const transaction = EthereumTx.fromTxData(trx, {
        common,
      });
      const signedTx = transaction.sign(
        Buffer.from(trxDetail.privateKey, 'hex'),
      );
      /* send tx */
      const serializedTransaction = signedTx.serialize();
      const submittedTx = await this.ecoWeb3.eth.sendSignedTransaction(
        '0x' + serializedTransaction.toString('hex'),
      );

      console.log('tx ', submittedTx);

      console.log('Transaction Completed');
      const filter = { withdrawMemo: trxDetail.memo, kind: 'withdraw' };
      const updation = { externalTransactionId: submittedTx.transactionHash };
      console.log('filter', filter);
      console.log('updation', updation);
      if (submittedTx?.transactionHash) {
        return TransactionResponse.SUCCESS;
      } else {
        return TransactionResponse.ERROR;
      }
    } catch (error) {
      console.log(error);
      return TransactionResponse.ERROR;
    }
  }
}
