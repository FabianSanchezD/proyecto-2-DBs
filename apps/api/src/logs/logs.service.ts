import { Injectable } from '@nestjs/common';

@Injectable()
export class LogsService {
  listPlaceholder() {
    return { items: [], message: 'Logs module stub.' };
  }
}
