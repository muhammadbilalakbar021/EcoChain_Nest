import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
const { Ecocw3, Ecocjs } = require('ecoweb3');
const bip39 = require('bip39');
import * as bitcoin from 'bitcoinjs-lib';
import * as bip32utils from 'bip32-utils';
import * as hdnode from 'hdnode-js';
import * as bip44Constants from 'bip44-constants';
import * as coininfo from 'coininfo';
import * as HDKey from 'hdkey';
import { createHash } from 'crypto';
import * as bs58check from 'bs58check';
import * as wif from 'wif';
import { Address } from 'ethereumjs-util';
import { ConfigService } from 'src/api/config/config.service';
import { TransactionResponse } from 'src/api/utils/misc/enums';
import { SendEthInterface } from 'src/api/ecochain/interfaces/send-eth.interface';
import Web3 from 'web3';
const axios = require('axios');
import Common from '@ethereumjs/common'; //NEW ADDITION
import { config } from 'dotenv';
import { throws } from 'assert';
// const Tx = require('ethereumjs-tx');
const Tx = require('ethereumjs-tx').Transaction;

const unit = 'ECO';
let network = Ecocjs.networks.ecoc_testnet;
console.log('network = ', network);
// let main_network = Ecocjs.networks.ecoc;

@Injectable()
export class EcohainService {
  balance = 0;
  account_balances = {};
  transactions = [];
  arr = [
    {
      address: '0x959fd7ef9089b7142b6b908dc3a8af7aa8ff0fa1',
      balance: 0,
      transactions: [],
      constract: [
        {
          address: '0x1C8B751aC3809de3abc5BdBCAdF92a619C4626CF',
          balance: 0,
          txHashes: new Set(),
        },
      ],
    },
  ];

  constructor(
    @Inject('EcoWeb3')
    private readonly ecoWeb3: Web3,
    private readonly conifg: ConfigService,
  ) {}

  get addresses() {
    return this.arr;
  }

  async generateEthWallet(mnemonic) {
    try {
      const wallet = await this.createECDSA('ETH', mnemonic);
      console.log(wallet);
      this.account_balances[wallet.address] = 0;
      return {
        mnemonic: mnemonic,
        publicKey: wallet.public_key,
        private_key: wallet.private_key,
        address: wallet.address,
        coinSymbol: 'ECO',
      };
    } catch (error) {
      throw error;
    }
  }

  mnemonic() {
    return bip39.generateMnemonic();
  }

  /**
   * this method is used to create deposit addresses for each coin
   * @param symbol
   */
  async createECDSA(symbol: string, mnemonic: string) {
    /** get coin info */
    const coin = coininfo(symbol);
    console.log('coin', coin);
    /** step-1 generate seed */
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    /** step-2 create master wallet */
    const masterWallet = this.generateMasterHdWallet(seed, symbol);
    /** step-3 get derivation path, this path wil return only 1 child */
    let path;
    if (coin?.testnet) path = this.hdPath('');
    else path = this.hdPath(symbol);

    /** step-4 get child*/
    const child = masterWallet.derive(path);
    /** encode private keys wif format
     * https://en.bitcoin.it/wiki/Wallet_import_format
     * */
    if (coin) {
      const wif = this.privateKeyToWif(
        child.privateKey,
        coin.versions.private,
        true,
      );
      console.log('wif ', wif);
      return {
        wif,
        hd_path: path,
        public_key: child._publicKey.toString('hex'),
        private_key: child._privateKey.toString('hex'),
        seed: seed.toString('hex'),
        address: this.deriveBtcLikeAddress(child._publicKey, symbol),
      };
    } else {
      return {
        /** ignore versions*/
        hd_path: path,
        seed: seed.toString('hex'),
        public_key: child._publicKey.toString('hex'),
        private_key: child._privateKey.toString('hex'),
        wif: child._privateKey.toString('hex'),
        address: Address.fromPrivateKey(child._privateKey).toString(),
      };
    }
  }

  generateMasterHdWallet(seed: Buffer, symbol: any) {
    /**
     * version to prefix public and private keys for altcoins
     */
    const version = coininfo(symbol);
    return HDKey.fromMasterSeed(seed, version?.bip32);
  }

  deriveBtcLikeAddress(publicKey, symbol) {
    console.log('symbol', symbol);
    const sha256 = createHash('sha256').update(publicKey).digest();
    const rmd160 = createHash('rmd160').update(sha256).digest();

    const buffer = Buffer.allocUnsafe(21);
    const coinVersion = this.btcLikeAddressVersion(symbol);
    buffer.writeUInt8(coinVersion, 0);

    rmd160.copy(buffer, 1);
    const address = bs58check.encode(buffer);
    return address;
  }

  hdPath(symbol: string, account_index = 0) {
    const coinType = bip44Constants.findIndex(
      (item: string[]) => item[1] === symbol.toUpperCase(),
    );
    if (~coinType) {
      return `m/44'/${coinType}'/0'/0/${account_index}`;
    } else if (symbol == 'weth' || symbol == 'TEST') {
      return `m/44'/${2}'/0'/0/${account_index}`;
    } else {
      throw new Error('not bip44 compliant');
    }
  }

  privateKeyToWif(privateKey: any, version: any, compressed = true) {
    return wif.encode(version, privateKey, compressed);
  }

  btcLikeAddressVersion(symbol: any) {
    const coin = coininfo(symbol);
    return coin.versions.public;
  }

  // Web3
  async getTxConfirmations(blockNumber: number, blockchain: string) {
    if (blockchain === 'ecochain') {
      const currentBlock = await this.ecoWeb3.eth.getBlockNumber();
      return currentBlock - blockNumber;
    } else {
      return 'web3 does not support this blockchain';
    }
  }

