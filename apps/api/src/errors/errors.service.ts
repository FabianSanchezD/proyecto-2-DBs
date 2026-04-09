import { Injectable } from '@nestjs/common';

@Injectable()
export class ErrorsService {
  listPlaceholder() {
    return { items: [], message: 'Errors module stub.' };
  }
}
