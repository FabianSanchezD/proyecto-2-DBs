import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

export type LoginSpResult = {
  resultCode: number;
  userId: number | null;
  username: string | null;
};

export type PuestoRow = {
  Id: number;
  Nombre: string;
  SalarioxHora: number;
};

export type TipoMovimientoRow = {
  Id: number;
  Nombre: string;
  TipoAccion: string;
};

export type EmpleadoRow = {
  Id: number;
  ValorDocumentoIdentidad: string;
  Nombre: string;
  IdPuesto: number;
  NombrePuesto: string;
  SaldoVacaciones: number;
  FechaContratacion: string;
};

export type MovimientoRow = {
  Id: number;
  Fecha: string;
  NombreTipoMovimiento: string;
  Monto: number;
  NuevoSaldo: number;
  NombreUsuario: string;
  PostInIP: string;
  PostTime: string;
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

  // ── Auth ──────────────────────────────────────────────────────────────────

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

  // ── Puestos ───────────────────────────────────────────────────────────────

  async runPuestoList(): Promise<PuestoRow[]> {
    const request = this.requirePool().request();
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spPuesto_List');
    const out = executed.output as Record<string, unknown>;
    if (Number(out.outResultCode ?? 50008) !== 0) return [];
    return executed.recordset as PuestoRow[];
  }

  // ── TipoMovimiento ────────────────────────────────────────────────────────

  async runTipoMovimientoList(): Promise<TipoMovimientoRow[]> {
    const request = this.requirePool().request();
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spTipoMovimiento_List');
    const out = executed.output as Record<string, unknown>;
    if (Number(out.outResultCode ?? 50008) !== 0) return [];
    return executed.recordset as TipoMovimientoRow[];
  }

  // ── Empleados ─────────────────────────────────────────────────────────────

  async runEmpleadoList(
    filter: string,
    userId: number,
    clientIp: string,
  ): Promise<{ resultCode: number; items: EmpleadoRow[] }> {
    const request = this.requirePool().request();
    request.input('inFilter', sql.NVarChar(300), filter);
    request.input('inUserId', sql.Int, userId);
    request.input('inClientIP', sql.NVarChar(45), clientIp);
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spEmpleado_List');
    const out = executed.output as Record<string, unknown>;
    const resultCode = Number(out.outResultCode ?? 50008);
    return { resultCode, items: resultCode === 0 ? (executed.recordset as EmpleadoRow[]) : [] };
  }

  async runEmpleadoGetById(id: number): Promise<{ resultCode: number; item: EmpleadoRow | null }> {
    const request = this.requirePool().request();
    request.input('inId', sql.Int, id);
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spEmpleado_GetById');
    const out = executed.output as Record<string, unknown>;
    const resultCode = Number(out.outResultCode ?? 50008);
    const rows = executed.recordset as EmpleadoRow[];
    return { resultCode, item: rows.length > 0 ? rows[0] : null };
  }

  async runEmpleadoInsert(
    valorDocumentoIdentidad: string,
    nombre: string,
    idPuesto: number,
    fechaContratacion: string,
    userId: number,
    clientIp: string,
  ): Promise<number> {
    const request = this.requirePool().request();
    request.input('inValorDocumentoIdentidad', sql.NVarChar(50), valorDocumentoIdentidad);
    request.input('inNombre', sql.NVarChar(300), nombre);
    request.input('inIdPuesto', sql.Int, idPuesto);
    request.input('inFechaContratacion', sql.Date, fechaContratacion);
    request.input('inUserId', sql.Int, userId);
    request.input('inClientIP', sql.NVarChar(45), clientIp);
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spEmpleado_Insert');
    const out = executed.output as Record<string, unknown>;
    return Number(out.outResultCode ?? 50008);
  }

  async runEmpleadoUpdate(
    id: number,
    valorDocumentoIdentidad: string,
    nombre: string,
    idPuesto: number,
    userId: number,
    clientIp: string,
  ): Promise<number> {
    const request = this.requirePool().request();
    request.input('inId', sql.Int, id);
    request.input('inValorDocumentoIdentidad', sql.NVarChar(50), valorDocumentoIdentidad);
    request.input('inNombre', sql.NVarChar(300), nombre);
    request.input('inIdPuesto', sql.Int, idPuesto);
    request.input('inUserId', sql.Int, userId);
    request.input('inClientIP', sql.NVarChar(45), clientIp);
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spEmpleado_Update');
    const out = executed.output as Record<string, unknown>;
    return Number(out.outResultCode ?? 50008);
  }

  async runEmpleadoLogDeleteAttempt(id: number, userId: number, clientIp: string): Promise<number> {
    const request = this.requirePool().request();
    request.input('inId', sql.Int, id);
    request.input('inUserId', sql.Int, userId);
    request.input('inClientIP', sql.NVarChar(45), clientIp);
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spEmpleado_LogDeleteAttempt');
    const out = executed.output as Record<string, unknown>;
    return Number(out.outResultCode ?? 50008);
  }

  async runEmpleadoDelete(id: number, userId: number, clientIp: string): Promise<number> {
    const request = this.requirePool().request();
    request.input('inId', sql.Int, id);
    request.input('inUserId', sql.Int, userId);
    request.input('inClientIP', sql.NVarChar(45), clientIp);
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spEmpleado_Delete');
    const out = executed.output as Record<string, unknown>;
    return Number(out.outResultCode ?? 50008);
  }

  // ── Movimientos ───────────────────────────────────────────────────────────

  async runMovimientoList(
    empleadoId: number,
  ): Promise<{ resultCode: number; items: MovimientoRow[] }> {
    const request = this.requirePool().request();
    request.input('inEmpleadoId', sql.Int, empleadoId);
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spMovimiento_List');
    const out = executed.output as Record<string, unknown>;
    const resultCode = Number(out.outResultCode ?? 50008);
    return { resultCode, items: resultCode === 0 ? (executed.recordset as MovimientoRow[]) : [] };
  }

  async runMovimientoInsert(
    empleadoId: number,
    idTipoMovimiento: number,
    fecha: string,
    monto: number,
    userId: number,
    clientIp: string,
  ): Promise<number> {
    const request = this.requirePool().request();
    request.input('inEmpleadoId', sql.Int, empleadoId);
    request.input('inIdTipoMovimiento', sql.Int, idTipoMovimiento);
    request.input('inFecha', sql.Date, fecha);
    request.input('inMonto', sql.Decimal(9, 2), monto);
    request.input('inUserId', sql.Int, userId);
    request.input('inClientIP', sql.NVarChar(45), clientIp);
    request.output('outResultCode', sql.Int);
    const executed = await request.execute('dbo.spMovimiento_Insert');
    const out = executed.output as Record<string, unknown>;
    return Number(out.outResultCode ?? 50008);
  }
}
