import { Inject, Injectable } from '@nestjs/common';
import Moralis from 'moralis/node';

@Injectable()
export class MoralisHelper {
  constructor(
    @Inject('Moralis')
    private readonly moralis: Moralis,
  ) {}

  async watchEthAddress(address: string) {
    try {
      return await this.moralis.Cloud.run(
        'watchEthAddress',
        {
          address,
        },
        { useMasterKey: true },
      );
    } catch (err) {
      throw err;
    }
  }
}
