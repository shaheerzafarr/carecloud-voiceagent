import { Inject, Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import crypto from 'node:crypto';
import { EnvConfig } from './config.interface';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(
    @Inject('CONFIG_OPTIONS') private readonly options: Record<string, any>,
  ) {
    const envFile = path.resolve(
      process.cwd(),
      'env',
      `.env.${process.env.NODE_ENV || 'development'}`,
    );

    if (!fs.existsSync(envFile)) {
      throw new Error(`Config file ${envFile} does not exist`);
    }

    try {
      const config = dotenv.parse(fs.readFileSync(envFile));
      this.envConfig = { ...config, ...process.env } as EnvConfig;
    } catch (error) {
      throw new Error(`Error reading config file ${envFile}: ${error.message}`);
    }
  }

  get(key: string): string {
    const value = this.envConfig[key];
    if (!value) {
      console.log(`Config key "${key}" not found`);
      return '';
    }
    return value;
  }

  encrypt(value: string): string {
    const key = Buffer.from(this.get('ENCRYPTION_KEY'), 'utf8').slice(0, 16);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);

    let encrypted = cipher.update(value, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return iv.toString('base64') + '.' + encrypted;
  }

  decrypt(value: string): string {
    const [iv, encrypted] = value.split('.');
    const key = Buffer.from(this.get('ENCRYPTION_KEY'), 'utf8').slice(0, 16);

    const decipher = crypto.createDecipheriv(
      'aes-128-cbc',
      key,
      Buffer.from(iv, 'base64'),
    );

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
