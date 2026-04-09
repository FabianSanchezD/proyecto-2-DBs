import { Controller, Get } from '@nestjs/common';
import type { ApiHealthResponse } from '@vacation-control/types';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health(): ApiHealthResponse {
    return this.appService.getHealth();
  }
}
