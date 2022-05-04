import { MoralisHelper } from './../../moralis/helpers/moralis.helper';
import { Injectable } from '@nestjs/common';
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

const unit = 'ECO';
let network = Ecocjs.networks.ecoc_testnet;
console.log('network = ', network);
// let main_network = Ecocjs.networks.ecoc;

@Injectable()
export class EcohainService {
  constructor(private readonly moralisHelper: MoralisHelper) {}

  async generateEthWallet(mnemonic) {
    try {
      const wallet = await this.createECDSA('ETH', mnemonic);
      await this.moralisHelper.watchEthAddress(wallet.address);

      return {
        mnemonic: mnemonic,
        publicKey: wallet.public_key,
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
}
