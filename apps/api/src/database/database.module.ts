import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

/**
 * Placeholder for SQL Server access via stored procedures (no ORM).
 */
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
