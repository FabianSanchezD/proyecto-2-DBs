import { Injectable } from '@nestjs/common';
import type { ApiHealthResponse } from '@vacation-control/types';

@Injectable()
export class AppService {
  getHealth(): ApiHealthResponse {
    return {
      status: 'ok',
      service: 'vacation-control-api',
      timestamp: new Date().toISOString(),
    };
  }
}
