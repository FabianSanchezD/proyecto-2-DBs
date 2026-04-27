import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * Confirguración global de environment variables
 * Carga el .env desde cualquier directorio para todo el proyecto
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
      expandVariables: true,
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
