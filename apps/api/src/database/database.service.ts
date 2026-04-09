import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Reserved for a future thin SQL Server client that executes stored procedures only.
 */
@Injectable()
export class DatabaseService {
  constructor(private readonly config: ConfigService) {}

  getConnectionInfo() {
    return {
      host: this.config.get<string>('DB_HOST'),
      port: this.config.get<string>('DB_PORT'),
      database: this.config.get<string>('DB_NAME'),
      user: this.config.get<string>('DB_USER'),
      // Never log passwords
    };
  }
}
