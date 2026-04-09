import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { MovementsModule } from './movements/movements.module';
import { LogsModule } from './logs/logs.module';
import { ErrorsModule } from './errors/errors.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    EmployeesModule,
    MovementsModule,
    LogsModule,
    ErrorsModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
