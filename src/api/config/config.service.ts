import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import { Injectable } from '@nestjs/common';
import { ConfigInterface } from './interface/config.interface';
import { ConsoleService } from '../utils/console/console.service';
const consoleService = new ConsoleService();

@Injectable()
export class ConfigService {
  private readonly envConfig: ConfigInterface;
  constructor() {
    dotenv.config({ path: `env/.env.${process.env.NODE_ENV}` });
    const config: { [name: string]: string } = process.env;
    const parsedConfig = JSON.parse(JSON.stringify(config));
    this.envConfig = this.validateInput(parsedConfig);
  }

  private validateInput = (envConfig): ConfigInterface => {
    const envVarSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .required()
        .valid(
          'development',
          'production',
          'staging',
          'provision',
          'inspection',
        )
        .default('development'),
      PORT: Joi.number().optional(),
      ETH_RPC_URL: Joi.string().optional(),
      ETH_EXPLORER: Joi.string().optional(),
      ETH_CHAIN: Joi.string().optional(),
      ETH_CHAIN_ID: Joi.string().optional(),
      BSC_EXPLORER: Joi.string().optional(),
      BSC_RPC_URL: Joi.string().optional(),
      BSC_CHAIN: Joi.string().optional(),
      BSC_CHAIN_ID: Joi.string().optional(),
      DOMAIN_NAME: Joi.string().optional(),
      TRON_GRID_TEST_NET: Joi.string().optional(),
      TRON_GRID: Joi.string().optional(),
    });

    const { error, value: validatedEnvConfig } = envVarSchema.validate(
      envConfig,
      {
        abortEarly: false,
        allowUnknown: true,
      },
    );
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    consoleService.print('Joi Schema Verified in config.service.ts');
    return validatedEnvConfig;
  };

  get nodeEnv(): string {
    return this.envConfig.NODE_ENV;
  }

  get port(): string {
    return this.envConfig.PORT;
  }

  get ETH_RPC_URL(): string {
    return this.envConfig.ETH_RPC_URL;
  }

  get ETH_EXPLORER(): string {
    return this.envConfig.ETH_EXPLORER;
  }

  get ETH_CHAIN(): string {
    return this.envConfig.ETH_CHAIN;
  }

  get ETH_CHAIN_ID(): string {
    return this.envConfig.ETH_CHAIN_ID;
  }
}
