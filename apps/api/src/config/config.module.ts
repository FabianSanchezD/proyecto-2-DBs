import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * Global environment configuration.
 * Loads `.env` / `.env.local` from the api app cwd (repo root when run via turbo).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