  async getEcoBalance(walletAddress: string) {
    const balance: any = await this.ecoWeb3.eth.getBalance(walletAddress);
    return String(Number(balance) / Math.pow(10, 18));
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
        '0x959FD7Ef9089B7142B6B908Dc3A8af7Aa8ff0FA1',
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
        from: '0x959FD7Ef9089B7142B6B908Dc3A8af7Aa8ff0FA1',
        to: '0xD181fBE2dbE36396155dAC25d4b6B544970Ae476',
        value: this.ecoWeb3.utils.toHex(
          this.ecoWeb3.utils.toWei(1?.toString(), 'ether'),
        ),
        gasLimit: 21000,
        gasPrice: 20 * 1e9,
        nonce: nonce,
      };
      console.log('trx', trx);
      /* sign tx */
      const transaction = new Tx(trx, {
        chain: {
          name: 'Ecochain',
          networkId: 1120,
          chainId: 1120,
          url: 'https://rpc.ecochain.network',
          genesis: '',
          hardforks: 'london',
          bootstrapNodes: '',
        },
      });
      console.log('transaction', transaction);
      const signedTx = transaction.sign(
        Buffer.from(
          'abf82ff96b463e9d82b83cb9bb450fe87e6166d4db6d7021d0c71d7e960d5abe',
          'hex',
        ),
      );
      console.log('signedTx', signedTx);

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

  async getUsersTransactions(address) {
    const req = `?module=account&action=txlist&address=${address}`;
    return await this.ecoApi(req, 'get', {});
  }

  async getMultipleBalances() {
    if (Object.keys(this.account_balances).length == 0) return 0;
    const req = `?module=account&action=balancemulti&address=${Object.keys(
      this.account_balances,
    ).join(',')}`;
    const result = await this.ecoApi(req, 'get', {});
    return result;
  }

  async getTokenTxsOnUser(address) {
    const req = `?module=account&action=tokentx&address=${address}`;
    return await this.ecoApi(req, 'get', {});
  }

  // @Cron(CronExpression.EVERY_10_SECONDS)
  async updateUserBalance() {
    const b = await this.getMultipleBalances();
    if (b == 0) return;
    await b.reduce((prom, e) => {
      if (this.account_balances[e.account] == e.balance) return;
      else
        this.getUsersTransactions(e.account).then((x) => {
          x.forEach((E) => {
            var { from, to, value } = E;
            value = value / 1e18;
            console.log(
              'tx',
              this.transactions[E.hash],
              this.transactions[E.hash] == undefined,
              E.hash,
            );
            if (this.transactions[E.hash] == undefined)
              this.transactions[E.hash] = { from, to, value };
            console.log(this.transactions[E.hash]);
          });
          this.account_balances[e.account] = e.balance;
        });
    }, Promise.resolve(0));
  }

  async ecoApi(req, type, data) {
    const url = this.conifg.Eco_Chain_Api_Url + req;
    const result = await axios[type](url, type == 'post' ? data : '');
    return result.data.result;
  }

  async accountBalances() {
    return this.account_balances;
  }

  async getTransactions() {
    return this.transactions;
  }

  async coinTransfer(body) {
    try {
      const trxDetail = {
        to: body.to,
        from: body.from,
        value: body.value,
        privateKey: body.privateKey,
        memo: 'asfasfasdklfslfd;kl',
      };
      var privateKey = trxDetail.privateKey;
      var gasLimit = 200000;
      var gasPrice = 20 * 1e9;
      const nonce = await this.ecoWeb3.eth.getTransactionCount(
        trxDetail.from,
        'latest',
      );
      var txObject = {
        from: trxDetail.from,
        to: trxDetail.to,
        value: this.ecoWeb3.utils.toHex(
          this.ecoWeb3.utils.toWei(trxDetail.value?.toString(), 'ether'),
        ),
        gasLimit: this.ecoWeb3.utils.toHex(gasLimit),
        gasPrice: this.ecoWeb3.utils.toHex(gasPrice),
        nonce: nonce,
      };
      var tx = new Tx(txObject, {
        chain: {
          name: 'Ecochain',
          networkId: 1120,
          chainId: 1120,
          url: 'https://rpc.ecochain.network',
          genesis: '',
          hardforks: 'ethereum',
          bootstrapNodes: '',
        },
      });
      tx.sign(Buffer.from(privateKey, 'hex'));
      var serializedTx = tx.serialize();
      var rawTx = '0x' + serializedTx.toString('hex');
      var receipt = await this.ecoWeb3.eth.sendSignedTransaction(rawTx);
      console.log(receipt);
    } catch (err) {
      console.log(err);
      return;
    }
  }

  async createAndSignEcoLikeTx(body) {
    let pvt_key = body.privateKey;
    let txPayload = {
      from: body.from,
      to: body.to,
      amount: body.value,
      private_key: pvt_key,
    };
    try {
      const nonce = await this.ecoWeb3.eth.getTransactionCount(txPayload.from);
      console.log(nonce);
      /* create tx payload */
      const trx = {
        to: txPayload.to,
        value: this.ecoWeb3.utils.toHex(
          this.ecoWeb3.utils.toWei(txPayload.amount?.toString(), 'ether'),
        ),
        gasLimit: 200000,
        gasPrice: 20 * 1e9,
        nonce: nonce,
        chainId: 1120, // EIP 155 chainId - mainnet: 1, rinkeby: 4
      };

      const transaction = await this.ecoWeb3.eth.accounts.signTransaction(
        trx,
        txPayload.private_key,
      );
      const signedTx = await this.ecoWeb3.eth.sendSignedTransaction(
        transaction.rawTransaction,
      );
      console.log(signedTx);
      return signedTx?.transactionHash;
    } catch (error) {
      console.log('Error:', error);
    }
  }
}
