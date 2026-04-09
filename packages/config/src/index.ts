/**
 * Minimal shared config helpers for clients and tooling.
 * NestJS apps should still use @nestjs/config in the API.
 */

export interface DatabaseEnv {
  DB_HOST: string;
  DB_PORT: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}

export function readEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

export function requireEnv(key: string): string {
  const value = readEnv(key);
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
