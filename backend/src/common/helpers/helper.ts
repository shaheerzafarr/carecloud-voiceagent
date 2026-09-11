import * as fs from 'node:fs/promises'; // Node 18+ supports fs/promises
import { SEARCH_CAPABILITIES } from '../constants/enums/enums';
import { randomBytes } from 'node:crypto';

// THIS FUNCTION IS USED TO RETURN ARRAY
export const returnArray = (message: string | string[]) =>
  Array.isArray(message) ? message : [message];

// THIS FUNCTION IS USED TO CREATE SLUG
export const createSlug = (name: string, count: number): string => {
  name = name?.replaceAll(/[^a-zA-Z0-9 ]/g, '').trim();

  let slug: string | undefined = undefined;

  if (name.length === 0)
    slug = `${
      Math.random().toString(36).substring(2, 7) +
      Math.random().toString(36).substring(2, 7)
    }`;
  else slug = `${name.replaceAll('', '-').toLowerCase()}`;

  return `${slug}-${count}`;
};

export function generateRandomPassword(length: number = 8): string {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

  const bytes = randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }

  return password;
}

// THIS FUNCTION IS USED TO GENERATE RANDOM KEY
export const randomKey = (): number =>
  Math.floor(10000 + Math.random() * 90000) + 123456;

// THIS FUNCTION IS USED TO GENERATE OTP CODE
export const generateOtpCode = (length: number = 6): number => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
};

export const convertUSDtoCents = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Matches PHP globals/prices.php: floor($final_price * $value) before number_format.
 * Uses a tiny epsilon so float noise does not undershoot the intended integer dollar.
 */
export function legacyPhpFloorPrice(
  finalPrice: number,
  multiplier: number,
): number {
  return Math.floor(finalPrice * multiplier + 1e-9);
};

export const createCookieConfiguration = ({
  httpOnly = true,
  secure = true,
  sameSite = 'none',
  partitioned = true,
  maxAge = 1000 * 60 * 60 * 24,
}: {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'none' | 'lax' | 'strict';
  partitioned?: boolean;
  maxAge?: number;
}) => {
  return {
    httpOnly,
    secure,
    sameSite,
    path: '/',
    maxAge,
    ...(partitioned ? { partitioned: true } : {}),
  };
};

export const getDataFromJson = async (path: string) => {
  const data = await fs.readFile(path, 'utf-8');
  const json = JSON.parse(data);
  return json;
};

export const getOperatorValue = (searchCapabilities: SEARCH_CAPABILITIES) => {
  const operators = {
    [SEARCH_CAPABILITIES.CONTAINS]: '$regex',
    [SEARCH_CAPABILITIES.ABSOLUTE]: '$eq',
    [SEARCH_CAPABILITIES.NOT_CONTAINS]: '$not',
    [SEARCH_CAPABILITIES.GREATER_THAN]: '$gt',
    [SEARCH_CAPABILITIES.LESS_THEN]: '$lt',
    [SEARCH_CAPABILITIES.EQUAL_TO]: '$eq',
    [SEARCH_CAPABILITIES.NOT_EQUAL_TO]: '$ne',
  };

  return operators[searchCapabilities];
};

export const getNested = (obj: any, path: string) => {
  return path.split('.').reduce((o, key) => (o ? o[key] : undefined), obj);
};

export const formatDomain = (domain: string) => {
  return domain.replace('https://', '').replace(/\/$/, '');
};
