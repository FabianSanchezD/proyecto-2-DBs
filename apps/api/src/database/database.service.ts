import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sql from 'mssql';

export type LoginSpResult = {
  resultCode: number;
  userId: number | null;
  username: string | null;
};

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: sql.ConnectionPool | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.config.get<string>('DB_HOST');
    const port = Number(this.config.get<string>('DB_PORT') ?? '1433');
    const database = this.config.get<string>('DB_NAME');
    const user = this.config.get<string>('DB_USER');
    const password = this.config.get<string>('DB_PASSWORD');

    if (!host || !database || !user || password === undefined || password === '') {
      this.logger.warn('Database env incomplete; SQL pool not started.');
      return;
    }

    const poolConfig: sql.config = {
      server: host,
      port,
      database,
      user,
      password,
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    };

    this.pool = new sql.ConnectionPool(poolConfig);
    try {
      await this.pool.connect();
      this.logger.log('SQL Server pool connected.');
    } catch (err) {
      this.logger.error('SQL Server connection failed', err instanceof Error ? err.stack : err);
      await this.pool.close().catch(() => undefined);
      this.pool = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }

  getConnectionInfo() {
    return {
      host: this.config.get<string>('DB_HOST'),
      port: this.config.get<string>('DB_PORT'),
      database: this.config.get<string>('DB_NAME'),
      user: this.config.get<string>('DB_USER'),
    };
  }

  isReady(): boolean {
    return this.pool !== null && this.pool.connected;
  }

  private requirePool(): sql.ConnectionPool {
    if (!this.pool || !this.pool.connected) {
      throw new InternalServerErrorException({
        resultCode: 50008,
        message: 'Base de datos no disponible.',
      });
    }
    return this.pool;
  }

  async runAuthCheckLoginAvailability(username: string, clientIp: string): Promise<number> {
    const request = this.requirePool().request();
    request.input('inUsername', sql.NVarChar(200), username);
    request.input('inClientIP', sql.NVarChar(45), clientIp);
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spAuth_CheckLoginAvailability');
    const out = executed.output as Record<string, unknown>;
    return Number(out.outResultCode ?? 50008);
  }

  async runAuthLogin(username: string, password: string, clientIp: string): Promise<LoginSpResult> {
    const request = this.requirePool().request();
    request.input('inUsername', sql.NVarChar(200), username);
    request.input('inPassword', sql.NVarChar(500), password);
    request.input('inClientIP', sql.NVarChar(45), clientIp);
    request.output('outUserId', sql.Int);
    request.output('outUsername', sql.NVarChar(200));
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spAuth_Login');
    const out = executed.output as Record<string, unknown>;
    return {
      resultCode: Number(out.outResultCode ?? 50008),
      userId: out.outUserId === null || out.outUserId === undefined ? null : Number(out.outUserId),
      username:
        out.outUsername === null || out.outUsername === undefined
          ? null
          : String(out.outUsername),
    };
  }

  async runAuthLogout(userId: number, clientIp: string): Promise<number> {
    const request = this.requirePool().request();
    request.input('inUserId', sql.Int, userId);
    request.input('inClientIP', sql.NVarChar(45), clientIp);
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spAuth_Logout');
    const out = executed.output as Record<string, unknown>;
    return Number(out.outResultCode ?? 50008);
  }

  async getErrorDescription(codigo: number): Promise<string> {
    const request = this.requirePool().request();
    request.input('inCodigo', sql.Int, codigo);
    request.output('outDescripcion', sql.NVarChar(1000));
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spError_GetByCode');
    const out = executed.output as Record<string, unknown>;
    const text = out.outDescripcion === null || out.outDescripcion === undefined ? '' : String(out.outDescripcion);
    return text.trim() === '' ? 'Error de base de datos' : text;
  }
}
